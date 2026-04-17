import { UndefinedInitialDataOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  addManyFiles
} from "../store-slices/allFilesSlice";
import { ActiveTab, FileRes, FileResType } from "../types";
import { getRustFileType } from "../utils/file-utils";

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
  const { role, isConnected, connectionInfo } = useSelector(
    (state: RootState) => ({ ...state.connection, ...state.allFiles, appSession: state.appSession }),
  );
  const downloadVideo = async (fileId: string) => {
    if (!isConnected || role !== "receiver") return;
    try {
      await invoke("download_file_from_sender", {
        url: `http://${connectionInfo.ip_address}:${connectionInfo.port}/download?id=${fileId}`,
        sessionId: connectionInfo.session_id,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return { downloadVideo };
};

export { useGetFiles, useReceiver };

