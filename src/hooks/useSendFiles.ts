import { invoke } from "@tauri-apps/api/core";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { FileRes, FileResType } from "../types";
import { capitalise } from "../utils/file-utils";

const useSendFiles = () => {
  const { isConnected, role, connectionInfo, socket } = useSelector(
    (state: RootState) => state.connection,
  );
  const appSession = useSelector((state: RootState) => state.appSession);

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return false;
    try {
      const path =
        role === "receiver"
          ? `receiver/upload?name=${encodeURIComponent(file.file_name)}&file_type=${capitalise(type)}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "receiver") {
        await invoke("send_file", {
          filePath: file.file_path,
          url,
          sessionId: connectionInfo.session_id,
          fileInfo: JSON.stringify(file),
        });
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
          socket?.emit("newFile", {file_id: id, sender_id: appSession});
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
