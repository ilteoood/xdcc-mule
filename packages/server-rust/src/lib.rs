pub mod config;
pub mod routes;
pub mod utils;

pub use config::Config;

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn test_api_structure() {
        let app = test::init_service(
            App::new()
                .service(
                    actix_web::web::scope("/api")
                        .configure(routes::configure_routes)
                )
        ).await;

        // Test that the API routes are configured
        let req = test::TestRequest::get()
            .uri("/api/files?name=test")
            .to_request();

        let resp = test::call_service(&app, req).await;
        // Should not be 404 (route exists), might be 500 due to missing DB_URL
        assert_ne!(resp.status(), 404);
    }

    #[test]
    fn test_config_creation() {
        // This will fail if DATABASE_URL is not set, which is expected
        std::env::set_var("DATABASE_URL", "test_url");
        let config = Config::new();
        assert_eq!(config.database_url, "test_url");
        assert_eq!(config.port, 3000); // default port
    }
}
