// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::path::PathBuf;

use crate::axum::AllowedFileList;
use async_stream::stream;
use futures_util::{StreamExt, lock::Mutex};
use local_ip_address::local_ip;
use reqwest::{header, Body, ClientBuilder};
use serde::Serialize;
use std::path::Path;
use tauri::{Emitter, Manager};
use tokio::{fs::File, io::AsyncWriteExt};
use tokio_util::io::ReaderStream;
use uuid::Uuid;
use walkdir::WalkDir;
// use async_;

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
        Err(err) => {
            dbg!(err);
            return Err(String::from("No Ip address found"));
        }
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

#[derive(Serialize)]
#[derive(Clone)]
struct ByteProgress {
    current: usize,
}

#[tauri::command]
async fn send_file(file_path: PathBuf, url: String, session_id: String, app: tauri::AppHandle) -> Result<String, String> {
    let mut headers = header::HeaderMap::new();
    let sess_id = format!("Bearer {}", session_id);
    let header_val = match header::HeaderValue::from_str(&sess_id) {
        Ok(val) => val,
        Err(_) => return Err("Couldn't set header".to_string()),
    };
    headers.insert(header::AUTHORIZATION, header_val);
    let file = match File::open(file_path).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("File not found")),
    };
    let mut curr = 0;
    let mut reader_stream = ReaderStream::new(file);
    let progress_stream = stream! {
        while let Some(chunk) = reader_stream.next().await {
        if let Ok(ref bytes) = chunk{
            curr += bytes.len();
            let _ = app.emit("progress", ByteProgress{current: curr});
        };
        yield chunk;
    }
    };
    let body = Body::wrap_stream(progress_stream);
    let client = ClientBuilder::new()
        .default_headers(headers)
        .build()
        .unwrap();
    match client.post(url).body(body).send().await {
        Ok(_) => Ok("Sent".to_string()),
        Err(_) => Err("Failed to send".to_string()),
    }
}

#[derive(Serialize, Clone)]
struct DownloadProgressPayload {
    file_name: String,
    file_path: String,
    file_size: u64,
    #[serde(rename = "type")]
    file_type_str: String,
    total: u64,
    current: u64,
}

#[tauri::command]
async fn download_file_from_sender(url: String, session_id: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut headers = header::HeaderMap::new();
    let sess_id = format!("Bearer {}", session_id);
    let header_val = match header::HeaderValue::from_str(&sess_id) {
        Ok(val) => val,
        Err(_) => return Err("Couldn't set header".to_string()),
    };
    headers.insert(header::AUTHORIZATION, header_val);

    let client = reqwest::ClientBuilder::new().default_headers(headers).build().unwrap();
    let mut res = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Download failed with status: {}", res.status()));
    }

    let file_name = res.headers().get("file_name").and_then(|h| h.to_str().ok()).unwrap_or("unknown").to_string();
    let file_size: u64 = res.headers().get("file_size").and_then(|h| h.to_str().ok()).unwrap_or("0").parse().unwrap_or(0);
    let file_path = res.headers().get("file_path").and_then(|h| h.to_str().ok()).unwrap_or("").to_string();
    let file_type_str = res.headers().get("file_type").and_then(|h| h.to_str().ok()).unwrap_or("document").to_string();
    
    let file_type = match file_type_str.as_str() {
        "audio" => handler::FileType::Audio,
        "video" => handler::FileType::Video,
        "image" => handler::FileType::Image,
        _ => handler::FileType::Document,
    };

    let mut download_dir = match app_handle.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => return Err(String::from("Failed to get app folder")),
    };
    
    let sub_folder = file_types::folder_name(&file_type);
    let safe_file_name = Path::new(&file_name).file_name().and_then(|n| n.to_str()).unwrap_or("unknown");
    
    download_dir.push(format!("mxsend/{}", sub_folder));
    if tokio::fs::create_dir_all(&download_dir).await.is_err() {
        return Err("Failed to create download dir".to_string());
    }
    
    download_dir.push(safe_file_name);

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("Failed to create file, it might already exist")),
    };

    let mut current = 0;
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        if file.write_all(&chunk).await.is_err() {
            return Err("Failed to write to file".to_string());
        }
        current += chunk.len() as u64;
        
        // Use a generic throttle or just emit (Tauri IPC is fast, but sending too many events can queue up.
        // It's generally okay for this scope).
        let _ = app_handle.emit("download_progress", DownloadProgressPayload {
            file_name: file_name.clone(),
            file_path: file_path.clone(),
            file_size,
            file_type_str: file_type_str.clone(),
            total: file_size,
            current,
        });
    }
    
    // Final completion event
    let _ = app_handle.emit("download_progress", DownloadProgressPayload {
        file_name: file_name.clone(),
        file_path: file_path.clone(),
        file_size,
        file_type_str: file_type_str.clone(),
        total: file_size,
        current: file_size,
    });

    Ok("Downloaded".to_string())
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

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("Failed to create file")),
    };

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
            send_file,
            save_file,
            download_file_from_sender
        ])
        .manage(Mutex::new(AllowedFileList { list: Vec::new() }))
        .manage(Mutex::new(SessionId(Uuid::new_v4())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
