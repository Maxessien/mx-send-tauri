import { UndefinedInitialDataOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { addManyFiles } from "../store-slices/allFilesSlice";
import { DirList, FileRes, FileResType } from "../types";
import { getRustFileType } from "../utils/file-utils";

const useGetFiles = (
  fileType: FileResType,
  queryOptions?: UndefinedInitialDataOptions<
    FileRes[],
    Error,
    FileRes[],
    FileResType[]
  >,
) => {
  const dispatch = useDispatch();
  const files = useSelector(
    (state: RootState) => state.allFiles,
  );
  const { extraTraversalPaths } = useSelector(
    (state: RootState) => state.settings,
  );

  const getFiles = async (type: FileResType) => {
    const rustEnum = getRustFileType(type);
    if (!rustEnum) throw new Error(`Unknown file type: ${type}`);
    try {
      const files = await invoke<FileRes[]>("list_files", {
        fileType: rustEnum,
        extraPaths: extraTraversalPaths,
      });
      const filesWithTypes = files.map((file) => ({ ...file, type }));
      dispatch(addManyFiles({ type, info: filesWithTypes }));
      return filesWithTypes;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const query = useQuery({
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    initialData: files[fileType].length > 0 ? files[fileType] : undefined,
    enabled: files[fileType].length <= 0,
    ...queryOptions,
    queryKey: [fileType],
    queryFn: ({ queryKey }) => {
      return getFiles(queryKey?.[0]);
    },
  });

  return { query };
};

const useReceiver = () => {
  const { role, isConnected, connectionInfo } = useSelector(
    (state: RootState) => state.connection,
  );
  const downloadVideo = async (fileId: string, senderId: string) => {
    if (!isConnected || role !== "receiver") return;
    try {
      await invoke("download_file_from_sender", {
        url: `http://${connectionInfo.ip_address}:${connectionInfo.port}/download?id=${fileId}`,
        sessionId: connectionInfo.session_id,
        senderId,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return { downloadVideo };
};

const useGetDirList = (dirPath: string, queryOptions?: UndefinedInitialDataOptions<DirList, Error, DirList, string[]>) => {
  const [list, setList] = useState<DirList>({ files: [], folders: [] });

  const getDirList = async () => {
    try {
      const dirList = await invoke<DirList>("list_dir", {
        dir: dirPath && dirPath.trim().length > 0 ? dirPath : undefined,
        includeFiles: true,
      });
      return dirList;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const query = useQuery({
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60,
    ...queryOptions,
    queryKey: [dirPath, "get_dir_list"],
    queryFn: getDirList
  });

  useEffect(()=>{
    setList(query.data || {files: [], folders: []})
  }, [query.data, query.dataUpdatedAt, query.errorUpdateCount])

  return {...query, dirList: list}
};

export { useGetDirList, useGetFiles, useReceiver };

