import { createSlice } from "@reduxjs/toolkit";
import { AllFilesState, FileRes, FileResType, Transfer } from "../types";

const initialState: AllFilesState = {
  audio: [],
  document: [],
  image: [],
  video: [],
  transferring: [],
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
    modifyTransferring: (state, { payload }: { payload: Transfer[] }) => {
      state.transferring = payload;
    },
  },
});

export default allFiles.reducer;

export const {
  addManyFiles,
  addOneFile,
  replaceAllFiles,
  addSelected,
  removeSelected,
  modifyTransferring,
} = allFiles.actions;
