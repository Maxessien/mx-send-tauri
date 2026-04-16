import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { FileRes, FileResType } from "../types";
import { capitalise, determineTransfersEqual } from "../utils/file-utils";
import useWebsocket from "./useWebsocket";
import { modifyTransferring } from "../store-slices/allFilesSlice";

const useSendFiles = () => {
  const { isConnected, role, connectionInfo, transferring, appSession } = useSelector(
    (state: RootState) => ({ ...state.connection, ...state.allFiles, appSession: state.appSession }),
  );
  const dispatch = useDispatch();
  const { socket } = useWebsocket();

  const sendFile = async (file: FileRes, type: FileResType) => {
    if (!isConnected) return false;
    try {
      const path =
        role === "receiver"
          ? `receiver/upload?name=${encodeURIComponent(file.file_name)}&file_type=${capitalise(type)}&size=${file.file_size}`
          : "upload";
      const url = `http://${connectionInfo.ip_address}:${connectionInfo.port}/${path}`;
      if (role === "receiver") {
        const fileBytes = await invoke<ArrayBuffer>("get_file", {
          filePath: file.file_path,
        });
        const xml = new XMLHttpRequest();
        xml.open("POST", url);
        xml.setRequestHeader(
          "Authorization",
          `Bearer ${connectionInfo.session_id}`,
        );
        xml.onprogress = (e) => {
          if (e.lengthComputable) {
            if (socket.current)
              socket.current.send(
                JSON.stringify({
                  type: "Progress",
                  payload: { ...file, total: e.total, current: e.loaded },
                }),
              );
          }
        };
        xml.onload = async () => {
          const updated = transferring.filter(
            (file1) => !determineTransfersEqual({...file, sender_id: appSession}, file1),
          );
          dispatch(modifyTransferring(updated));
          const bytes = xml.status === 200 ? xml.response : null;
          await invoke("save_file", {
            fileName: file.file_name,
            fileType: file.type,
            bytes,
          });
        };
        xml.send(fileBytes);
        xml.onerror = () => {
          throw new Error("Download failed for file: " + file.file_name);
        };
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${connectionInfo.session_id}` },
          body: JSON.stringify({ path: file.file_path }),
        });
        if (res.ok) {
          const id: string = await res.json();
          socket.current?.send(
            JSON.stringify({ type: "Newfile", payload: id }),
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
