import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { RootState } from "../store";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { setConnection } from "../store-slices/connectionSlice";
import { Transfer } from "../types";


const useWebsocket = () => {
  const { connectionInfo, isConnected, role, count, socket } = useSelector(
    (state: RootState) => state.connection,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket) {
      socket.close();
      dispatch(setConnection({connectionInfo, count, isConnected, role, socket: null}))
    }
    if (isConnected || role === "sender") {
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}`;
      const socketIo = io(url, {
        path: "/ws",
        query: { session: connectionInfo.session_id },
      });
	
        dispatch(setConnection({connectionInfo, count, isConnected, role, socket: socketIo}))

      socketIo.on("connect", () => {
        console.log("Socket connected")
      });
      socketIo.on("disconnect", (reason, desc) =>
        console.log("Socket disconnected", { reason, desc }),
      );
      socketIo.on("newConnection", () => {
        console.log("new connection")
        dispatch(
          setConnection({
            connectionInfo,
            count: count + 1,
            isConnected: true,
            role,
            socket: socketIo
          }),
        );
      });
      socketIo.on("progress", (data: Transfer) => {
	console.log(data)
        dispatch(updateTransferProgress(data));
      });
    }
  }, [isConnected, role]);

  return { socket };
};

export default useWebsocket;
