import { Socket } from "socket.io-client";
import {
  AppSettings,
  FileResRaw,
  FileResType,
  FileTransferred,
  List,
  MergedHistory,
  Transfer,
} from "../types";
import { getVersion } from "@tauri-apps/api/app";

export const FILE_PREVIEW_IMAGES: Record<FileResType, string> = {
  audio: "/audio-icon.png",
  video: "/icons8-video-100.png",
  document: "/document-icon.png",
  image: "/icons8-image-100.png",
};

export const determineFilesEqual = (file1: FileResRaw, file2: FileResRaw) => {
  return (
    file1.file_name === file2.file_name && file1.file_path === file2.file_path
  );
};

export const determineTransfersEqual = (
  transfer1: Omit<Transfer, "current" | "total">,
  transfer2: Omit<Transfer, "current" | "total">,
) =>
  determineFilesEqual(transfer1, transfer2) &&
  transfer1.sender_id === transfer2.sender_id;

export const formatFileSize = (size: number) => {
  if (size < Math.pow(1024, 2)) return `${(size / 1024).toFixed(0)} KB`;
  if (size >= Math.pow(1024, 2) && size < Math.pow(1024, 3)) {
    return `${(size / Math.pow(1024, 2)).toFixed(1)} MB`;
  }

  return `${(size / Math.pow(1024, 3)).toFixed(1)} GB`;
};

export const getRustFileType = (type: FileResType) => {
  switch (type) {
    case "audio":
      return "Audio";
    case "document":
      return "Document";
    case "image":
      return "Image";
    case "video":
      return "Video";
    default:
      return null;
  }
};

export const capitalise = (word: string) => {
  const first = word.slice(0, 1);
  const rest = word.slice(1);

  return first.toUpperCase() + rest;
};

const checkFieldInList = (list: { [key: string]: any }[], field: string) => {
  return list.every((item) => item?.[field]);
};

export const sortFileList = ({ direction, list, sortBy }: List) => {
  const fieldPresent =
    sortBy === "name" || sortBy === "createdAt"
      ? sortBy === "name"
        ? checkFieldInList(list, "file_name")
        : checkFieldInList(list, "last_modified")
      : checkFieldInList(list, "file_size");
  if (!fieldPresent) return list;

  const listCopy = [...list];

  const sorted = listCopy.sort((a, b) =>
    sortBy === "name" || sortBy === "createdAt"
      ? sortBy === "name"
        ? a.file_name.localeCompare(b.file_name)
        : b.last_modified.secs_since_epoch - a.last_modified.secs_since_epoch
      : a.file_size - b.file_size,
  );

  const final = direction === "asc" ? sorted : sorted.reverse();

  return final;
};

export const sortTransferred = (infos: FileTransferred[]) => {
  const sorted: { [key: string]: MergedHistory } = {};
  infos.forEach((info) => {
    const dateString = new Date(info.date).toLocaleDateString();
    if (sorted[dateString]) {
      sorted[dateString].files.push(info);
    } else {
      sorted[dateString] = { date: dateString, files: [info] };
    }
  });
  return sorted;
};

export const emitCancelEvent = (f: Transfer, socket: Socket | null) => {
  const {
    current,
    file_name,
    file_path,
    file_size,
    type,
    sender_id,
    last_modified,
  } = f;
  socket?.emit("progress", {
    current,
    file_name,
    file_path,
    file_size,
    file_type: type,
    total: file_size,
    sender_id,
    is_cancelled: true,
    is_transferring: false,
    last_modified,
    type,
  } as Transfer);
};

export const defaultSettings: AppSettings = {
  cacheTraversalResult: true,
  keepScreenAwake: true,
  organizeFilesByType: true,
  saveTransferHistory: true,
  theme: "dark",
  extraTraversalPaths: [],
  firstTimeUse: true,
  showUpdatePopup: { version: "0.0.1", show: false, timeChecked: Date.now() },
};

export const checkFieldsInObj = <T extends object>(
  obj: T | null,
  fields: (keyof T)[],
) => {
  if (!obj) return false;

  for (const field of fields) {
    const value = obj[field];
    if (value === null || value === undefined) return false;
  }

  return true;
};

export const hasUpdate = async ({version, show}: {version: string, show: boolean}, updateSettings: (latest: string, show: boolean)=> void) => {
  try {
    const appVersion = await getVersion();
    
    const GITHUB_RELEASE_API =
    "https://api.github.com/repos/Maxessien/mx-send-tauri/releases/latest";
    
    const res = await (
      await fetch(GITHUB_RELEASE_API, { method: "GET", signal: AbortSignal.timeout(10000) })
    ).json();

    const latestVersion = (res.tag_name as string).slice(1);
    const updateFound = appVersion !== latestVersion && ((version === latestVersion && show) || version !== latestVersion)

    updateSettings(latestVersion, updateFound)

    return updateFound;
  } catch (error) {
    console.log(error);

    return false;
  }
};
