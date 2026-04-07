// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use futures_util::lock::Mutex;
use local_ip_address::local_ip;
use uuid::Uuid;
use serde::Serialize;

use crate::axum::AllowedFileList;

pub(crate) mod axum;

struct SessionId(Uuid);

#[derive(Serialize)]
struct CreateConnRes {
    session_id: Uuid,
    ip_address: String,
}


#[tauri::command]
async fn create_conn_server<'a>(
    state: tauri::State<'a, SessionId>,
) -> Result<CreateConnRes, String> {
    let id = state.0.clone();
    let ip = match local_ip() {
        Ok(addr) => addr.to_string(),
        Err(_) => return Err(String::from("No Ip address found")),
    };
    let res = CreateConnRes {
        session_id: id,
        ip_address: ip,
    };
    Ok(res)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![create_conn_server])        
        .manage(AllowedFileList {
            list: Mutex::new(Vec::new()),
        })
        .manage(SessionId(Uuid::new_v4()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
