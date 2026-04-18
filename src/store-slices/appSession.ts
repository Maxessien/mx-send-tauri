import { createSlice } from "@reduxjs/toolkit";
import { v4 } from "uuid"


const initialState: string = v4()

const appSession = createSlice({
    name: "appSession",
    initialState,
    reducers: {}
})

const appSessionReducer = appSession.reducer

export default appSessionReducer