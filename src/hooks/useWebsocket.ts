import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../store";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { setConnection } from "../store-slices/connectionSlice";
import { Transfer } from "../types";

const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count } = useSelector(
    (state: RootState) => state.connection,
  );
  const socket = useRef<Socket | null>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    if (isConnected || role === "sender") {
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}`;
      socket.current = io(url, {
        path: "/ws",
        query: { session: connectionInfo.session_id },
      });
      socket.current.on("connect", () => console.log("Socket connected"));
      socket.current.on("disconnect", (reason, desc) =>
        console.log("Socket disconnected", { reason, desc }),
      );
      socket.current.on("newConnection", () => {
        console.log("new connection")
        dispatch(
          setConnection({
            connectionInfo: connectionInfo,
            count: count + 1,
            isConnected: true,
            role: role,
          }),
        );
      });
      socket.current.on("progress", (data: Transfer) => {
        console.log("progress", data)
        dispatch(updateTransferProgress(data));
      });
    }
  }, [isConnected, role]);

  return { socket };
};

export default useWebsocket;
