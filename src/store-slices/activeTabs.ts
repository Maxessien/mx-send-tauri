import { createSlice } from "@reduxjs/toolkit";
import { ActiveTabState, FileResType } from "../types";


const initialState: ActiveTabState = { activeTab: "audio" };

const activeTab = createSlice({
    name: "activeTab",
    initialState,
    reducers: {
        changeTab: (state, { payload }: { payload: FileResType }) => {
            state.activeTab = payload;
        },
    },
});

const activeTabReducer = activeTab.reducer;

export default activeTabReducer;

export const { changeTab } = activeTab.actions;