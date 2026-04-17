import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { FileRes, FileResType } from "../types";
import { capitalise } from "../utils/file-utils";
import useWebsocket from "./useWebsocket";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { listen } from "@tauri-apps/api/event"

const useSendFiles = () => {
  const { isConnected, role, connectionInfo, appSession } = useSelector(
    (state: RootState) => ({
      ...state.connection,
      ...state.allFiles,
      appSession: state.appSession,
    }),
  );
  const { socket } = useWebsocket();
  const dispatch = useDispatch()

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return false;
    try {
      const path =
        role === "receiver"
          ? `receiver/upload?name=${encodeURIComponent(file.file_name)}&file_type=${capitalise(type)}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "receiver") {
        const unlisten = await listen<{total: number, current: number}>("progress", ({payload: {current}})=>{
          socket.current?.emit("progress", {current, total: file.file_size, sender_id: appSession, ...file})
          dispatch(updateTransferProgress({current, total: file.file_size, sender_id: appSession, ...file}))
        })
        await invoke("send_file", {
          filePath: file.file_path, url, session_id: connectionInfo.session_id
        });
        unlisten()
        dispatch(updateTransferProgress({ ...file, sender_id: appSession, current: file.file_size, total: file.file_size }));
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${connectionInfo.session_id}` },
          body: JSON.stringify({ path: file.file_path, file_type:capitalise(type) }),
        });
        if (res.ok) {
          const id: string = await res.json();
          socket.current?.emit("newFile", id);
        }
        if (!res.ok)
          throw new Error(
            `Fetch failed: status-${res.status}, error-${res.statusText}`,
          );
      }
    } catch (err) {
      console.log(err);
    }
  };

  return { sendFile };
};

export default useSendFiles;
