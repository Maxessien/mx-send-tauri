export type FileResType = "audio" | "video" | "document" | "image";

export interface FileRes {
  file_name: string;
  file_size: number;
  file_path: string;
  type: FileResType;
}

export interface Transfer extends FileRes {
  current: number;
  total: number;
}

export interface AllFilesState {
  audio: FileRes[];
  video: FileRes[];
  document: FileRes[];
  images: FileRes[];
  transferring: Transfer[];
  selected: FileRes[];
}