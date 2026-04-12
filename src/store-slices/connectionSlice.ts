import { createSlice } from "@reduxjs/toolkit";

interface ConnectionState {
    isConnected: boolean,
    role: "sender" | "reciever"
    count: number 
}

const initialState: ConnectionState = {isConnected: false, role: "reciever", count: 0}

const connectionSlice = createSlice({
    name: "connection",
    initialState,
    reducers: {
        setConnection: (state, {payload}: {payload: ConnectionState})=>{
            state = payload
        }
    }
})

const connectionReducer = connectionSlice.reducer

export default connectionReducer

export const {setConnection} = connectionSlice.actions