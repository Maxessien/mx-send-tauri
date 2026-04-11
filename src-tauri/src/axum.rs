use std::path::PathBuf;

use axum::{
    http::Method,
    middleware,
    routing::{any, get, post},
    Router,
};
use tauri::AppHandle;
use tokio::net::TcpListener;
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

const PORTS: [&str; 5] = ["5055", "5000", "2130", "1254", "3030"];

async fn get_available_listener() -> TcpListener {
    for port in PORTS {
        if let Ok(tcp) = tokio::net::TcpListener::bind("0.0.0.0:".to_owned() + port).await {
            return tcp;
        }
    }

    //Use default with unwrap if tcp was never returned from ports
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    listener
}

pub fn create_server(app_handle: AppHandle) {
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

        let listener = get_available_listener().await;

        axum::serve(listener, app).await.unwrap();
    });
}
