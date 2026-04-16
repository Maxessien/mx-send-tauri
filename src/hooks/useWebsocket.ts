import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { setConnection } from "../store-slices/connectionSlice";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { SocketMessage, Transfer } from "../types";

const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count } =
    useSelector((state: RootState) => ({
      ...state.connection,
      ...state.allFiles,
    }));
  const socket = useRef<WebSocket | null>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    if (isConnected || role === "sender") {
      socket.current = new WebSocket(
        `http://${connectionInfo.ip_address}:${connectionInfo.port}/ws?session=${connectionInfo.session_id}`,
      );
      socket.current.onopen = () => console.log("Websocket running");
      socket.current.onerror = () => console.log("Websocket error");
      socket.current.onmessage = (e: MessageEvent<string>) => {
        const data = JSON.parse(e.data) as SocketMessage;
        switch (data.type) {
          case "NewConnection":
            dispatch(
              setConnection({
                connectionInfo: connectionInfo,
                count: count + 1,
                isConnected: true,
                role: "sender",
              }),
            );
            break;
          case "Progress":
            dispatch(updateTransferProgress(data.payload as Transfer));
            break;
          default:
            break;
        }
      };
    }
  }, [isConnected, role]);

  return { socket };
};

export default useWebsocket;
