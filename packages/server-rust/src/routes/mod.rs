mod api;
mod downloads;
mod files;
mod health;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.configure(health::configure)
       .configure(api::configure);
}
