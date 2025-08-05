use crate::utils::xdcc_database;
use actix_web::{HttpResponse, Result, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SearchQuery {
    name: String,
}

async fn search_files(query: web::Query<SearchQuery>) -> Result<HttpResponse> {
    let search_term = query.name.trim();

    if search_term.is_empty() {
        return Ok(HttpResponse::BadRequest().json("Search term cannot be empty"));
    }

    if search_term.len() < 2 {
        return Ok(HttpResponse::BadRequest().json("Search term must be at least 2 characters"));
    }

    match xdcc_database::search(search_term).await {
        Ok(files) => {
            log::info!(
                "Search for '{}' returned {} results",
                search_term,
                files.len()
            );
            Ok(HttpResponse::Ok().json(files))
        }
        Err(e) => {
            log::error!("Failed to search files for '{}': {}", search_term, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Search failed",
                "message": e.to_string()
            })))
        }
    }
}

async fn refresh_database() -> Result<HttpResponse> {
    log::info!("Manual database refresh requested");
    match xdcc_database::refresh().await {
        Ok(_) => {
            log::info!("Database refresh completed successfully");
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "message": "Database refreshed successfully"
            })))
        }
        Err(e) => {
            log::error!("Failed to refresh database: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Refresh failed",
                "message": e.to_string()
            })))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("", web::get().to(search_files))
        .route("", web::delete().to(refresh_database));
}
