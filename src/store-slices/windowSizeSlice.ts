import { createSlice } from "@reduxjs/toolkit";


interface WindowSize {height: number, width: number}

const initialState: WindowSize = {height: 768, width: 768}

const windowSize = createSlice({
    initialState, 
    name: "WindowSlice", 
    reducers: {
        setWindow: (state, {payload}: {payload: WindowSize})=>{
            state.height = payload.height;
            state.width = payload.width;
        }
    }
})

const windowSizeReducer = windowSize.reducer

export const {setWindow} = windowSize.actions

export default windowSizeReducer