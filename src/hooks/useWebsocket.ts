import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../store";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { setConnection } from "../store-slices/connectionSlice";
import { Transfer } from "../types";


export let socket: Socket | null = null

const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count } = useSelector(
    (state: RootState) => state.connection,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket) {
      socket.close();
      dispatch(setConnection({ connectionInfo, count, isConnected, role }))
      socket = null
    }
    if (isConnected || role === "sender") {
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}`;
      socket = io(url, {
        path: "/ws",
        query: { session: connectionInfo.session_id },
      });

      dispatch(setConnection({connectionInfo, count, isConnected, role}))

      socket.on("connect", () => {
        console.log("Socket connected")
      });
      socket.on("disconnect", (reason, desc) =>{
        console.log("Socket disconnected", { reason, desc })
        dispatch(
          setConnection({
            count: 0,
            isConnected: false,
            role: "receiver",
            connectionInfo: { ip_address: "", port: "", session_id: "" },
          }),
        );
        socket = null
      });
      socket.on("newConnection", () => {
        console.log("new connection")
        dispatch(
          setConnection({
            connectionInfo,
            count: count + 1,
            isConnected: true,
            role,
          }),
        );
      });
      socket.on("progress", (data: Transfer) => {
        dispatch(updateTransferProgress(data));
      });
    }
  }, [isConnected, role]);

  return { socket };
};

export default useWebsocket;
