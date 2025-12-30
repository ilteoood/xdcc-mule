use anyhow::{anyhow, Result};
use irc::client::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio::time::{timeout, Duration};
use futures::StreamExt;

#[derive(Debug, Clone)]
pub struct DccOffer {
    pub filename: String,
    pub ip: String,
    pub port: u16,
    pub filesize: u64,
    pub from_nick: String,
}

impl DccOffer {
    pub fn parse_from_ctcp(message: &str, from_nick: &str) -> Result<Self> {
        // CTCP DCC SEND format: "DCC SEND filename ip port filesize"
        let parts: Vec<&str> = message.split_whitespace().collect();

        if parts.len() >= 5 && parts[0] == "DCC" && parts[1] == "SEND" {
            let filename = parts[2].to_string();
            let ip_num: u32 = parts[3].parse()?;
            let port: u16 = parts[4].parse()?;
            let filesize: u64 = if parts.len() > 5 { parts[5].parse()? } else { 0 };

            // Convert IP from integer to dotted decimal
            let ip = format!(
                "{}.{}.{}.{}",
                (ip_num >> 24) & 0xFF,
                (ip_num >> 16) & 0xFF,
                (ip_num >> 8) & 0xFF,
                ip_num & 0xFF
            );

            Ok(DccOffer {
                filename,
                ip,
                port,
                filesize,
                from_nick: from_nick.to_string(),
            })
        } else {
            Err(anyhow!("Invalid DCC SEND format"))
        }
    }
}

pub struct XdccIrcClient {
    client: Client,
    dcc_handlers: Arc<Mutex<HashMap<String, mpsc::UnboundedSender<DccOffer>>>>,
    ready: Arc<Mutex<bool>>,
}

impl XdccIrcClient {
    pub async fn new(server: &str, nickname: &str, channels: Vec<String>) -> Result<Self> {
        let config = Config {
            nickname: Some(nickname.to_string()),
            server: Some(server.to_string()),
            port: Some(6667), // Use standard non-TLS IRC port
            use_tls: Some(false), // Disable TLS to avoid certificate issues
            channels,
            ..Config::default()
        };

        let client = Client::from_config(config).await?;

        Ok(XdccIrcClient {
            client,
            dcc_handlers: Arc::new(Mutex::new(HashMap::new())),
            ready: Arc::new(Mutex::new(false)),
        })
    }

    pub async fn identify(&mut self) -> Result<()> {
        self.client.identify()?;
        Ok(())
    }

    pub async fn wait_for_connection(&mut self, channel: &str) -> Result<()> {
        // Simple approach: wait a few seconds for the automatic connection and join to complete
        tokio::time::sleep(Duration::from_secs(5)).await;
        
        // Verify we're connected by trying to send a simple command
        match self.client.list_channels() {
            Ok(_) => {
                log::info!("IRC client appears to be connected and ready");
                let mut ready = self.ready.lock().await;
                *ready = true;
                Ok(())
            }
            Err(e) => {
                log::warn!("IRC client may not be fully ready: {}", e);
                // Still proceed as the connection might work
                let mut ready = self.ready.lock().await;
                *ready = true;
                Ok(())
            }
        }
    }

    pub async fn send_privmsg(&self, target: &str, message: &str) -> Result<()> {
        self.client.send_privmsg(target, message)?;
        Ok(())
    }

    pub async fn register_dcc_handler(&self, key: String, sender: mpsc::UnboundedSender<DccOffer>) {
        let mut handlers = self.dcc_handlers.lock().await;
        handlers.insert(key, sender);
    }

    pub async fn run_message_loop(&mut self) -> Result<()> {
        let mut stream = self.client.stream()?;
        let ready = self.ready.clone();

        while let Some(message) = stream.next().await.transpose()? {
            // Check for connection events
            match &message.command {
                Command::Response(Response::RPL_WELCOME, _) => {
                    log::info!("Connected to IRC server");
                }
                Command::Response(Response::RPL_ENDOFNAMES, _) => {
                    log::info!("Channel names list received");
                }
                Command::JOIN(channel, _, _) => {
                    if let Some(Prefix::Nickname(nick, _, _)) = &message.prefix {
                        if nick == self.client.current_nickname() {
                            log::info!("Successfully joined channel: {}", channel);
                        }
                    }
                }
                _ => {}
            }
            
            if let Err(e) = self.handle_message(&message).await {
                log::warn!("Error handling IRC message: {}", e);
            }
        }

        Ok(())
    }

    async fn handle_message(&self, message: &Message) -> Result<()> {
        match &message.command {
            Command::PRIVMSG(_target, content) => {
                if let Some(prefix) = &message.prefix {
                    if let Prefix::Nickname(nick, _, _) = prefix {
                        // Check for CTCP messages
                        if content.starts_with('\x01') && content.ends_with('\x01') {
                            let ctcp_content = &content[1..content.len()-1];
                            self.handle_ctcp(nick, ctcp_content).await?;
                        }
                    }
                }
            }
            Command::PING(server, _) => {
                self.client.send_pong(server)?;
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_ctcp(&self, from_nick: &str, content: &str) -> Result<()> {
        if content.starts_with("DCC SEND") {
            if let Ok(dcc_offer) = DccOffer::parse_from_ctcp(content, from_nick) {
                log::info!("Received DCC offer: {:?}", dcc_offer);

                // Find matching handler
                let handlers = self.dcc_handlers.lock().await;
                let key = format!("{}-{}", from_nick, dcc_offer.filename);

                if let Some(sender) = handlers.get(&key) {
                    if let Err(_) = sender.send(dcc_offer) {
                        log::warn!("Failed to send DCC offer to handler");
                    }
                } else {
                    log::debug!("No handler registered for DCC offer: {}", key);
                }
            }
        }
        Ok(())
    }
}
