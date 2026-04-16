import { configureStore } from "@reduxjs/toolkit";
import activeTabReducer from "./store-slices/activeTabs";
import allFilesReducer from "./store-slices/allFilesSlice";
import connectionReducer from "./store-slices/connectionSlice";
import appSessionReducer from "./store-slices/appSession";


const store = configureStore({
    reducer: {
        allFiles: allFilesReducer,
        activeTab: activeTabReducer,
        connection: connectionReducer,
        appSession: appSessionReducer
    }
})

export type RootState = ReturnType<typeof store.getState>

export default store;