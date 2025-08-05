use crate::utils::{build_job_key, DownloadableFile, DownloadingFile, StatusOption};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::OnceLock;
use tokio::time::{sleep, Duration};

static DOWNLOADS: OnceLock<Arc<Mutex<HashMap<String, DownloadingFile>>>> = OnceLock::new();

fn get_downloads() -> &'static Arc<Mutex<HashMap<String, DownloadingFile>>> {
    DOWNLOADS.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

pub async fn download(file_to_download: DownloadableFile) -> Result<(), Box<dyn std::error::Error>> {
    let job_key = build_job_key(&file_to_download);
    let downloads = get_downloads();
    let mut downloads_map = downloads.lock().unwrap();

    // Check if already downloading
    if let Some(existing) = downloads_map.get(&job_key) {
        match existing.status {
            StatusOption::Pending | StatusOption::Downloading => {
                log::info!("Download already in progress for: {}", file_to_download.file_name);
                return Ok(());
            },
            _ => {
                // Remove completed/failed downloads to allow restart
                downloads_map.remove(&job_key);
            }
        }
    }

    // Create a new downloading entry
    let downloading_file = DownloadingFile {
        id: job_key.clone(),
        file: file_to_download.clone(),
        status: StatusOption::Pending,
        percentage: 0.0,
        eta: None,
        error_message: None,
    };

    downloads_map.insert(job_key.clone(), downloading_file);
    drop(downloads_map); // Release the lock

    // Spawn a background task to simulate download progress
    let downloads_clone = downloads.clone();
    let job_key_clone = job_key.clone();
    let file_name = file_to_download.file_name.clone();

    tokio::spawn(async move {
        simulate_download(downloads_clone, job_key_clone, file_name).await;
    });

    log::info!("Download started for: {}", file_to_download.file_name);
    Ok(())
}

async fn simulate_download(
    downloads: Arc<Mutex<HashMap<String, DownloadingFile>>>,
    job_key: String,
    file_name: String,
) {
    // Simulate download phases
    let phases = vec![
        (StatusOption::Pending, 0.0, Some(120)),
        (StatusOption::Downloading, 10.0, Some(100)),
        (StatusOption::Downloading, 25.0, Some(75)),
        (StatusOption::Downloading, 50.0, Some(50)),
        (StatusOption::Downloading, 75.0, Some(25)),
        (StatusOption::Downloading, 90.0, Some(10)),
        (StatusOption::Downloaded, 100.0, None),
    ];

    for (status, percentage, eta) in phases {
        sleep(Duration::from_secs(2)).await;

        let mut downloads_map = downloads.lock().unwrap();
        if let Some(download) = downloads_map.get_mut(&job_key) {
            // Check if download was cancelled
            if matches!(download.status, StatusOption::Cancelled) {
                log::info!("Download was cancelled: {}", file_name);
                break;
            }

            download.status = status.clone();
            download.percentage = percentage;
            download.eta = eta;

            log::debug!("Download progress for {}: {}%", file_name, percentage);

            if matches!(status, StatusOption::Downloaded) {
                log::info!("Download completed: {}", file_name);
                break;
            }
        } else {
            log::warn!("Download entry disappeared: {}", file_name);
            break;
        }
    }
}

pub fn statuses() -> Vec<DownloadingFile> {
    let downloads = get_downloads();
    let downloads_map = downloads.lock().unwrap();
    downloads_map.values().cloned().collect()
}

pub fn cancel(file_to_cancel: DownloadableFile) {
    let job_key = build_job_key(&file_to_cancel);
    let downloads = get_downloads();
    let mut downloads_map = downloads.lock().unwrap();

    if let Some(download) = downloads_map.get_mut(&job_key) {
        download.status = StatusOption::Cancelled;
        log::info!("Download cancelled for: {}", file_to_cancel.file_name);
    }

    // TODO: Actually cancel the download process
}
