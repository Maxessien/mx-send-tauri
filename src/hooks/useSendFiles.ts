import { invoke } from "@tauri-apps/api/core";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { FileRes, FileResType } from "../types";

const useSendFiles = () => {
  const { isConnected, role, connectionInfo } = useSelector(
    (state: RootState) => state.connection,
  );

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return false;
    try {
      const path =
        role === "receiver"
          ? `receiver/upload?name=${encodeURIComponent(file.file_name)}&file_type=${type}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "receiver") {
        const fileBytes = await invoke<ArrayBuffer>("get_file", {
          filePath: file.file_path,
        });
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorisation: `Bearer ${connectionInfo.session_id}` },
          body: fileBytes,
        });
        if (!res.ok)
          throw new Error(
            `Fetch failed: status-${res.status}, error-${res.statusText}`,
          );
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorisation: `Bearer ${connectionInfo.session_id}` },
          body: JSON.stringify({ path: file.file_path }),
        });
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
