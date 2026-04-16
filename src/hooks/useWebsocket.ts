import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { setConnection } from "../store-slices/connectionSlice";
import { determineFilesEqual } from "../utils/file-utils";
import { modifyTransferring } from "../store-slices/allFilesSlice";
import { SocketMessage, Transfer } from "../types";

const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count, transferring } =
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
            const newTransfer = data.payload as Transfer;
            const alreadyExists = transferring.find((file) =>
              determineFilesEqual(file, newTransfer),
            );
            if (newTransfer.current >= newTransfer.total) {
              const updated = transferring.filter(
                (file) => !determineFilesEqual(file, newTransfer),
              );
              dispatch(modifyTransferring(updated));
              break;
            }

            if (!alreadyExists) break;

            const updated = transferring.map((file) =>
              determineFilesEqual(file, newTransfer)
                ? { ...file, current: newTransfer.current }
                : file,
            );
            dispatch(modifyTransferring(updated));
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
