use serde::{Deserialize, Serialize};
use socketioxide::{
    BroadcastError, SendError, extract::{Data, SocketRef}
};

#[derive(Serialize, Deserialize)]
struct Progress {
    current: u64,
    total: u64,
    file_name: String,
    file_size: u64,
    file_type: String,
    sender_id: String,
}

fn handle_broadcast_events(res: Result<(), BroadcastError>) {
    match res {
        Ok(_) => (),
        Err(err) => {
            dbg!(err);
            ()
        }
    }
}

fn handle_emit_events(res: Result<(), SendError>) {
    match res {
        Ok(_) => (),
        Err(err) => {
            dbg!(err);
            ()
        }
    }
}

pub async fn handle_socket(socket: SocketRef) {
    socket.on(
        "progress",
        async |socket: SocketRef, Data(data): Data<Progress>| {
            handle_emit_events(socket.emit("progress", &data));
        },
    );
    socket.on(
        "newConnection",
        async |socket: SocketRef, Data(data): Data<String>| {
            handle_broadcast_events(socket.broadcast().emit("newConnection", &data).await);
        },
    );
    socket.on(
        "newFile",
        async |socket: SocketRef, Data(data): Data<String>| {
            handle_broadcast_events(socket.broadcast().emit("newFile", &data).await);
        },
    );
    ()
}
