import { createSlice } from "@reduxjs/toolkit";
import { FileResType } from "./allFilesSlice";


const initialState: {
    activeTab: FileResType
} = {activeTab: "audio"}

const activeTab = createSlice({
    name: "activeTab",
    initialState,
    reducers: {
        changeTab: (state, {payload}: {payload: FileResType})=>{
            state.activeTab = payload
        }
    }
})

const activeTabReducer = activeTab.reducer

export default activeTabReducer

export const {changeTab} = activeTab.actions