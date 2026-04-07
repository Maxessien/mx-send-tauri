// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/


use futures_util::lock::Mutex;

use crate::axum::AllowedFileList;

pub(crate) mod axum;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .manage(AllowedFileList {list: Mutex::new(Vec::new())})
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
