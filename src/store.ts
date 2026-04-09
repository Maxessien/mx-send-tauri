import { configureStore } from "@reduxjs/toolkit"
import allFilesReducer from "./store-slices/AllFilesSlice"


const store = configureStore({
    reducer: {
        allFiles: allFilesReducer
    }
})

export type RootState = ReturnType<typeof store.getState>

export default store;