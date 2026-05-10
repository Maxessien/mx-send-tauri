use serde::Serialize;
use std::path::PathBuf;
use tauri::Manager;
use tokio::fs::{create_dir_all, File};
use uuid::Uuid;

pub struct SessionId(pub Uuid);

#[derive(Serialize)]
pub struct CreateConnRes {
    pub session_id: Uuid,
    pub ip_address: String,
    pub port: String,
}

#[derive(Serialize)]
pub struct FileRes {
    pub file_name: String,
    pub file_size: u64,
    pub file_path: PathBuf,
}

#[cfg(target_os = "android")]
pub fn get_dirs(_app: &tauri::AppHandle) -> [PathBuf; 4] {
    let dirs = [
        PathBuf::from("/storage/emulated/0/Download"),
        PathBuf::from("/storage/emulated/0/Movies"),
        PathBuf::from("/storage/emulated/0/Pictures"),
        PathBuf::from("/storage/emulated/0/Music"),
    ];
    dirs
}

#[cfg(not(target_os = "android"))]
pub fn get_dirs(app: &tauri::AppHandle) -> [PathBuf; 4] {
    let path = app.path();
    let home = path.home_dir().unwrap_or_else(|_| PathBuf::from("."));
    [
        path.download_dir()
            .unwrap_or_else(|_| home.join("Downloads")),
        path.video_dir().unwrap_or_else(|_| home.join("Videos")),
        path.picture_dir().unwrap_or_else(|_| home.join("Pictures")),
        path.audio_dir().unwrap_or_else(|_| home.join("Music")),
    ]
}

#[derive(Serialize, Clone)]
pub struct ByteProgress {
    pub current: usize,
    pub info: String,
}

#[derive(Serialize, Clone)]
pub struct DownloadProgressPayload {
    pub file_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub file_type: String,
    pub total: u64,
    pub current: u64,
    pub sender_id: String,
}

pub async fn get_settings_path(app: &tauri::AppHandle) -> Result<(PathBuf, bool), String> {
    let mut was_created = false;
    let path = match app.path().app_data_dir() {
        Ok(p) => p,
        Err(_) => return Err("Couldn't resolve app data dir".to_string()),
    };
    let settings_path = path.join("settings.json");
    if !settings_path.exists() {
        match create_dir_all(&path).await {
            Ok(_) => {}
            Err(_) => return Err("Couldn't create settings path".to_string()),
        };
        File::create_new(&settings_path)
            .await
            .map_err(|_| "Couldn't create settings file".to_string())?;
        was_created = true;    }
    Ok((settings_path, was_created))
}

pub async fn get_transfer_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let parent = match app.path().app_data_dir() {
        Ok(p) => p,
        Err(_) => return Err("Failed to get app data dir".to_string()),
    };
    create_dir_all(parent).await.map_err(|_| "Couldn't create parent dir".to_string())?;
    let path = parent.join("transfers.json");
    if !path.exists() {
        match File::create_new(&path).await {
            Ok(_) => {}
            Err(_) => return Err("Failed to create file".to_string()),
        };
    };
    Ok(path)
}
