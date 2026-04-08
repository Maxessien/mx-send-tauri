// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use futures_util::lock::Mutex;
use local_ip_address::local_ip;
use uuid::Uuid;
use serde::Serialize;
use crate::axum::AllowedFileList;

pub(crate) mod axum;
pub(crate) mod websocket;

pub struct SessionId(Uuid);

#[derive(Serialize)]
struct CreateConnRes {
    session_id: Uuid,
    ip_address: String,
}

#[tauri::command]
async fn create_conn_server<'a>(
    app_handle: tauri::AppHandle,
    state: tauri::State<'a, Mutex<SessionId>>,
) -> Result<CreateConnRes, String> {
    axum::create_server(app_handle);
    let mut id_state = state.lock().await;
    id_state.0 = Uuid::new_v4();
    let ip = match local_ip() {
        Ok(addr) => addr.to_string(),
        Err(_) => return Err(String::from("No Ip address found")),
    };
    let res = CreateConnRes {
        session_id: id_state.0,
        ip_address: ip,
    };
    Ok(res)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![create_conn_server])        
        .manage(Mutex::new(AllowedFileList {
            list: Vec::new(),
        }))
        .manage(Mutex::new(SessionId(Uuid::new_v4())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
