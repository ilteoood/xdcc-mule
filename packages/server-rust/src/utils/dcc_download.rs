use anyhow::{anyhow, Result};
use std::path::Path;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::sync::mpsc;

use super::irc_client::DccOffer;

pub struct DccDownload {
    pub offer: DccOffer,
    pub download_path: String,
    pub progress_sender: Option<mpsc::UnboundedSender<DownloadProgress>>,
}

#[derive(Debug, Clone)]
pub struct DownloadProgress {
    pub bytes_received: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub finished: bool,
    pub error: Option<String>,
}

impl DccDownload {
    pub fn new(offer: DccOffer, download_path: String) -> Self {
        Self {
            offer,
            download_path,
            progress_sender: None,
        }
    }

    pub fn with_progress_sender(mut self, sender: mpsc::UnboundedSender<DownloadProgress>) -> Self {
        self.progress_sender = Some(sender);
        self
    }

    pub async fn start_download(&self) -> Result<()> {
        log::info!(
            "Starting DCC download: {} from {}:{}",
            self.offer.filename,
            self.offer.ip,
            self.offer.port
        );

        // Connect to the DCC server
        let mut stream = TcpStream::connect((self.offer.ip.as_str(), self.offer.port)).await
            .map_err(|e| anyhow!("Failed to connect to DCC server: {}", e))?;

        // Create the output file
        let file_path = Path::new(&self.download_path).join(&self.offer.filename);
        let mut file = File::create(&file_path).await
            .map_err(|e| anyhow!("Failed to create file {}: {}", file_path.display(), e))?;

        let mut buffer = vec![0u8; 8192]; // 8KB buffer
        let mut bytes_received = 0u64;
        let total_bytes = self.offer.filesize;

        // Send initial progress
        self.send_progress(bytes_received, total_bytes, false, None).await;

        loop {
            match stream.read(&mut buffer).await {
                Ok(0) => {
                    // Connection closed
                    log::info!("DCC download completed: {}", self.offer.filename);
                    self.send_progress(bytes_received, total_bytes, true, None).await;
                    break;
                }
                Ok(n) => {
                    // Write the data to file
                    file.write_all(&buffer[..n]).await
                        .map_err(|e| anyhow!("Failed to write to file: {}", e))?;

                    bytes_received += n as u64;

                    // Send acknowledgment (required by DCC protocol)
                    let ack_bytes = bytes_received.to_be_bytes();
                    if let Err(e) = stream.write_all(&ack_bytes).await {
                        log::warn!("Failed to send DCC acknowledgment: {}", e);
                    }

                    // Send progress update
                    self.send_progress(bytes_received, total_bytes, false, None).await;

                    // Check if we've received all expected bytes
                    if total_bytes > 0 && bytes_received >= total_bytes {
                        log::info!("DCC download completed: {} ({} bytes)", self.offer.filename, bytes_received);
                        self.send_progress(bytes_received, total_bytes, true, None).await;
                        break;
                    }
                }
                Err(e) => {
                    let error_msg = format!("DCC download error: {}", e);
                    log::error!("{}", error_msg);
                    self.send_progress(bytes_received, total_bytes, true, Some(error_msg)).await;
                    return Err(anyhow!("DCC download failed: {}", e));
                }
            }
        }

        // Ensure file is properly closed
        file.sync_all().await?;

        Ok(())
    }

    async fn send_progress(&self, bytes_received: u64, total_bytes: u64, finished: bool, error: Option<String>) {
        if let Some(ref sender) = self.progress_sender {
            let percentage = if total_bytes > 0 {
                (bytes_received as f64 / total_bytes as f64) * 100.0
            } else {
                0.0
            };

            let progress = DownloadProgress {
                bytes_received,
                total_bytes,
                percentage,
                finished,
                error,
            };

            if let Err(_) = sender.send(progress) {
                log::warn!("Failed to send progress update");
            }
        }
    }
}
