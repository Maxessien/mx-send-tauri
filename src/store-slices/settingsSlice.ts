import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppSettings } from "../types";
import { defaultSettings } from "../utils/file-utils";


const initialState: AppSettings = defaultSettings;

const settingsSlice = createSlice({
    initialState,
    name: "settings",
    reducers: {
        setSettings: (_, {payload}: PayloadAction<AppSettings>)=>{
            return payload
        }    
    }
})

const settingsReducer = settingsSlice.reducer

export const {setSettings} = settingsSlice.actions

export default settingsReducer