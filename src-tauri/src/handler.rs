use std::path::{Path, PathBuf};

use axum::{
    body::Body,
    extract::{Json, Query, State},
    http::{Response, StatusCode, header},
    middleware::Next,
    response::IntoResponse,
};
use futures_util::{StreamExt, lock::Mutex};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::{
    fs::{metadata, File},
    io::AsyncWriteExt,
};
use tokio_util::io::{ReaderStream};
use uuid::Uuid;

use crate::{axum::AllowedFileList, file_types};
use crate::file_types::folder_name;
use crate::commands::SessionId;

type HttpRequest = axum::http::Request<Body>;

#[derive(Deserialize)]
pub struct UploadPath {
    pub path: PathBuf,
    pub file_type: FileType,
}

#[derive(Deserialize)]
pub struct FileId {
    pub id: Uuid,
}

#[derive(Serialize)]
pub struct DownloadErrResponse {
    pub message: String,
}

#[derive(Clone)]
#[derive(Deserialize)]
pub enum FileType {
    Audio,
    Video,
    Document,
    Image,
}

#[derive(Deserialize)]
pub struct UploadFileQuery {
    pub name: String,
    // pub size: u64,
    pub file_type: FileType,
}

#[derive(Deserialize)]
pub struct WsSessionQuery {
    pub session: String,
}

pub async fn verify_session_id(
    State(app): State<AppHandle>,
    req: HttpRequest,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    let id = if req.uri().path() == "/ws" {
        let Query(ws_query) = Query::<WsSessionQuery>::try_from_uri(req.uri())
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        ws_query.session
    } else {
        let header = match req.headers().get(header::AUTHORIZATION) {
            Some(h) => h.to_str(),
            None => return Err(StatusCode::UNAUTHORIZED),
        };
        match header {
            Ok(id_str) => match id_str.strip_prefix("Bearer ") {
                Some(stripped_id) => String::from(stripped_id),
                None => return Err(StatusCode::UNAUTHORIZED),
            },
            Err(_) => return Err(StatusCode::UNAUTHORIZED),
        }
    };
    let state = app.state::<Mutex<SessionId>>();
    let state_guard = state.lock().await;
    let sess_guard = state_guard.0;

    let sess_id = sess_guard.to_string();

    let is_authorised = sess_id == id;

    if !is_authorised {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(req).await)
}

pub async fn upload_file(
    State(app): State<AppHandle>,
    Query(query): Query<UploadFileQuery>,
    body: Body,
) -> StatusCode {
    println!("Uploading");
    let mut download_dir = match app.path().download_dir() {
        Ok(dir) => dir,
        Err(_) => return StatusCode::EXPECTATION_FAILED,
    };
    let sub_folder = folder_name(&query.file_type);

    let safe_name = std::path::Path::new(&query.name)
        .file_name()
        .and_then(|n| n.to_str());

    let safe_name = match safe_name {
        Some(n) => n,
        None => return StatusCode::NOT_ACCEPTABLE,
    };

    download_dir.push(format!("mxsend/{}", sub_folder));

    if let Err(_) = tokio::fs::create_dir_all(&download_dir).await {
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    download_dir.push(safe_name);

    download_dir = match file_types::handle_duplicate_path(download_dir) {
        Ok(path)=>path,
        Err(_)=>return StatusCode::INTERNAL_SERVER_ERROR
    };

    let mut file = match File::create_new(&download_dir).await {
        Ok(f) => f,
        Err(_) => return StatusCode::CONFLICT,
    };
    
    let mut body_stream: axum::body::BodyDataStream = body.into_data_stream();
    while let Some(chunk) = body_stream.next().await {
        if let Ok(bytes) = chunk {
            let _ = file.write_all(&bytes).await;
        } 
    };

    if let Err(_) = file.flush().await {
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    StatusCode::OK
}

pub async fn add_to_filelist(
    State(app): State<AppHandle>,
    Json(file_pt): Json<UploadPath>,
) -> (StatusCode, String) {
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

    let state = app.state::<Mutex<AllowedFileList>>();
    let mut allowed = state.lock().await;

    allowed.list.push(crate::axum::FileInfo {
        name: name,
        size: size,
        id: file_id,
        path: file_pt.path,
        file_type: file_pt.file_type
    });

    (StatusCode::CREATED, file_id.to_string())
}

pub async fn download_from_filelist(
    State(app): State<AppHandle>,
    Query(file_id): Query<FileId>,
) -> (StatusCode, impl IntoResponse) {
    let state = app.state::<Mutex<AllowedFileList>>();
    let file_data = {
        let allowed = state.lock().await;
        let file_info = allowed
            .list
            .iter()
            .find(|item| item.id == file_id.id)
            .cloned();
        file_info
    };

    let file = match file_data {
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
                        .header("file_size", info.size)
                        .header("file_name", info.name)
                        .header("file_type", match info.file_type {
                            FileType::Audio => "audio",
                            FileType::Image => "image",
                            FileType::Document => "document",
                            FileType::Video => "video",
                        })
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
