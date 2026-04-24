import { FileRes, FileResType, List, Transfer } from "../types";

export const FILE_PREVIEW_IMAGES: Record<FileResType, string> = {
  audio: "/audio-icon.jpg",
  video: "/icons8-video-100.png",
  document: "/document-icon.png",
  image: "/icons8-image-100.png",
};

export const determineFilesEqual = (file1: FileRes, file2: FileRes) => {
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

export const sortFileList = ({direction, list, sortBy}: List) => {
  const fieldPresent =
    sortBy === "name"
      ? checkFieldInList(list, "file_name")
      : checkFieldInList(list, "file_size");
  if (!fieldPresent) return list;

  const listCopy = [...list]

  const sorted = listCopy.sort((a, b) =>
    sortBy === "name"
      ? a.file_name.localeCompare(b.file_name)
      : a.file_size - b.file_size,
  );

  const final = direction === "asc" ? sorted : sorted.reverse()

  return final;
};
