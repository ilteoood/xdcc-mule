use crate::config::Config;
use crate::utils::xdcc_download::{XdccDownloadManager, DownloadStatus};
use actix_web::{HttpResponse, Result, web};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// Helper function to build consistent job keys like the Node.js version
fn build_job_key(request: &CancelRequest) -> String {
    format!(
        "{}-{}-{}-{}-{}-{}",
        request.server,
        request.channel,
        request.bot,
        request.pack,
        request.filename,
        request.file_size.as_deref().unwrap_or("")
    )
}

#[derive(Deserialize)]
pub struct StatusQuery {
    status: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct DownloadRequest {
    #[serde(rename = "fileName")]
    pub filename: String,
    #[serde(rename = "network")]
    pub server: String,
    #[serde(rename = "channelName")]
    pub channel: String,
    #[serde(rename = "botName")]
    pub bot: String,
    #[serde(rename = "fileNumber")]
    pub pack: String,
    #[serde(rename = "fileSize")]
    pub file_size: Option<String>, // Optional since we don't use it for downloads
}

#[derive(Deserialize)]
pub struct CancelRequest {
    #[serde(rename = "fileName")]
    pub filename: String,
    #[serde(rename = "network")]
    pub server: String,
    #[serde(rename = "channelName")]
    pub channel: String,
    #[serde(rename = "botName")]
    pub bot: String,
    #[serde(rename = "fileNumber")]
    pub pack: String,
    #[serde(rename = "fileSize")]
    pub file_size: Option<String>,
}

async fn get_downloads(
    query: web::Query<StatusQuery>,
    download_manager: web::Data<Arc<XdccDownloadManager>>,
) -> Result<HttpResponse> {
    let downloads = download_manager.get_downloads().await;

    if let Some(status_filter) = &query.status {
        let filtered_downloads: Vec<_> = downloads
            .into_iter()
            .filter(|d| {
                match status_filter.as_str() {
                    "pending" => matches!(d.status, DownloadStatus::Pending),
                    "connecting" => matches!(d.status, DownloadStatus::Connecting),
                    "downloading" => matches!(d.status, DownloadStatus::Downloading),
                    "completed" => matches!(d.status, DownloadStatus::Completed),
                    "failed" => matches!(d.status, DownloadStatus::Failed),
                    "cancelled" => matches!(d.status, DownloadStatus::Cancelled),
                    _ => false,
                }
            })
            .collect();
        Ok(HttpResponse::Ok().json(filtered_downloads))
    } else {
        Ok(HttpResponse::Ok().json(downloads))
    }
}

async fn create_download(
    body: web::Json<DownloadRequest>,
    download_manager: web::Data<Arc<XdccDownloadManager>>,
    config: web::Data<Config>,
) -> Result<HttpResponse> {
    let request = body.into_inner();

    // Validate the download request
    if request.channel.is_empty()
        || request.server.is_empty()
        || request.pack.is_empty()
        || request.bot.is_empty()
        || request.filename.is_empty()
    {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid download request",
            "message": "All fields (fileName, network, channelName, botName, fileNumber) are required"
        })));
    }

    log::info!(
        "Download requested: {} from {} pack #{} on {}",
        request.filename,
        request.bot,
        request.pack,
        request.server
    );

    // Generate job key like the Node.js version
    let job_key = format!(
        "{}-{}-{}-{}-{}-{}",
        request.server,
        request.channel,
        request.bot,
        request.pack,
        request.filename,
        request.file_size.as_deref().unwrap_or("")
    );

    match download_manager.start_download_with_id(
        &job_key,
        &request.server,
        &request.channel,
        &request.bot,
        &request.pack,
        &request.filename,
        &config.nickname,
    ).await {
        Ok(download_id) => Ok(HttpResponse::Created().json(serde_json::json!({
            "message": "Download started",
            "id": download_id,
            "filename": request.filename
        }))),
        Err(e) => {
            log::error!("Failed to create download for '{}': {}", request.filename, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Download failed",
                "message": e.to_string()
            })))
        }
    }
}

async fn cancel_download(
    body: web::Json<CancelRequest>,
    download_manager: web::Data<Arc<XdccDownloadManager>>,
) -> Result<HttpResponse> {
    let request = body.into_inner();
    let job_key = build_job_key(&request);
    log::info!("Download cancellation requested: {}", job_key);

    match download_manager.cancel_download(&job_key).await {
        Ok(_) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "message": "Download cancelled",
            "file": request.filename
        }))),
        Err(e) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Download not found",
            "message": e.to_string()
        })))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_downloads))
        .route("", web::post().to(create_download))
        .route("", web::delete().to(cancel_download));
}
