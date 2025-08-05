use crate::config::Config;
use crate::utils::{add_job_key, DownloadableFile, DownloadableFileWithId};
use anyhow::{anyhow, Result};
use futures::future::join_all;
use rusqlite::{Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex, OnceLock};

#[derive(Debug, Clone)]
struct DatabaseContent {
    channel_name: String,
    script_url: String,
    network: String,
}

static DB_CONNECTION: OnceLock<Arc<Mutex<Connection>>> = OnceLock::new();

const COLUMNS_PER_FILE: usize = 4;

async fn retrieve_database_content(database_url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()?;

    let response = client.get(database_url).send().await?;
    let content = response.text().await?;
    Ok(content)
}

fn extract_database_info(database_content: &str) -> Vec<DatabaseContent> {
    let mut extracted_channels = Vec::new();
    let mut parsed_network = String::new();

    for line in database_content.lines() {
        if line.starts_with("0=") {
            if let Some(network) = line.split('*').nth(1) {
                parsed_network = network.to_string();
            }
        } else if !line.is_empty() && !line.starts_with('[') {
            if let Some(content) = line.split('=').nth(1) {
                let parts: Vec<&str> = content.split('*').collect();
                if parts.len() >= 2 {
                    let channel_name = parts[0].to_string();
                    let script_url = parts[1].to_string();

                    extracted_channels.push(DatabaseContent {
                        channel_name,
                        script_url,
                        network: parsed_network.clone(),
                    });
                }
            }
        }
    }

    extracted_channels
}

async fn parse(config: &Config) -> Result<Vec<DatabaseContent>> {
    let database_content = retrieve_database_content(&config.database_url).await?;
    Ok(extract_database_info(&database_content))
}

async fn retrieve_script_content(script_url: &str) -> Result<String> {
    let response = reqwest::get(script_url).await?;
    let content = response.text().await?;
    Ok(content)
}

fn create_db_instance() -> SqliteResult<Connection> {
    let conn = Connection::open_in_memory()?;
    conn.execute(
        "CREATE TABLE files (
            channelName TEXT,
            network TEXT,
            fileNumber TEXT,
            botName TEXT,
            fileSize TEXT,
            fileName TEXT
        )",
        [],
    )?;
    Ok(conn)
}

fn adapt_script_line(line: &str) -> Vec<String> {
    line.split_whitespace()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

fn filter_valid_entries(line: &[String]) -> bool {
    line.len() >= COLUMNS_PER_FILE
}

async fn create_database(database: Vec<DatabaseContent>) -> Result<()> {
    let mut conn = create_db_instance()?;

    // Create tasks for parallel script content retrieval
    let fetch_tasks: Vec<_> = database
        .into_iter()
        .map(|channel| {
            tokio::spawn(async move {
                match retrieve_script_content(&channel.script_url).await {
                    Ok(script_content) => {
                        let valid_lines: Vec<Vec<String>> = script_content
                            .lines()
                            .map(adapt_script_line)
                            .filter(|line| filter_valid_entries(line))
                            .collect();
                        Some((channel, valid_lines))
                    }
                    Err(e) => {
                        log::warn!("Failed to retrieve script content for {} ({}): {}",
                                  channel.channel_name, channel.script_url, e);
                        None
                    }
                }
            })
        })
        .collect();

    // Wait for all tasks to complete
    let results = join_all(fetch_tasks).await;
    
    // Collect successful results
    let mut channel_data = Vec::new();
    for result in results {
        match result {
            Ok(Some(data)) => channel_data.push(data),
            Ok(None) => {}, // Already logged warning above
            Err(e) => log::error!("Task failed: {}", e),
        }
    }

    // Now insert all data in a transaction (no more awaits)
    let tx = conn.transaction()?;
    {
        let mut stmt = tx.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)")?;

        for (channel, valid_lines) in channel_data {
            let DatabaseContent { channel_name, network, .. } = channel;

            for line in valid_lines {
                let file_number = &line[0];
                let bot_name = &line[1];
                let file_size = &line[2];
                let file_name = line[3..].join(" ");

                stmt.execute([
                    &channel_name,
                    &network,
                    file_number,
                    bot_name,
                    file_size,
                    &file_name,
                ])?;
            }
        }
    }

    tx.commit()?;

    // Store the connection globally
    DB_CONNECTION.set(Arc::new(Mutex::new(conn)))
        .map_err(|_| anyhow!("Failed to set database connection"))?;

    Ok(())
}

pub async fn refresh() -> Result<()> {
    let config = Config::new();
    let xdcc_database = parse(&config).await?;
    create_database(xdcc_database).await?;
    log::info!("Database refreshed successfully");
    Ok(())
}

pub async fn search(value: &str) -> Result<Vec<DownloadableFileWithId>> {
    // Ensure database is initialized
    if DB_CONNECTION.get().is_none() {
        refresh().await?;
    }

    let db = DB_CONNECTION
        .get()
        .ok_or_else(|| anyhow!("Database not initialized"))?;

    let conn = db.lock().map_err(|_| anyhow!("Failed to acquire database lock"))?;

    let likeable_value = value
        .split_whitespace()
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("%");

    let query = format!("%{}%", likeable_value);

    let mut stmt = conn.prepare("SELECT * FROM files WHERE fileName LIKE ?")?;
    let file_iter = stmt.query_map([query], |row| {
        Ok(DownloadableFile {
            channel_name: row.get(0)?,
            network: row.get(1)?,
            file_number: row.get(2)?,
            bot_name: row.get(3)?,
            file_size: row.get(4)?,
            file_name: row.get(5)?,
        })
    })?;

    let mut files = Vec::new();
    for file in file_iter {
        match file {
            Ok(f) => files.push(add_job_key(f)),
            Err(e) => log::warn!("Error reading file row: {}", e),
        }
    }

    Ok(files)
}
