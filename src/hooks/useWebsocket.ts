import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { setConnection } from "../store-slices/connectionSlice";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { Transfer } from "../types";
import { io, Socket } from "socket.io-client";

const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count } = useSelector(
    (state: RootState) => ({
      ...state.connection,
      ...state.allFiles,
    }),
  );
  const socket = useRef<Socket | null>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
    if (isConnected || role === "sender") {
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/ws?session=${connectionInfo.session_id}`;
      socket.current = io(url);
      socket.current.on("connect", () => console.log("Socket connected"));
      socket.current.on("disconnect", (reason, desc) =>
        console.log("Socket disconnected", { reason, desc }),
      );
      socket.current.on("newConnection", () => {
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
        dispatch(updateTransferProgress(data));
      });
    }
  }, [isConnected, role]);

  return { socket };
};

export default useWebsocket;
