use clap::Parser;

#[derive(Debug, Clone, Parser)]
#[command(name = "xdcc-mule")]
#[command(about = "XDCC Mule Server - A Rust-based XDCC download manager")]
pub struct Config {
    /// Database URL for storing XDCC file information
    #[arg(long, env = "DATABASE_URL")]
    pub database_url: String,

    /// IRC nickname to use for XDCC downloads
    #[arg(long, env = "NICKNAME", default_value = "xdcc-mule")]
    pub nickname: String,

    /// Directory path for downloaded files
    #[arg(long, env = "DOWNLOAD_PATH", default_value = "./downloads")]
    pub download_path: String,

    /// Port number for the HTTP server
    #[arg(long, env = "PORT", default_value = "3000")]
    pub port: u16,
}

impl Config {
    pub fn new() -> Self {
        // Parse command line arguments and environment variables
        // Clap will automatically read from environment variables
        Self::parse()
    }
}
