mod config;
mod routes;
mod utils;

use actix_web::{App, HttpServer, middleware::Logger, web};
use config::Config;
use tokio_cron_scheduler::{Job, JobScheduler};
use utils::xdcc_database;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let config = Config::new();
    let port = config.port;

    // Initialize the scheduler for periodic database refresh
    let sched = JobScheduler::new().await.unwrap();

    // Schedule database refresh every hour (0 * * * *)
    sched
        .add(
            Job::new_async("0 0 * * * *", |_uuid, _l| {
                Box::pin(async {
                    log::info!("Refreshing XDCC database...");
                    if let Err(e) = xdcc_database::refresh().await {
                        log::error!("Failed to refresh database: {}", e);
                    }
                })
            })
            .unwrap(),
        )
        .await
        .unwrap();

    sched.start().await.unwrap();

    log::info!("Starting server on port {}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(config.clone()))
            .wrap(Logger::default())
            .service(web::scope("/api").configure(routes::configure_routes))
    })
    .bind(format!("[::]:{}", port))?
    .run()
    .await
}
