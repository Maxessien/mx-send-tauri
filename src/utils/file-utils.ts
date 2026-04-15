import { FileRes, FileResType } from "../types";

export const FILE_PREVIEW_IMAGES: Record<FileResType, string> = {
  audio: "/audio-icon.jpg",
  video: "/icons8-video-100.png",
  document: "/document-icon.png",
  images: "/icons8-image-100.png",
};

export const determineFilesEqual = (file1: FileRes, file2: FileRes) => {
  return file1.file_name === file2.file_name && file1.file_path === file2.file_path;
};
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
    case "images":
      return "Image";
    case "video":
      return "Video";
    default:
      return null;
  }
};