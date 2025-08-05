use super::{downloads, files};
use actix_web::web;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/files").configure(files::configure))
        .service(web::scope("/downloads").configure(downloads::configure));
}
