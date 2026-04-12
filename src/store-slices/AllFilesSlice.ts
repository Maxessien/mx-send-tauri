import { createSlice } from "@reduxjs/toolkit";

export type FileResType = "audio" | "video" | "document" | "images";

export interface FileRes {
  file_name: string;
  file_size: number;
  file_path: string;
}

interface AllFiles {
  audio: FileRes[];
  video: FileRes[];
  document: FileRes[];
  images: FileRes[];
  selected: FileRes[];
}

const initialState: AllFiles = {
  audio: [],
  document: [],
  images: [],
  video: [],
  selected: [],
};

const allFiles = createSlice({
  name: "allFiles",
  initialState,
  reducers: {
    addOneFile: (
      state,
      { payload }: { payload: { type: FileResType; info: FileRes } },
    ) => {
      state[payload.type].push(payload.info);
    },
    addManyFiles: (
      state,
      { payload }: { payload: { type: FileResType; info: FileRes[] } },
    ) => {
      state[payload.type] = [...state[payload.type], ...payload.info];
    },
    replaceAllFiles: (
      state,
      { payload }: { payload: { type: FileResType; info: FileRes[] } },
    ) => {
      state[payload.type] = payload.info;
    },
    addSelected: (state, { payload }: { payload: FileRes }) => {
      state.selected.push(payload);
    },
    removeSelected: (state, { payload }: { payload: FileRes }) => {
      state.selected = state.selected.filter(
        ({ file_name, file_path }) =>
          file_name !== payload.file_name && file_path !== payload.file_path,
      );
    },
  },
});

export default allFiles.reducer;

export const { addManyFiles, addOneFile, replaceAllFiles, addSelected, removeSelected } = allFiles.actions;
