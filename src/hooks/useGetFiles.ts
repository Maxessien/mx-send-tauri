import { UndefinedInitialDataOptions, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { addManyFiles } from "../store-slices/allFilesSlice";
import { DirList, FileRes, FileResType, Transfer } from "../types";
import { getRustFileType } from "../utils/file-utils";
import { downloadQueue } from "../utils/queue";

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
  const files = useSelector((state: RootState) => state.allFiles);
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
  const { role, isConnected, connectionInfo, socket } = useSelector(
    (state: RootState) => state.connection,
  );
  
  const appSession = useSelector((state: RootState) => state.appSession);

  const pushDownload = (fileId: string, senderId: string) => {
    downloadQueue.push({ fileId, senderId });
    if (!downloadQueue.isProcessing) {
      const { fileId, senderId } = downloadQueue.pop();
      downloadVideo(fileId, senderId);
    }
  };
  
    const cancelIncomingDownload = (fileId: string, senderId: string, file: FileRes) => {
      downloadQueue.removeEl({ fileId, senderId });
      const { file_name, file_path, file_size, type: file_type } = file;
      socket?.emit("progress", {
        current: 0,
        file_name,
        file_path,
        file_size,
        file_type,
        total: file_size,
        sender_id: appSession,
        is_cancelled: true,
      } as Transfer);
    };

  const downloadVideo = async (fileId: string, senderId: string) => {
    if (!isConnected || role !== "receiver") return;
    if (!downloadQueue.isProcessing) downloadQueue.isProcessing = true;
    try {
      await invoke("download_file_from_sender", {
        url: `http://${connectionInfo.ip_address}:${connectionInfo.port}/download?id=${fileId}`,
        sessionId: connectionInfo.session_id,
        senderId,
      });

      if (downloadQueue.traverse().length > 0) {
        const { fileId, senderId } = downloadQueue.pop();
        downloadVideo(fileId, senderId);
      } else downloadQueue.isProcessing = false;

    } catch (err) {
      console.log(err);
    }
  };

  return { downloadVideo, pushDownload, cancelIncomingDownload };
};

const useGetDirList = (
  dirPath: string,
  queryOptions?: UndefinedInitialDataOptions<DirList, Error, DirList, string[]>,
) => {
  const [list, setList] = useState<DirList>({ files: [], folders: [] });
  const [searchQuery, setSearchQuery] = useState("");

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
    queryFn: getDirList,
  });

  const setDefault = () => {
    setList(
      query.data
        ? {
            files: query.data?.files?.sort((a, b) =>
              a.file_name.localeCompare(b.file_name),
            ),
            folders: query.data?.folders?.sort((a, b) =>
              a.folder_name.localeCompare(b.folder_name),
            ),
          }
        : { files: [], folders: [] },
    );
  };

  useEffect(() => {
    setDefault();
  }, [query.data, query.dataUpdatedAt, query.errorUpdateCount]);

  useEffect(() => {
    setSearchQuery("");
  }, [dirPath]);

  useEffect(() => {
    if (!(searchQuery.trim().length > 0)) setDefault();
    else
      setList((list) => ({
        files: list.files.filter(({ file_name }) =>
          file_name
            .toLocaleLowerCase()
            .includes(searchQuery.toLocaleLowerCase()),
        ),
        folders: list.folders?.filter(({ folder_name }) =>
          folder_name
            .toLocaleLowerCase()
            .includes(searchQuery.toLocaleLowerCase()),
        ),
      }));
  }, [searchQuery]);

  return { ...query, dirList: list, setSearchQuery, searchQuery };
};

export { useGetDirList, useGetFiles, useReceiver };
