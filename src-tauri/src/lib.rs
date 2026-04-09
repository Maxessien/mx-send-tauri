// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::path::PathBuf;

use crate::axum::AllowedFileList;
use futures_util::lock::Mutex;
use local_ip_address::local_ip;
use serde::Serialize;
use tauri::Manager;
use uuid::Uuid;
use walkdir::{DirEntry, WalkDir};

pub(crate) mod axum;
pub(crate) mod handler;
pub(crate) mod websocket;

pub struct SessionId(Uuid);

#[derive(Serialize)]
struct CreateConnRes {
    session_id: Uuid,
    ip_address: String,
}

#[tauri::command]
async fn create_conn_server<'a>(
    app_handle: tauri::AppHandle,
    state: tauri::State<'a, Mutex<SessionId>>,
) -> Result<CreateConnRes, String> {
    axum::create_server(app_handle);
    let mut id_state = state.lock().await;
    id_state.0 = Uuid::new_v4();
    let ip = match local_ip() {
        Ok(addr) => addr.to_string(),
        Err(_) => return Err(String::from("No Ip address found")),
    };
    let res = CreateConnRes {
        session_id: id_state.0,
        ip_address: ip,
    };
    Ok(res)
}

#[derive(Serialize)]
struct FileRes {
    file_name: String,
    file_size: u64,
    file_path: PathBuf,
}

pub const AUDIO_EXTS: &[&str] = &[
    "mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "aif", "mid", "midi", "amr", "ape",
    "au", "mka", "opus", "ra", "wavpack", "wv", "pcm", "dsd", "dff", "dsf",
];

pub const VIDEO_EXTS: &[&str] = &[
    "mp4", "mkv", "avi", "mov", "wmv", "webm", "flv", "mpg", "mpeg", "m4v", "3gp", "3g2", "vob",
    "ogv", "asf", "rm", "rmvb", "ts", "m2ts", "mts", "divx", "f4v", "qt",
];

pub const IMAGE_EXTS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif", "avif", "heic",
    "heif", "raw", "cr2", "nef", "arw", "dng", "psd", "ai", "eps",
];

pub const DOCUMENT_EXTS: &[&str] = &[
    "pdf", "doc", "docx", "txt", "rtf", "odt", "pages", "wpd", "tex", "epub", "mobi", "azw",
    "azw3", "csv", "xls", "xlsx", "ods", "ppt", "pptx", "odp",
];

fn filter_files(file_type: &handler::FileType, entry: &DirEntry) -> bool {
    let extensions = match file_type {
        handler::FileType::Audio => AUDIO_EXTS,
        handler::FileType::Image => IMAGE_EXTS,
        handler::FileType::Video => VIDEO_EXTS,
        handler::FileType::Document => DOCUMENT_EXTS,
        _ => return false,
    };
    let entry_ext = match entry.path().extension() {
        Some(val) => match val.to_str() {
            Some(ext) => ext.to_lowercase(),
            None => return false,
        },
        None => return false,
    };
    let allowed = entry.path().is_file() && extensions.contains(&entry_ext.as_str());
    allowed
}

#[tauri::command]
async fn list_files(
    app_handle: tauri::AppHandle,
    file_type: handler::FileType,
) -> Result<Vec<FileRes>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let home_path = app_handle.path().home_dir().unwrap();
    let walker = WalkDir::new(home_path);
    let entries = walker
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| filter_files(&file_type, e));
    let mut files: Vec<FileRes> = Vec::new();

    for e in entries {
        let name = match e.file_name().to_str() {
            Some(s) => s.to_string(),
            None => continue,
        };
        let size = match e.metadata() {
            Ok(meta) => meta.len(),
            Err(_) => continue,
        };
        files.push(FileRes {
            file_name: name,
            file_path: e.into_path(),
            file_size: size,
        });
    }

    Ok(files)
    }).await.unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![create_conn_server, list_files])
        .manage(Mutex::new(AllowedFileList { list: Vec::new() }))
        .manage(Mutex::new(SessionId(Uuid::new_v4())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}