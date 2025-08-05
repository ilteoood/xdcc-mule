use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub nickname: String,
    pub download_path: String,
    pub port: u16,
}

impl Config {
    pub fn new() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL environment variable is required"),
            nickname: env::var("NICKNAME").unwrap_or_else(|_| "xdcc-mule".to_string()),
            download_path: env::var("DOWNLOAD_PATH").unwrap_or_else(|_| "./".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("PORT must be a valid number"),
        }
    }
}
