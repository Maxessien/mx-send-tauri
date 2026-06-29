use serde::Serialize;
use std::{path::PathBuf, time::SystemTime};
use tauri::Manager;
use tokio::{
    fs::{create_dir_all, File},
    io::AsyncReadExt,
};
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
    pub last_modified: SystemTime
}

#[derive(Serialize)]
pub struct FileResWithType {
    pub file_name: String,
    pub file_size: u64,
    pub file_path: PathBuf,
    pub file_type: String,
    pub last_modified: SystemTime
}

#[derive(Serialize)]
pub struct FolderRes {
    pub folder_name: String,
    pub path: PathBuf,
}

#[derive(Serialize)]
pub struct DirList {
    pub folders: Vec<FolderRes>,
    pub files: Vec<FileResWithType>,
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

#[cfg(target_os = "android")]
pub fn get_home_dir(_app: &tauri::AppHandle) -> PathBuf {
    PathBuf::from("/storage/emulated/0")
}

#[cfg(not(target_os = "android"))]
pub fn get_home_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().home_dir().unwrap_or_else(|_| PathBuf::from("."))
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

pub async fn get_file_path(app: &tauri::AppHandle, file: &str) -> Result<(PathBuf, bool), String> {
    let mut was_created = false;
    let path = match app.path().app_data_dir() {
        Ok(p) => p,
        Err(_) => return Err("Couldn't resolve app data dir".to_string()),
    };
    let file_path = path.join(file);
    if !file_path.exists() {
        match create_dir_all(&path).await {
            Ok(_) => {}
            Err(_) => return Err("Couldn't create path".to_string()),
        };
        File::create_new(&file_path)
            .await
            .map_err(|_| "Couldn't create file".to_string())?;
        was_created = true;
    }
    Ok((file_path, was_created))
}

pub async fn read_json_file(path: PathBuf) -> Result<String, String> {
    let mut str = String::new();
    match File::open(path).await {
        Ok(mut f) => {
            f.read_to_string(&mut str)
                .await
                .map_err(|_| "Couldn't read json file".to_string())?;
        }
        Err(_) => return Err("Couldn't read json file".to_string()),
    };
    Ok(str)
}
