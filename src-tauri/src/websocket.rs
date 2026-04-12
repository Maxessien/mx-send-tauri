use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use serde::{Serialize, Deserialize};

pub async fn ws_handler(ws: WebSocketUpgrade)-> impl IntoResponse {
    ws.on_upgrade(ws_fn)
}


#[derive(Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum Messages {
    Progress {current: u64, total: u64},
    Newfile(String),
    NewConnection(String)
}

pub async  fn ws_fn(mut socket: WebSocket){
    let welcome = Messages::NewConnection("New user".to_string());
    let _ = socket.send(Message::Text(serde_json::to_string(&welcome).unwrap().into())).await;

    while let Some(msg) = socket.recv().await {
        if socket.send(Message::Text("Ping".into())).await.is_err() {
            // client disconnected
            return;
        }
        let message = match msg {
            Ok(m)=>m,
            Err(_)=>return
        };
        if let Message::Text(text) = message {
            if let Ok(event) = serde_json::from_str::<Messages>(&text){
                match event {
                    Messages::Newfile(file)=> {
                        let e = Messages::Newfile(file);
                        let socket_res = socket.send(Message::Text(serde_json::to_string(&e).unwrap().into())).await;
                        match socket_res {
                            Ok(_)=>(),
                            Err(_)=>()
                        }
                    },
                    Messages::Progress { current, total }=>{
                        let e = Messages::Progress { current, total };
                        let socket_res = socket.send(Message::Text(serde_json::to_string(&e).unwrap().into())).await;
                        match socket_res {
                            Ok(_)=>(),
                            Err(_)=>()
                        }
                    },
                    Messages::NewConnection(_)=>{
                        let e = Messages::NewConnection("New user".to_string());
                        let socket_res = socket.send(Message::Text(serde_json::to_string(&e).unwrap().into())).await;
                        match socket_res {
                            Ok(_)=>(),
                            Err(_)=>()
                        }
                    }
                };
            }
        }  
    }
}