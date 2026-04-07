use std::{path::Path};

use axum::{Router, body::Body, extract::{Json, Query, State}, http::{Response, StatusCode, header}, response::IntoResponse, routing::{get, post}};
use futures_util::{lock::Mutex};
use serde::{Deserialize, Serialize};
use tauri::{Manager, AppHandle};
use tokio::fs::{File, metadata};
use tokio_util::io::ReaderStream;
// use tokio::fs::{};
use uuid::Uuid;


pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub id: Uuid,
    pub path: String
}

pub struct AllowedFileList {
    pub list: Mutex<Vec<FileInfo>>
}

#[derive(Deserialize)]
struct UploadPath {
    path: String
}

#[tokio::main]
pub async fn create_server(app_handle: AppHandle){
    let app = Router::new().route("/upload", post(add_to_filelist)).route("/download", get(download_from_filelist)).with_state(app_handle);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();

}

async fn add_to_filelist(State(app): State<AppHandle>, Json(file_pt): Json<UploadPath>)->StatusCode {
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;

    let path = Path::new(&file_pt.path);
    let metadata = metadata(&file_pt.path).await;
    let file = path.file_name();

    let size = match metadata {
        Ok(meta) => meta.len(),
        Err(_)=>return StatusCode::NOT_FOUND
    };

    let name = match file {
        Some(f)=> match f.to_str(){
            Some(str)=> String::from(str),
            None => return StatusCode::NOT_FOUND
        },
        None => return StatusCode::NOT_FOUND
    };

    allowed.list.lock().await.push(FileInfo { name: name, size: size, id: Uuid::new_v4(), path: file_pt.path });

    StatusCode::CREATED
}

#[derive(Deserialize)]
struct FileId (Uuid);

#[derive(Serialize)]
struct DownloadErrResponse {
    message: String
}

async fn download_from_filelist(State(app): State<AppHandle>, Query(file_id): Query<FileId>)->(StatusCode, impl IntoResponse){
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;
    let list_guard = allowed.list.lock().await;
    let file_info = list_guard.iter().find(|item| item.id == file_id.0);

    let file = match file_info {
        Some(info)=> {
            let open_file = File::open(&info.path).await;
            match open_file {
                Ok(file)=>{
                    let stream = ReaderStream::new(file);
                    let body = Body::from_stream(stream);

                    let safe_name = info.name.replace('"', "\\\"").replace('\n', "").replace('\r', "");
                    Response::builder().status(200).header(header::CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", safe_name)).body(body)                                },
                Err(_)=>return (StatusCode::INTERNAL_SERVER_ERROR, Json(DownloadErrResponse{message: String::from("Failed to open file")}).into_response())
            }
        }
        None => return (StatusCode::NOT_FOUND, Json(DownloadErrResponse{message: String::from("File not allowed")}).into_response())
    };

    let response = match file {
        Ok(res)=>(StatusCode::OK, res.into_response()),
        Err(_)=> (StatusCode::INTERNAL_SERVER_ERROR, Json(DownloadErrResponse{message: String::from("Failed to get file")}).into_response())
    };

    response

}