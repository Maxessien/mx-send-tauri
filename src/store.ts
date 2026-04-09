import { configureStore } from "@reduxjs/toolkit";
import activeTabReducer from "./store-slices/activeTabs";
import allFilesReducer from "./store-slices/allFilesSlice";


const store = configureStore({
    reducer: {
        allFiles: allFilesReducer,
        activeTab: activeTabReducer
    }
})

export type RootState = ReturnType<typeof store.getState>

export default store;