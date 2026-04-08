use std::path::Path; // Extract only the filename, stripping any path components

use axum::{
    body::{Body, Bytes},
    extract::{Json, Query, State},
    http::{header, Response, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use futures_util::lock::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::{
    fs::{metadata, File},
    io::AsyncWriteExt,
};
use tokio_util::io::ReaderStream;
// use tokio::fs::{};
use uuid::Uuid;

pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub id: Uuid,
    pub path: String,
}

pub struct AllowedFileList {
    pub list: Mutex<Vec<FileInfo>>,
}

#[derive(Deserialize)]
struct UploadPath {
    path: String,
}

#[derive(Deserialize)]
struct FileId {
    id: Uuid,
}

#[derive(Serialize)]
struct DownloadErrResponse {
    message: String,
}

#[derive(Deserialize)]
enum FileType {
    Audio,
    Video,
    Document,
    Image,
    Other,
}

#[derive(Deserialize)]
struct UploadFileQuery {
    name: String,
    size: u64,
    file_type: FileType,
}

#[tokio::main]
pub async fn create_server(app_handle: AppHandle) {
    let app = Router::new()
        .route("/upload", post(add_to_filelist))
        .route("/download", get(download_from_filelist))
        .route("/receiver/upload", post(upload_file))
        .with_state(app_handle);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn upload_file(
    State(app): State<AppHandle>,
    Query(query): Query<UploadFileQuery>,
    body: Bytes,
) -> StatusCode {
    let mut download_dir = match app.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => return StatusCode::EXPECTATION_FAILED,
    };
    let sub_folder = match query.file_type {
        FileType::Audio => String::from("audio"),
        FileType::Document => String::from("document"),
        FileType::Image => String::from("image"),
        FileType::Video => String::from("video"),
        FileType::Other => String::from("other"),
    };

    let safe_name = std::path::Path::new(&query.name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");
    
    download_dir.push(format!("mxsend/{}/{}", sub_folder, safe_name));

    if let Some(parent) = download_dir.parent() {
        if let Err(_) = tokio::fs::create_dir_all(parent).await {
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    }

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return StatusCode::CONFLICT,
    };

    match file.write_all(&body).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn add_to_filelist(
    State(app): State<AppHandle>,
    Json(file_pt): Json<UploadPath>,
) -> StatusCode {
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;

    let path = Path::new(&file_pt.path);
    let metadata = metadata(&file_pt.path).await;
    let file = path.file_name();

    let size = match metadata {
        Ok(meta) => meta.len(),
        Err(_) => return StatusCode::NOT_FOUND,
    };

    let name = match file {
        Some(f) => match f.to_str() {
            Some(str) => String::from(str),
            None => return StatusCode::NOT_FOUND,
        },
        None => return StatusCode::NOT_FOUND,
    };

    allowed.list.lock().await.push(FileInfo {
        name: name,
        size: size,
        id: Uuid::new_v4(),
        path: file_pt.path,
    });

    StatusCode::CREATED
}

async fn download_from_filelist(
    State(app): State<AppHandle>,
    Query(file_id): Query<FileId>,
) -> (StatusCode, impl IntoResponse) {
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;
    let list_guard = allowed.list.lock().await;
    let file_info = list_guard.iter().find(|item| item.id == file_id.id);

    let file = match file_info {
        Some(info) => {
            let open_file = File::open(&info.path).await;
            match open_file {
                Ok(file) => {
                    let stream = ReaderStream::new(file);
                    let body = Body::from_stream(stream);

                    let safe_name = info
                        .name
                        .replace('"', "\\\"")
                        .replace('\n', "")
                        .replace('\r', "");
                    Response::builder()
                        .status(200)
                        .header(
                            header::CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{}\"", safe_name),
                        )
                        .body(body)
                }
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(DownloadErrResponse {
                            message: String::from("Failed to open file"),
                        })
                        .into_response(),
                    )
                }
            }
        }
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(DownloadErrResponse {
                    message: String::from("File not allowed"),
                })
                .into_response(),
            )
        }
    };

    let response = match file {
        Ok(res) => (StatusCode::OK, res.into_response()),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(DownloadErrResponse {
                message: String::from("Failed to get file"),
            })
            .into_response(),
        ),
    };

    response
}
