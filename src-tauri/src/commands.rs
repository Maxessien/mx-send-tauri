use async_stream::stream;
use futures_util::{lock::Mutex, StreamExt};
use local_ip_address::local_ip;
use reqwest::{header, Body, ClientBuilder};
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Emitter, Manager};
use tauri_plugin_android_external_storage::AndroidExternalStorageExt;
use tokio::{fs::File, io::AsyncWriteExt};
use tokio_util::io::ReaderStream;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::axum;
use crate::file_types;
use crate::handler;

pub struct SessionId(pub Uuid);

#[derive(Serialize)]
pub struct CreateConnRes {
    pub session_id: Uuid,
    pub ip_address: String,
    pub port: String,
}

#[tauri::command]
pub async fn create_conn_server<'a>(
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
pub async fn disconnect_server() -> Result<String, String> {
    let mut cancel = axum::CANCEL_TOKEN.write().await;
    if let Some(token) = cancel.take() {
        token.cancel();
    };
    Ok(String::from("Shutdown successful"))
}

#[derive(Serialize)]
pub struct FileRes {
    pub file_name: String,
    pub file_size: u64,
    pub file_path: PathBuf,
}

#[cfg(target_os = "android")]
fn get_dirs(app: &tauri::AppHandle) -> [PathBuf; 4] {
    let dirs = [
        PathBuf::from("/storage/emulated/0/Download"),
        PathBuf::from("/storage/emulated/0/Movies"),
        PathBuf::from("/storage/emulated/0/Pictures"),
        PathBuf::from("/storage/emulated/0/Music"),
    ];
    dirs
}

#[cfg(not(target_os = "android"))]
fn get_dirs(app: &tauri::AppHandle) -> [PathBuf; 4] {
    let path = app.path();
    let home = path.home_dir().unwrap_or_else(|_| PathBuf::from("."));
    [
        path.download_dir().unwrap_or_else(|_| home.join("Downloads")),
        path.video_dir().unwrap_or_else(|_| home.join("Videos")),
        path.picture_dir().unwrap_or_else(|_| home.join("Pictures")),
        path.audio_dir().unwrap_or_else(|_| home.join("Music")),
    ]
}

#[tauri::command]
pub async fn list_files(
    app_handle: tauri::AppHandle,
    file_type: handler::FileType,
) -> Result<Vec<FileRes>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dirs = get_dirs(&app_handle);
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

#[derive(Serialize, Clone)]
pub struct ByteProgress {
    pub current: usize,
}

#[tauri::command]
pub async fn send_file(
    file_path: PathBuf,
    url: String,
    session_id: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
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
pub struct DownloadProgressPayload {
    pub file_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub file_type: String,
    pub total: u64,
    pub current: u64,
}

#[tauri::command]
pub async fn download_file_from_sender(
    url: String,
    session_id: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let mut headers = header::HeaderMap::new();
    let sess_id = format!("Bearer {}", session_id);
    let header_val = match header::HeaderValue::from_str(&sess_id) {
        Ok(val) => val,
        Err(_) => return Err("Couldn't set header".to_string()),
    };
    headers.insert(header::AUTHORIZATION, header_val);

    let client = reqwest::ClientBuilder::new()
        .default_headers(headers)
        .build()
        .unwrap();
    let mut res = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Download failed with status: {}", res.status()));
    }

    let file_name = res
        .headers()
        .get("file_name")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let file_size: u64 = res
        .headers()
        .get("file_size")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("0")
        .parse()
        .unwrap_or(0);
    let file_path = res
        .headers()
        .get("file_path")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("")
        .to_string();
    let file_type_str = res
        .headers()
        .get("file_type")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("document")
        .to_string();

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
    let safe_file_name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    download_dir.push(format!("mxsend/{}", sub_folder));
    if tokio::fs::create_dir_all(&download_dir).await.is_err() {
        return Err("Failed to create download dir".to_string());
    }

    download_dir.push(safe_file_name);

    download_dir = match file_types::handle_duplicate_path(download_dir) {
        Ok(path) => path,
        Err(_) => return Err(String::from("Couldn't allocate file name")),
    };

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => {
            return Err(String::from(
                "Failed to create file, it might already exist",
            ))
        }
    };

    let mut current = 0;
    let mut emit_count = 1;
    let emit_freq = (file_size as f32) * 0.1;
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        if file.write_all(&chunk).await.is_err() {
            return Err("Failed to write to file".to_string());
        }
        current += chunk.len() as u64;

        if((current * emit_count) as f32) / emit_freq > 1.0 {
            let _ = app_handle.emit(
                "download_progress",
                DownloadProgressPayload {
                    file_name: file_name.clone(),
                    file_path: file_path.clone(),
                    file_size,
                    file_type: file_type_str.clone(),
                    total: file_size,
                    current,
                },
            );
            emit_count += 1;
        };
    }

    // Final completion event
    let _ = app_handle.emit(
        "download_progress",
        DownloadProgressPayload {
            file_name: file_name.clone(),
            file_path: file_path.clone(),
            file_size,
            file_type: file_type_str.clone(),
            total: file_size,
            current: file_size,
        },
    );

    Ok("Downloaded".to_string())
}

#[tauri::command]
pub async fn save_file(
    app_handle: tauri::AppHandle,
    bytes: Vec<u8>,
    file_name: String,
    file_type: handler::FileType,
) -> Result<String, String> {
    let mut download_dir = match app_handle.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => return Err(String::from("Failed to get app folder")),
    };

    let sub_folder = file_types::folder_name(&file_type);
    download_dir.push(format!("mxsend/{}", sub_folder));

    if let Err(_) = tokio::fs::create_dir_all(&download_dir).await {
        return Err(String::from("Failed to create parent dir"));
    }

    let safe_file_name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| String::from("Invalid file name"))?;

    download_dir.push(safe_file_name);

    download_dir = match file_types::handle_duplicate_path(download_dir) {
        Ok(path) => path,
        Err(_) => return Err("Couldn't allocate file name".to_string()),
    };

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return Err(String::from("Failed to create file")),
    };

    match file.write_all(&bytes).await {
        Ok(_) => Ok(String::from("Saved")),
        Err(_) => Err(String::from("Failed to write to file")),
    }
}

#[tauri::command]
pub async fn req_file_access(app: tauri::AppHandle) -> Result<String, String> {
    let api = app.android_external_storage();
    let access = match api.check_all_files_access() {
        Ok(acc) => acc,
        Err(_) => {
            app.exit(0);
            return Err("Failed to check access".to_string());
        }
    };
    if !access.is_granted {
        let access_req = match api.request_all_files_access() {
            Ok(acc) => acc,
            Err(_) => {
                app.exit(0);
                return Err("Failed to request access".to_string());
            }
        };
        if !access_req.is_granted {
            app.exit(0);
        };
    };
    Ok("Finished".to_string())
}
