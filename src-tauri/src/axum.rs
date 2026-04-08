use std::path::Path; // Extract only the filename, stripping any path components

use axum::{
    body::{Body, Bytes},
    extract::{Json, Query, Request, State},
    http::{header, Method, Response, StatusCode},
    middleware::{self, Next},
    response::IntoResponse,
    routing::{get, post, any},
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
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

use crate::websocket;
use crate::SessionId;

pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub id: Uuid,
    pub path: String,
}

pub struct AllowedFileList {
    pub list: Vec<FileInfo>,
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
    tauri::async_runtime::spawn(async move {
        let cors = CorsLayer::new()
            .allow_methods([Method::POST, Method::GET])
            .allow_origin(Any);
        let app =
            Router::new()
                .route("/upload", post(add_to_filelist))
                .route("/download", get(download_from_filelist))
                .route("/receiver/upload", post(upload_file))
                .route("/ws", any(websocket::ws_handler))
                .route_layer(ServiceBuilder::new().layer(cors).layer(
                    middleware::from_fn_with_state(app_handle.clone(), verify_session_id),
                ))
                .with_state(app_handle);

        let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

        axum::serve(listener, app).await.unwrap();
    });
}

async fn verify_session_id(
    State(app): State<AppHandle>,
    req: Request<Body>,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    let header = match req.headers().get(header::AUTHORIZATION) {
        Some(h) => h.to_str(),
        None => return Err(StatusCode::UNAUTHORIZED),
    };
    let id = match header {
        Ok(id_str) => match id_str.strip_prefix("Bearer") {
            Some(stripped_id) => stripped_id,
            None => return Err(StatusCode::UNAUTHORIZED),
        },
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    let state = app.state::<Mutex<SessionId>>();
    let state_guard = state.lock().await;
    let sess_guard = state_guard.0;

    let sess_id = sess_guard.to_string();

    let is_authorised = sess_id == String::from(id);

    if !is_authorised {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(req).await)
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
) -> (StatusCode, String) {
    let state = app.state::<Mutex<AllowedFileList>>();
    let mut allowed = state.lock().await;

    let path = Path::new(&file_pt.path);
    let metadata = metadata(&file_pt.path).await;
    let file = path.file_name();

    let size = match metadata {
        Ok(meta) => meta.len(),
        Err(_) => return (StatusCode::NOT_FOUND, String::from("File not found")),
    };

    let name = match file {
        Some(f) => match f.to_str() {
            Some(str) => String::from(str),
            None => return (StatusCode::NOT_FOUND, String::from("File not found")),
        },
        None => return (StatusCode::NOT_FOUND, String::from("File not found")),
    };

    let file_id = Uuid::new_v4();

    allowed.list.push(FileInfo {
        name: name,
        size: size,
        id: file_id,
        path: file_pt.path,
    });

    (StatusCode::CREATED, file_id.to_string())
}

async fn download_from_filelist(
    State(app): State<AppHandle>,
    Query(file_id): Query<FileId>,
) -> (StatusCode, impl IntoResponse) {
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;
    let file_info = allowed.list.iter().find(|item| item.id == file_id.id);

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
