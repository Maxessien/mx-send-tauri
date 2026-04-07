use std::{fs::{metadata}, os::windows::fs::MetadataExt, path::Path};

use axum::{Router, extract::{Json, State, Query}, http::StatusCode, routing::{post, get}};
use futures_util::{lock::Mutex};
use serde::{Deserialize};
use tauri::{Manager, AppHandle};
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

    axum::serve(listener, app).await.unwrap()
}


async fn add_to_filelist(State(app): State<AppHandle>, Json(file_pt): Json<UploadPath>)->StatusCode {
    let state = app.state::<Mutex<AllowedFileList>>();
    let allowed = state.lock().await;

    let path = Path::new(&file_pt.path);
    let metadata = metadata(&file_pt.path);
    let file = path.file_name();

    let size = match metadata {
        Ok(meta) => meta.file_size(),
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
struct FileId (String);

async fn download_from_filelist(State(app): State<AppHandle>, Query(file_id): Query<FileId>)->StatusCode{
    StatusCode::ACCEPTED
}