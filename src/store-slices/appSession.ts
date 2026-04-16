import { createSlice } from "@reduxjs/toolkit";


const initialState: string = ""

const appSession = createSlice({
    name: "appSession",
    initialState,
    reducers: {}
})

const appSessionReducer = appSession.reducer

export default appSessionReducer