import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { updateTransferProgress } from "../store-slices/allFilesSlice";
import { FileRes, FileResType } from "../types";
import { capitalise } from "../utils/file-utils";

const useSendFiles = () => {
  const { isConnected, role, connectionInfo, socket } = useSelector(
    (state: RootState) => state.connection,
  );
  const appSession = useSelector((state: RootState) => state.appSession);
  const dispatch = useDispatch();

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return false;
    try {
      const path =
        role === "receiver"
          ? `receiver/upload?name=${encodeURIComponent(file.file_name)}&file_type=${capitalise(type)}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "receiver") {
        dispatch(
          updateTransferProgress({
            ...file,
            sender_id: appSession,
            current: 0,
            total: file.file_size,
          }),
        );
        await invoke("send_file", {
          filePath: file.file_path,
          url,
          sessionId: connectionInfo.session_id,
          fileInfo: JSON.stringify(file)
        });
        dispatch(
          updateTransferProgress({
            ...file,
            sender_id: appSession,
            current: file.file_size,
            total: file.file_size,
          }),
        );
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${connectionInfo.session_id}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: file.file_path,
            file_type: capitalise(type),
          }),
        });
        if (res.ok) {
          const id: string = await res.text();
          socket?.emit("newFile", id);
        dispatch(
          updateTransferProgress({
            ...file,
            sender_id: appSession,
            current: 0,
            total: file.file_size,
          }),
        );
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
