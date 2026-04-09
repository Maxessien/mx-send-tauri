import { createSlice } from "@reduxjs/toolkit";


export type FileResType = "audio" | "video" | "document" | "images"

interface FileRes {
    file_name: string,
    file_size: number,
    file_path: string,
}

interface AllFiles {
    audio: FileRes[],
    video: FileRes[],
    document: FileRes[],
    images: FileRes[],
}

const initialState: AllFiles = {
    audio: [],
    document: [],
    images: [],
    video: []
}

const allFiles = createSlice({
    name: "allFiles",
    initialState,
    reducers: {
        addOneFile: (state, {payload}: {payload: {type: FileResType, info: FileRes}})=>{
            state[payload.type].push(payload.info)
        },
        addManyFiles: (state, {payload}: {payload: {type: FileResType, info: FileRes[]}})=>{
            state[payload.type] = [...state[payload.type], ...payload.info]
        },
        replaceAllFiles: (state, {payload}: {payload: {type: FileResType, info: FileRes[]}})=>{
            state[payload.type] = payload.info
        },
    }
})


export default allFiles.reducer

export const {addManyFiles, addOneFile, replaceAllFiles} = allFiles.actions