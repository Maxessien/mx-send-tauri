import { createSlice } from "@reduxjs/toolkit";
import { ConnectionState } from "../types";

const initialState: ConnectionState = {
  isConnected: false,
  role: "reciever",
  count: 0,
  connectionInfo: { ip_address: "", port: "", session_id: "" },
};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnection: (_state, { payload }: { payload: ConnectionState }) => {
      return payload;
    },
  },
});

const connectionReducer = connectionSlice.reducer;

export default connectionReducer;

export const { setConnection } = connectionSlice.actions;
