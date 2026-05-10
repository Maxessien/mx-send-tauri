import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AllFilesState,
  FileRes,
  FileResType,
  FileTransfered,
  Transfer,
} from "../types";
import { determineTransfersEqual } from "../utils/file-utils";

const initialState: AllFilesState = {
  audio: [],
  document: [],
  image: [],
  video: [],
  transferring: [],
  selected: [],
  transferred: [],
};

const allFiles = createSlice({
  name: "allFiles",
  initialState,
  reducers: {
    addOneFile: (
      state,
      { payload }: PayloadAction<{ type: FileResType; info: FileRes }>,
    ) => {
      state[payload.type].push(payload.info);
    },
    addManyFiles: (
      state,
      { payload }: PayloadAction<{ type: FileResType; info: FileRes[] }>,
    ) => {
      state[payload.type] = [...state[payload.type], ...payload.info];
    },
    replaceAllFiles: (
      state,
      { payload }: PayloadAction<{ type: FileResType; info: FileRes[] }>,
    ) => {
      state[payload.type] = payload.info;
    },
    addSelected: (state, { payload }: PayloadAction<FileRes>) => {
      state.selected.push(payload);
    },
    removeSelected: (state, { payload }: PayloadAction<FileRes>) => {
      state.selected = state.selected.filter(
        ({ file_name, file_path }) =>
          file_name !== payload.file_name && file_path !== payload.file_path,
      );
    },
    updateTransferProgress: (state, { payload }: PayloadAction<Transfer>) => {
      const newTransfer = payload;
      const existing = state.transferring.find((f) =>
        determineTransfersEqual(f, newTransfer),
      );

      if (existing) {
        existing.current = newTransfer.current;
      } else {
        state.transferring = [...state.transferring, newTransfer];
      }
    },
    addTransferred: (
      state,
      {
        payload: { files, mode },
      }: PayloadAction<{
        files: FileTransfered[];
        mode?: "replace" | "append";
      }>,
    ) => {
      const m = mode || "append";
      state.transferred =
        m === "replace" ? files : [...state.transferred, ...files];
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
  updateTransferProgress,
  addTransferred
} = allFiles.actions;
