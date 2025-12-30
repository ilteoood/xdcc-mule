pub mod dcc_download;
pub mod irc_client;
pub mod xdcc_database;
pub mod xdcc_download;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadableFile {
    #[serde(rename = "channelName")]
    pub channel_name: String,
    pub network: String,
    #[serde(rename = "fileNumber")]
    pub file_number: String,
    #[serde(rename = "botName")]
    pub bot_name: String,
    #[serde(rename = "fileSize")]
    pub file_size: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadableFileWithId {
    #[serde(flatten)]
    pub file: DownloadableFile,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StatusOption {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "downloading")]
    Downloading,
    #[serde(rename = "downloaded")]
    Downloaded,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadingFile {
    #[serde(flatten)]
    pub file: DownloadableFile,
    pub id: String,
    pub status: StatusOption,
    pub percentage: f64,
    pub eta: Option<i64>,
    #[serde(rename = "errorMessage", skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

pub fn build_job_key(file: &DownloadableFile) -> String {
    format!(
        "{}-{}-{}-{}-{}-{}",
        file.network,
        file.channel_name,
        file.bot_name,
        file.file_number,
        file.file_name,
        file.file_size
    )
}

pub fn add_job_key(file: DownloadableFile) -> DownloadableFileWithId {
    let id = build_job_key(&file);
    DownloadableFileWithId { file, id }
}
