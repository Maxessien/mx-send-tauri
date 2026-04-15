// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::path::PathBuf;

use crate::axum::AllowedFileList;
use futures_util::lock::Mutex;
use local_ip_address::local_ip;
use serde::Serialize;
use tauri::Manager;
use tokio::{
    fs::File,
    io::{AsyncReadExt, AsyncWriteExt},
};
use uuid::Uuid;
use walkdir::WalkDir;
use std::path::Path;

pub(crate) mod axum;
pub(crate) mod file_types;
pub(crate) mod handler;
pub(crate) mod websocket;

pub struct SessionId(Uuid);

#[derive(Serialize)]
struct CreateConnRes {
    session_id: Uuid,
    ip_address: String,
    port: String,
}

#[tauri::command]
async fn create_conn_server<'a>(
    app_handle: tauri::AppHandle,
    state: tauri::State<'a, Mutex<SessionId>>,
) -> Result<CreateConnRes, String> {
    let port = axum::create_server(app_handle).await;
    let mut id_state = state.lock().await;
    id_state.0 = Uuid::new_v4();
    let ip = match local_ip() {
        Ok(addr) => addr.to_string(),
        Err(_) => return Err(String::from("No Ip address found")),
    };
    let res = CreateConnRes {
        session_id: id_state.0,
        ip_address: ip,
        port,
    };
    Ok(res)
}

#[tauri::command]
async fn disconnect_server() -> Result<String, String> {
    if let Some(token) = axum::CANCEL_TOKEN.get() {
        token.cancel();
    }
    Ok(String::from("Shutdown successful"))
}

#[derive(Serialize)]
struct FileRes {
    file_name: String,
    file_size: u64,
    file_path: PathBuf,
}

#[tauri::command]
async fn list_files(
    app_handle: tauri::AppHandle,
    file_type: handler::FileType,
) -> Result<Vec<FileRes>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dirs = [
            app_handle.path().download_dir().unwrap(),
            app_handle.path().video_dir().unwrap(),
            app_handle.path().picture_dir().unwrap(),
            app_handle.path().audio_dir().unwrap(),
        ];
        let mut files: Vec<FileRes> = Vec::new();
        for dir in dirs {
            let walker = WalkDir::new(dir);
            let entries = walker
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| file_types::matches_file_type(&file_type, e));

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
        }

        Ok(files)
    })
    .await
    .unwrap()
}

#[tauri::command]
async fn get_file(file_path: PathBuf) -> Result<Vec<u8>, String> {
    let mut buff: Vec<u8> = Vec::new();
    let mut file = match File::open(file_path).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("File not found")),
    };
    match file.read_to_end(&mut buff).await {
        Ok(_) => (),
        Err(_) => return Err(String::from("Unable to read file")),
    };
    Ok(buff)
}


#[tauri::command]
async fn save_file(
    app_handle: tauri::AppHandle,
    bytes: Vec<u8>,
    file_name: String,
    file_type: handler::FileType,
) -> Result<String, String> {
    let mut download_dir = match app_handle.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => return Err(String::from("Failed to get app folder")),
    };
    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("Failed to create file")),
    };
    if let Some(parent) = download_dir.parent() {
        if let Err(_) = tokio::fs::create_dir_all(parent).await {
            return Err(String::from("Failed to create parent dir"));
        }
    }
    let safe_file_name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| String::from("Invalid file name"))?;

    let sub_folder = file_types::folder_name(&file_type);
    download_dir.push(format!("mxsend/{}/{}", sub_folder, safe_file_name));

    match file.write_all(&bytes).await {
        Ok(_) => Ok(String::from("Saved")),
        Err(_) => Err(String::from("Failed to write to file")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_conn_server,
            disconnect_server,
            list_files,
            get_file,
            save_file
        ])
        .manage(Mutex::new(AllowedFileList { list: Vec::new() }))
        .manage(Mutex::new(SessionId(Uuid::new_v4())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
