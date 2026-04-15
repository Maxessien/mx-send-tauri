import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  addManyFiles,
  modifyTransferring,
} from "../store-slices/allFilesSlice";
import { FileRes, FileResType } from "../types";
import { determineFilesEqual, getRustFileType } from "../utils/file-utils";
import useWebsocket from "./useWebsocket";

const useGetFiles = () => {
  const dispatch = useDispatch();
  const { activeTab, transferring } = useSelector((state: RootState) => ({
    ...state.activeTab,
    ...state.allFiles,
  }));

  const getFiles = async (type: FileResType) => {
    const rustEnum = getRustFileType(type);
    if (!rustEnum) throw new Error(`Unknown file type: ${type}`);
    try {
      const files = await invoke<FileRes[]>("list_files", {
        fileType: rustEnum,
      });
      dispatch(
        addManyFiles({ type, info: files.map((file) => ({ ...file, type })) }),
      );
      return files;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const query = useQuery({
    queryKey: [activeTab],
    queryFn: ({ queryKey }) => {
      if (queryKey?.[0] === "transferring") return transferring;
      else return getFiles(queryKey?.[0]);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60 * 6,
  });

  return { getFiles, query };
};

const useReceiver = () => {
  const { role, isConnected, connectionInfo, transferring } = useSelector(
    (state: RootState) => ({ ...state.connection, ...state.allFiles }),
  );
  const dispatch = useDispatch();
  const { setConnect, socket } = useWebsocket(false);

  const downloadVideo = (fileId: string) => {
    if (!isConnected || role !== "receiver") return;
    try {
      setConnect(true);
      const xml = new XMLHttpRequest();
      xml.open(
        "GET",
        `http://${connectionInfo.ip_address}:${connectionInfo.port}/download?id=${fileId}`,
      );
      xml.setRequestHeader(
        "Authorization",
        `Bearer ${connectionInfo.session_id}`,
      );
      const res = xml.getResponseHeader;
      const fileInfo = {
        file_name: res("file_name") || "",
        file_path: res("file_path") || "",
        file_size: Number(res("file_size")) || 0,
        type: (res("file_type") as FileResType) || "",
      };
      xml.onprogress = (e) => {
        if (e.lengthComputable) {
          if (socket.current)
            socket.current.send(
              JSON.stringify({
                type: "Progress",
                payload: { ...fileInfo, total: e.total, current: e.loaded },
              }),
            );
        }
      };
      xml.onload = async () => {
        const updated = transferring.filter(
          (file) => !determineFilesEqual(file, fileInfo),
        );
        dispatch(modifyTransferring(updated));
        const bytes = xml.status === 200 ? xml.response : null;
        await invoke("save_file", {
          fileName: fileInfo.file_name,
          fileType: fileInfo.type,
          bytes,
        });
      };
      xml.onerror = () => {
        console.error("Download failed for file:", fileInfo.file_name);
      };
      xml.send();
    } catch (err) {
      console.log(err);
    }
  };

  return { downloadVideo };
};

export { useGetFiles, useReceiver };
