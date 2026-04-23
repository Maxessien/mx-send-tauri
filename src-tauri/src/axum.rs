use std::path::PathBuf;

use axum::{
    http::Method,
    middleware,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use socketioxide::{
    extract::{Data, SocketRef},
    SocketIoBuilder,
};
use tauri::AppHandle;
use tokio::{net::TcpListener, sync::RwLock};
use tokio_util::sync::CancellationToken;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use uuid::Uuid;

use crate::handler;
use crate::websocket;

#[derive(Clone)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub id: Uuid,
    pub path: PathBuf,
    pub file_type: handler::FileType,
}

pub struct AllowedFileList {
    pub list: Vec<FileInfo>,
}

const PORTS: [&str; 5] = ["5055", "5000", "2130", "1254", "3030"];

async fn get_available_listener() -> (TcpListener, String) {
    for port in PORTS {
        println!("Testing port {}", port);
        if let Ok(tcp) = tokio::net::TcpListener::bind("0.0.0.0:".to_owned() + port).await {
            return (tcp, String::from(port));
        }
    }

    //Use default with unwrap if tcp was never returned from ports
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    (listener, String::from("3000"))
}

pub static CANCEL_TOKEN: RwLock<Option<CancellationToken>> = RwLock::const_new(None);

#[derive(Serialize, Deserialize)]
struct Progress {
    current: u64,
    total: u64,
    file_name: String,
    file_size: u64,
    file_type: String,
    sender_id: String,
}

pub async fn create_server(app_handle: AppHandle) -> String {
    let (listener, port) = get_available_listener().await;
    tauri::async_runtime::spawn(async move {
        let token = CancellationToken::new();
        let mut cancel = CANCEL_TOKEN.write().await;
        *cancel = Some(token.clone());
        let cors = CorsLayer::new()
            .allow_methods([Method::POST, Method::GET, Method::DELETE, Method::PATCH])
            .allow_origin(Any)
            .allow_headers(Any)
            .expose_headers([
                "file_name".parse().unwrap(),
                "file_path".parse().unwrap(),
                "file_size".parse().unwrap(),
                "file_type".parse().unwrap(),
            ]);

        let (layer, io) = SocketIoBuilder::new().req_path("/ws").build_layer();
        let io_out_clone = io.clone();
        io.ns("/", async move |s: SocketRef| {
            let io_clone = io_out_clone.clone();
            s.on(
                "progress",
                async move |_socket: SocketRef, Data(data): Data<Progress>| {
                    websocket::handle_broadcast_events(io_clone.emit("progress", &data).await);
                },
            );
            websocket::handle_socket(s).await
        });
        
        let app = Router::new()
            .route("/upload", post(handler::add_to_filelist))
            .route("/download", get(handler::download_from_filelist))
            .route("/receiver/upload", post(handler::upload_file))
            .route_layer(middleware::from_fn_with_state(
                app_handle.clone(),
                handler::verify_session_id,
            ))
            .layer(layer)
            .layer(cors)
            .layer(TraceLayer::new_for_http())
            .with_state(app_handle);
        axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                token.cancelled().await;
                println!("Axum server stopped, but the app is still running!");
            })
            .await
            .unwrap();
    });
    port
}
