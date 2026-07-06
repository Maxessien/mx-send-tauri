use async_stream::stream;
use axum_server::Handle;
use futures_util::{lock::Mutex, StreamExt};
use local_ip_address::local_ip;
use reqwest::{header, Body, ClientBuilder};
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime};
use tauri::{Emitter, Manager};
use tokio::fs::write;
use tokio::{fs::File, io::AsyncWriteExt};
use tokio_util::io::ReaderStream;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::axum;
use crate::file_types::{self, get_file_type};
use crate::handler;
use crate::utils::*;

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
pub async fn disconnect_server(app: tauri::AppHandle) -> Result<String, String> {
    println!("disconnect_server called");
    let state = app.state::<Mutex<Option<Handle<SocketAddr>>>>();
    println!("got state, awaiting lock...");
    let mut handle = state.lock().await;
    println!("lock acquired");
    if let Some(h) = handle.take() {
        println!("shutting down handle");
        h.graceful_shutdown(Some(Duration::from_secs(1)));
        println!("graceful shutdown triggered");
    };
    println!("returning from disconnect_server");
    Ok(String::from("Shutdown successful"))
}

#[tauri::command]
pub async fn list_files(
    app_handle: tauri::AppHandle,
    file_type: handler::FileType,
    mut extra_paths: Vec<PathBuf>,
) -> Result<Vec<FileRes>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dirs = get_dirs(&app_handle);
        extra_paths.append(&mut dirs.into());
        let mut files: Vec<FileRes> = Vec::new();
        for dir in extra_paths {
            let walker = WalkDir::new(dir);
            let entries = walker.into_iter().filter_map(|e| e.ok()).filter(|e| {
                let not_hidden = e
                    .path()
                    .to_str()
                    .unwrap_or(".filter")
                    .split("/")
                    .all(|f| !f.starts_with("."));
                return file_types::matches_file_type(&file_type, e) && not_hidden;
            });

            for e in entries {
                let name = match e.file_name().to_str() {
                    Some(s) => s.to_string(),
                    None => "unknown".to_string(),
                };
                let size = match e.metadata() {
                    Ok(meta) => meta.len(),
                    Err(_) => 0,
                };
                let modified = e
                    .metadata()
                    .ok()
                    .and_then(|meta| meta.created().or_else(|_| meta.modified()).ok())
                    .unwrap_or(SystemTime::UNIX_EPOCH);

                files.push(FileRes {
                    file_name: name,
                    file_path: e.into_path(),
                    file_size: size,
                    last_modified: modified,
                });
            }
        }

        Ok(files)
    })
    .await
    .unwrap()
}

#[tauri::command]
pub async fn cancel_upload(app: tauri::AppHandle)-> Result<String, String>{
    let state = app.state::<Mutex<CancelOngoingUpload>>();
    let mut cancel = state.lock().await;
    *cancel = CancelOngoingUpload { val: true };

    Ok("".to_string())
}

