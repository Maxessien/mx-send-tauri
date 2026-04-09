use std::path::PathBuf;

use axum::{
    http::Method,
    middleware,
    routing::{get, post, any},
    Router,
};
use tauri::AppHandle;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

use crate::handler;
use crate::websocket;

#[derive(Clone)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub id: Uuid,
    pub path: PathBuf,
}

pub struct AllowedFileList {
    pub list: Vec<FileInfo>,
}



#[tokio::main]
pub async fn create_server(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let cors = CorsLayer::new()
            .allow_methods([Method::POST, Method::GET])
            .allow_origin(Any);
        let app =
            Router::new()
                .route("/upload", post(handler::add_to_filelist))
                .route("/download", get(handler::download_from_filelist))
                .route("/receiver/upload", post(handler::upload_file))
                .route("/ws", any(websocket::ws_handler))
                .route_layer(ServiceBuilder::new().layer(cors).layer(
                    middleware::from_fn_with_state(app_handle.clone(), handler::verify_session_id),
                ))
                .with_state(app_handle);

        let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

        axum::serve(listener, app).await.unwrap();
    });
}
