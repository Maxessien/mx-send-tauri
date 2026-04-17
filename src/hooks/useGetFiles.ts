import { UndefinedInitialDataOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  addManyFiles,
  updateTransferProgress,
} from "../store-slices/allFilesSlice";
import { ActiveTab, FileRes, FileResType } from "../types";
import { getRustFileType } from "../utils/file-utils";
import useWebsocket from "./useWebsocket";

const useGetFiles = (fileType: FileResType, queryOptions?: UndefinedInitialDataOptions<FileRes[], Error, FileRes[], ActiveTab[]>) => {
  const dispatch = useDispatch();
  const { transferring } = useSelector((state: RootState) => ({
    ...state.allFiles
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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60 * 6,
    ...queryOptions,
    queryKey: [fileType],
    queryFn: ({ queryKey }) => {
      if (queryKey?.[0] === "transfers") return transferring;
      else return getFiles(queryKey?.[0]);
    },
  });

  return { query };
};

const useReceiver = () => {
  const { role, isConnected, connectionInfo, appSession } = useSelector(
    (state: RootState) => ({ ...state.connection, ...state.allFiles, appSession: state.appSession }),
  );
  const dispatch = useDispatch();
  const { socket } = useWebsocket();

  const constructFileInfo = (xml: XMLHttpRequest)=>({
        file_name: xml.getResponseHeader("file_name") || "",
        file_path: xml.getResponseHeader("file_path") || "",
        file_size: Number(xml.getResponseHeader("file_size")) || 0,
        type: (xml.getResponseHeader("file_type") as FileResType) || "",
      })

  const downloadVideo = (fileId: string) => {
    if (!isConnected || role !== "receiver") return;
    try {
      const xml = new XMLHttpRequest();
      xml.open(
        "GET",
        `http://${connectionInfo.ip_address}:${connectionInfo.port}/download?id=${fileId}`,
      );
      xml.setRequestHeader(
        "Authorization",
        `Bearer ${connectionInfo.session_id}`,
      );
      xml.onprogress = (e) => {
        const fileInfo = constructFileInfo(xml)
        if (e.lengthComputable) {
          if (socket.current && fileInfo)
            socket.current.emit("progress", { ...fileInfo, total: e.total, current: e.loaded, sender_id: appSession })
            dispatch(updateTransferProgress({ ...fileInfo, total: e.total, current: e.loaded, sender_id: appSession }))
        }
      };
      xml.onload = async () => {
        const fileInfo = constructFileInfo(xml)
        dispatch(updateTransferProgress({...fileInfo, sender_id: appSession, current: 0, total: 0}));
        const bytes = xml.status === 200 ? xml.response : null;
        await invoke("save_file", {
          fileName: fileInfo.file_name,
          fileType: fileInfo.type,
          bytes,
        });
      };
      xml.onerror = () => {
        console.error("Download failed for file:", fileId);
      };
      xml.responseType = "arraybuffer"
      xml.send();
    } catch (err) {
      console.log(err);
    }
  };

  return { downloadVideo };
};

export { useGetFiles, useReceiver };
