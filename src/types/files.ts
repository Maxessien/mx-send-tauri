export type FileResType = "audio" | "video" | "document" | "image";

export interface FileRes {
  file_name: string;
  file_size: number;
  file_path: string;
  type: FileResType;
}

export interface DownloadProgress extends Omit<FileRes, "type"> {
  file_type: FileResType;
  current: number;
  total: number;
}

export interface UploadProgress {
  current: number;
  info: string;
}

export interface Transfer extends FileRes {
  current: number;
  total: number;
  sender_id: string;
}

export interface AllFilesState {
  audio: FileRes[];
  video: FileRes[];
  document: FileRes[];
  image: FileRes[];
  transferring: Transfer[];
  selected: FileRes[];
}
