use serde::{Deserialize, Serialize};
use socketioxide::{
    BroadcastError, extract::{Data, SocketRef}
};


#[derive(Serialize, Deserialize)]
struct NewFile {
    file_id: String,
    sender_id: String
}

pub fn handle_broadcast_events(res: Result<(), BroadcastError>) {
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
        "newConnection",
        async |socket: SocketRef, Data(data): Data<String>| {
            handle_broadcast_events(socket.broadcast().emit("newConnection", &data).await);
        },
    );
    socket.on(
        "newFile",
        async |socket: SocketRef, Data(data): Data<NewFile>| {
            handle_broadcast_events(socket.broadcast().emit("newFile", &data).await);
        },
    );
    ()
}
