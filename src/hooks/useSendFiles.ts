import { invoke } from "@tauri-apps/api/core";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { FileRes, FileResType } from "../types";

const useSendFiles = () => {
  const { isConnected, role, connectionInfo } = useSelector(
    (state: RootState) => state.connection,
  );

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return
    try {
      const path =
        role === "reciever"
          ? `reciever/upload?name=${file.file_name}&file_type=${type}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "reciever") {
        const fileBytes = await invoke<ArrayBuffer>("get_file", {
          filePath: file.file_path,
        });
        await fetch(url, {
          method: "POST",
          headers: { Authorisation: `Bearer ${connectionInfo.session_id}` },
          body: fileBytes,
        });
      } else {
        await fetch(url, {
          method: "POST",
          headers: { Authorisation: `Bearer ${connectionInfo.session_id}` },
          body: JSON.stringify({ path: file.file_path }),
        });
      }
    } catch (err) {
        console.log(err)
    }
  };

  return {sendFile}
};


export default useSendFiles