// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use crate::axum::AllowedFileList;
use futures_util::lock::Mutex;
use uuid::Uuid;
// use async_;

pub(crate) mod axum;
pub(crate) mod commands;
pub(crate) mod file_types;
pub(crate) mod handler;
pub(crate) mod websocket;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_android_external_storage::init())
        .plugin(tauri_plugin_safe_area_insets_css::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_conn_server,
            commands::disconnect_server,
            commands::list_files,
            commands::send_file,
            commands::save_file,
            commands::download_file_from_sender,
            commands::req_file_access,
            commands::test_emit
        ])
        .manage(Mutex::new(AllowedFileList { list: Vec::new() }))
        .manage(Mutex::new(commands::SessionId(Uuid::new_v4())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