#[tauri::command]
pub async fn send_file(
    file_path: PathBuf,
    url: String,
    session_id: String,
    app: tauri::AppHandle,
    file_info: String,
    size: usize,
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
    let app_clone = app.clone();
    let file_info_clone = file_info.clone();
    let mut curr = 0;
    let mut reader_stream = ReaderStream::new(file);
    let mut last_emit = Instant::now();
    let progress_stream = stream! {

            let state = app_clone.state::<Mutex<CancelOngoingUpload>>();
            let mut cancel = state.lock().await;

            while let Some(chunk) = reader_stream.next().await {
            if cancel.val {
                *cancel = CancelOngoingUpload {val: false};
                break;
            };
            if let Ok(ref bytes) = chunk{
                curr += bytes.len();
                if last_emit.elapsed() >= Duration::from_millis(100){
                    let _ = app_clone.emit("upload_progress", ByteProgress{current: curr, info: file_info_clone.clone()});
                    last_emit = Instant::now();
                };
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
        Ok(_) => {
            let _ = app.emit(
                "upload_progress",
                ByteProgress {
                    current: size,
                    info: file_info.clone(),
                },
            );
            return Ok("Sent".to_string());
        }
        Err(_) => Err("Failed to send".to_string()),
    }
}

#[tauri::command]
pub async fn download_file_from_sender(
    url: String,
    session_id: String,
    app_handle: tauri::AppHandle,
    sender_id: String,
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

    let mut download_dir = match file_types::get_save_dir(&app_handle).await {
        Ok(dir) => dir,
        Err(_) => return Err(String::from("Failed to get app folder")),
    };

    let sub_folder = file_types::folder_name(&file_type);
    let safe_file_name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    download_dir.push(sub_folder);
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
    let mut last_emit = Instant::now();
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        if file.write_all(&chunk).await.is_err() {
            return Err("Failed to write to file".to_string());
        }
        current += chunk.len() as u64;
        let duration = Duration::from_millis(100);
        if last_emit.elapsed() >= duration {
            let _ = app_handle.emit(
                "download_progress",
                DownloadProgressPayload {
                    file_name: file_name.clone(),
                    file_path: file_path.clone(),
                    file_size,
                    file_type: file_type_str.clone(),
                    total: file_size,
                    current,
                    sender_id: sender_id.clone(),
                },
            );
            last_emit = Instant::now();
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
            sender_id,
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
pub async fn save_settings(app: tauri::AppHandle, settings: String) -> Result<(), String> {
    let settings_path = get_file_path(&app, "settings.json").await?;

    match write(settings_path.0, settings.as_bytes()).await {
        Ok(_) => {}
        Err(_) => return Err("Couldn't write to settings file".to_string()),
    };
    Ok(())
}

#[tauri::command]
pub async fn get_settings(
    app: tauri::AppHandle,
    default_settings: String,
) -> Result<String, String> {
    let (settings_path, was_created) = get_file_path(&app, "settings.json").await?;
    let settings: String;

    if was_created {
        match write(settings_path, default_settings.as_bytes()).await {
            Ok(_) => {
                settings = default_settings;
            }
            Err(_) => return Err("Couldn't write to settings file".to_string()),
        };
    } else {
        settings = read_json_file(settings_path).await?;
    };

    Ok(settings)
}

#[tauri::command]
pub async fn get_transferred(app: tauri::AppHandle) -> Result<String, String> {
    let (path, was_created) = get_file_path(&app, "transfers.json").await?;
    if was_created {
        return Ok("[]".to_string());
    }
    let content = read_json_file(path).await?;
    Ok(content)
}
#[tauri::command]
pub async fn save_transfer(app: tauri::AppHandle, content: String) -> Result<(), String> {
    let (path, _) = get_file_path(&app, "transfers.json").await?;
    match write(path, content).await {
        Ok(_) => {}
        Err(_) => return Err("Failed to save file".to_string()),
    };
    Ok(())
}

#[tauri::command]
pub async fn get_traverse_cache(app: tauri::AppHandle) -> Result<String, String> {
    let (path, was_created) = get_file_path(&app, "cache.json").await?;
    if was_created {
        return Ok("{}".to_string());
    };
    Ok(read_json_file(path).await?)
}

#[tauri::command]
pub async fn save_traverse_cache(app: tauri::AppHandle, content: String) -> Result<(), String> {
    let (path, _) = get_file_path(&app, "cache.json").await?;
    match write(path, content).await {
        Ok(_) => {}
        Err(_) => return Err("Failed to save file".to_string()),
    };
    Ok(())
}

#[tauri::command]
pub async fn list_dir(
    app: tauri::AppHandle,
    dir: Option<PathBuf>,
    include_files: Option<bool>,
) -> Result<DirList, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = match dir {
            Some(p) => p,
            None => get_home_dir(&app),
        };
        let show_file = match include_files {
            Some(b) => b,
            None => false,
        };
        let mut dir_list = DirList {
            folders: Vec::new(),
            files: Vec::new(),
        };
        let entries = WalkDir::new(path)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| {
                let not_hidden = e
                    .path()
                    .to_str()
                    .unwrap_or(".filter")
                    .split("/")
                    .all(|f| !f.starts_with("."));
                if show_file {
                    return true && not_hidden;
                } else {
                    return e.file_type().is_dir();
                }
            });
        for e in entries {
            if e.file_type().is_dir() {
                let folder = FolderRes {
                    folder_name: e.file_name().to_string_lossy().into_owned(),
                    path: e.path().into(),
                };
                dir_list.folders.push(folder);
            } else if show_file && e.file_type().is_file() {
                let size = match e.metadata() {
                    Ok(meta) => meta.len(),
                    Err(_) => 0,
                };
                let clone = e.clone();

                let ext = match clone.path().extension() {
                    Some(str) => match str.to_str() {
                        Some(s) => s,
                        None => continue,
                    },
                    None => continue,
                };
                let modified = e
                    .metadata()
                    .ok()
                    .and_then(|meta| meta.created().or_else(|_| meta.modified()).ok())
                    .unwrap_or(SystemTime::UNIX_EPOCH);

                let file = FileResWithType {
                    file_name: e.file_name().to_string_lossy().into_owned(),
                    file_path: e.into_path(),
                    file_size: size,
                    file_type: get_file_type(ext).to_owned(),
                    last_modified: modified,
                };
                dir_list.files.push(file);
            };
        }
        Ok(dir_list)
    })
    .await
    .map_err(|e| format!("Thread operation failed: {}", e))?
}
