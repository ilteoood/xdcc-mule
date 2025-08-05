use actix_web::{web, HttpResponse, Result};
use serde::Deserialize;
use crate::utils::{xdcc_download, DownloadableFile, StatusOption};

#[derive(Deserialize)]
pub struct StatusQuery {
    status: Option<String>,
}

async fn get_downloads(query: web::Query<StatusQuery>) -> Result<HttpResponse> {
    let downloads = xdcc_download::statuses();

    if let Some(status_filter) = &query.status {
        let status_enum = match status_filter.as_str() {
            "pending" => Some(StatusOption::Pending),
            "downloading" => Some(StatusOption::Downloading),
            "downloaded" => Some(StatusOption::Downloaded),
            "error" => Some(StatusOption::Error),
            "cancelled" => Some(StatusOption::Cancelled),
            _ => None,
        };

        if let Some(status) = status_enum {
            let filtered_downloads: Vec<_> = downloads
                .into_iter()
                .filter(|d| std::mem::discriminant(&d.status) == std::mem::discriminant(&status))
                .collect();
            Ok(HttpResponse::Ok().json(filtered_downloads))
        } else {
            Ok(HttpResponse::BadRequest().json("Invalid status filter"))
        }
    } else {
        Ok(HttpResponse::Ok().json(downloads))
    }
}

async fn create_download(body: web::Json<DownloadableFile>) -> Result<HttpResponse> {
    let file = body.into_inner();

    // Validate the download request
    if file.channel_name.is_empty() || file.network.is_empty() ||
       file.file_number.is_empty() || file.bot_name.is_empty() ||
       file.file_name.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid download request",
            "message": "All fields (channelName, network, fileNumber, botName, fileName) are required"
        })));
    }

    log::info!("Download requested: {} from {} on {}",
               file.file_name, file.bot_name, file.network);

    match xdcc_download::download(file.clone()).await {
        Ok(_) => Ok(HttpResponse::Created().json(serde_json::json!({
            "message": "Download started",
            "file": file.file_name
        }))),
        Err(e) => {
            log::error!("Failed to create download for '{}': {}", file.file_name, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Download failed",
                "message": e.to_string()
            })))
        }
    }
}

async fn cancel_download(body: web::Json<DownloadableFile>) -> Result<HttpResponse> {
    let file = body.into_inner();
    log::info!("Download cancellation requested: {}", file.file_name);

    xdcc_download::cancel(file.clone());
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Download cancelled",
        "file": file.file_name
    })))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(get_downloads))
       .route("", web::post().to(create_download))
       .route("", web::delete().to(cancel_download));
}
