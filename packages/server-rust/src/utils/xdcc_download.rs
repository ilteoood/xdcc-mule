use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio::time::{timeout, Duration};
use uuid::Uuid;

use super::dcc_download::DccDownload;
use super::irc_client::{DccOffer, XdccIrcClient};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Connecting,
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub id: String,
    pub filename: String,
    pub server: String,
    pub channel: String,
    pub bot: String,
    pub pack: String,
    pub status: DownloadStatus,
    pub progress: u64,
    pub total_size: Option<u64>,
    pub download_path: Option<String>,
    pub error: Option<String>,
}

pub struct XdccDownloadManager {
    downloads: Arc<RwLock<HashMap<String, DownloadProgress>>>,
    download_path: PathBuf,
    irc_clients: Arc<Mutex<HashMap<String, XdccIrcClient>>>,
}

impl XdccDownloadManager {
    pub fn new(download_path: PathBuf) -> Self {
        Self {
            downloads: Arc::new(RwLock::new(HashMap::new())),
            download_path,
            irc_clients: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn get_downloads(&self) -> Vec<DownloadProgress> {
        let downloads = self.downloads.read().await;
        downloads.values().cloned().collect()
    }

    pub async fn get_download(&self, id: &str) -> Option<DownloadProgress> {
        let downloads = self.downloads.read().await;
        downloads.get(id).cloned()
    }

    pub async fn cancel_download(&self, id: &str) -> Result<()> {
        let mut downloads = self.downloads.write().await;
        if let Some(download) = downloads.get_mut(id) {
            download.status = DownloadStatus::Cancelled;
            Ok(())
        } else {
            Err(anyhow!("Download not found"))
        }
    }

    pub async fn start_download_with_id(
        &self,
        id: &str,
        server: &str,
        channel: &str,
        bot: &str,
        pack: &str,
        filename: &str,
        nickname: &str,
    ) -> Result<String> {
        let progress = DownloadProgress {
            id: id.to_string(),
            filename: filename.to_string(),
            server: server.to_string(),
            channel: channel.to_string(),
            bot: bot.to_string(),
            pack: pack.to_string(),
            status: DownloadStatus::Pending,
            progress: 0,
            total_size: None,
            download_path: None,
            error: None,
        };

        // Check if already downloading
        {
            let downloads = self.downloads.read().await;
            if let Some(existing) = downloads.get(id) {
                match existing.status {
                    DownloadStatus::Pending | DownloadStatus::Connecting | DownloadStatus::Downloading => {
                        return Err(anyhow!("Download already in progress"));
                    }
                    _ => {
                        // Allow restart of completed/failed/cancelled downloads
                    }
                }
            }
        }

        // Add to downloads
        {
            let mut downloads = self.downloads.write().await;
            downloads.insert(id.to_string(), progress);
        }

        // Start the download process
        let downloads_clone = self.downloads.clone();
        let download_path = self.download_path.clone();
        let irc_clients = self.irc_clients.clone();

        let id_clone = id.to_string();
        let server_clone = server.to_string();
        let channel_clone = channel.to_string();
        let bot_clone = bot.to_string();
        let pack_clone = pack.to_string();
        let filename_clone = filename.to_string();
        let nickname_clone = nickname.to_string();
        let id_for_error = id.to_string();

        tokio::spawn(async move {
            if let Err(e) = Self::perform_download(
                downloads_clone.clone(),
                download_path,
                irc_clients,
                id_clone,
                server_clone,
                channel_clone,
                bot_clone,
                pack_clone,
                filename_clone,
                nickname_clone,
            ).await {
                log::error!("Download failed: {}", e);
                // Update status to failed
                let mut downloads = downloads_clone.write().await;
                if let Some(download) = downloads.get_mut(&id_for_error) {
                    download.status = DownloadStatus::Failed;
                    download.error = Some(e.to_string());
                }
            }
        });

        Ok(id.to_string())
    }

    pub async fn start_download(
        &self,
        server: &str,
        channel: &str,
        bot: &str,
        pack: &str,
        filename: &str,
        nickname: &str,
    ) -> Result<String> {
        let id = Uuid::new_v4().to_string();

        let progress = DownloadProgress {
            id: id.clone(),
            filename: filename.to_string(),
            server: server.to_string(),
            channel: channel.to_string(),
            bot: bot.to_string(),
            pack: pack.to_string(),
            status: DownloadStatus::Pending,
            progress: 0,
            total_size: None,
            download_path: None,
            error: None,
        };

        // Add to downloads
        {
            let mut downloads = self.downloads.write().await;
            downloads.insert(id.clone(), progress);
        }

        // Start the download process
        let downloads_clone = self.downloads.clone();
        let download_path = self.download_path.clone();
        let irc_clients = self.irc_clients.clone();

        let id_clone = id.clone();
        let server_clone = server.to_string();
        let channel_clone = channel.to_string();
        let bot_clone = bot.to_string();
        let pack_clone = pack.to_string();
        let filename_clone = filename.to_string();
        let nickname_clone = nickname.to_string();
        let id_for_error = id.clone();

        tokio::spawn(async move {
            if let Err(e) = Self::perform_download(
                downloads_clone.clone(),
                download_path,
                irc_clients,
                id_clone,
                server_clone,
                channel_clone,
                bot_clone,
                pack_clone,
                filename_clone,
                nickname_clone,
            ).await {
                log::error!("Download failed: {}", e);
                // Update status to failed
                let mut downloads = downloads_clone.write().await;
                if let Some(download) = downloads.get_mut(&id_for_error) {
                    download.status = DownloadStatus::Failed;
                    download.error = Some(e.to_string());
                }
            }
        });

        Ok(id)
    }

    async fn perform_download(
        downloads: Arc<RwLock<HashMap<String, DownloadProgress>>>,
        download_path: PathBuf,
        irc_clients: Arc<Mutex<HashMap<String, XdccIrcClient>>>,
        id: String,
        server: String,
        channel: String,
        bot: String,
        pack: String,
        filename: String,
        nickname: String,
    ) -> Result<()> {
        // Update status to connecting
        {
            let mut downloads_guard = downloads.write().await;
            if let Some(download) = downloads_guard.get_mut(&id) {
                download.status = DownloadStatus::Connecting;
            }
        }

        // Get or create IRC client for this server
        let mut irc_client = {
            let mut clients = irc_clients.lock().await;

            if let Some(client) = clients.remove(&server) {
                client
            } else {
                let channels = vec![channel.clone()];
                let mut client = XdccIrcClient::new(&server, &nickname, channels).await?;
                client.identify().await?;
                
                // Wait for connection and channel join before proceeding
                client.wait_for_connection(&channel).await?;
                
                client
            }
        };

        // Create DCC handler
        let (dcc_tx, mut dcc_rx) = mpsc::unbounded_channel::<DccOffer>();
        let handler_key = format!("{}-{}", bot, filename);
        irc_client.register_dcc_handler(handler_key.clone(), dcc_tx).await;

        log::info!("Registered DCC handler with key: {}", handler_key);

        // Request the pack
        let xdcc_command = format!("xdcc send #{}", pack);
        log::info!("Sending XDCC request to {}: {}", bot, xdcc_command);
        irc_client.send_privmsg(&bot, &xdcc_command).await?;

        // Start IRC message loop in background
        let mut irc_client_loop = irc_client;
        tokio::spawn(async move {
            if let Err(e) = irc_client_loop.run_message_loop().await {
                log::error!("IRC message loop error: {}", e);
            }
        });

        // Wait for DCC offer with timeout
        let dcc_offer = match timeout(Duration::from_secs(60), dcc_rx.recv()).await {
            Ok(Some(offer)) => offer,
            Ok(None) => return Err(anyhow!("DCC channel closed")),
            Err(_) => return Err(anyhow!("Timeout waiting for DCC offer")),
        };

        log::info!("Received DCC offer for {}: {}:{}", filename, dcc_offer.ip, dcc_offer.port);

        // Update download info
        {
            let mut downloads_guard = downloads.write().await;
            if let Some(download) = downloads_guard.get_mut(&id) {
                download.status = DownloadStatus::Downloading;
                download.total_size = Some(dcc_offer.filesize);
            }
        }

        // Start DCC download
        let output_path = download_path.join(&filename);

        // Create progress channel for DCC download
        let (progress_tx, mut progress_rx) = mpsc::unbounded_channel();

        let downloader = DccDownload::new(dcc_offer, output_path.to_string_lossy().to_string())
            .with_progress_sender(progress_tx);

        // Start progress monitoring task
        let downloads_for_progress = downloads.clone();
        let id_for_progress = id.clone();

        tokio::spawn(async move {
            while let Some(progress) = progress_rx.recv().await {
                let mut downloads_guard = downloads_for_progress.write().await;
                if let Some(download) = downloads_guard.get_mut(&id_for_progress) {
                    download.progress = progress.bytes_received;

                    if progress.finished {
                        if let Some(error) = progress.error {
                            download.status = DownloadStatus::Failed;
                            download.error = Some(error);
                        } else {
                            download.status = DownloadStatus::Completed;
                        }
                        break;
                    }
                }
            }
        });

        // Start the actual download
        downloader.start_download().await?;

        // Update final status
        {
            let mut downloads_guard = downloads.write().await;
            if let Some(download) = downloads_guard.get_mut(&id) {
                download.status = DownloadStatus::Completed;
                download.download_path = Some(output_path.to_string_lossy().to_string());
            }
        }

        Ok(())
    }
}
