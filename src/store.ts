import { configureStore } from "@reduxjs/toolkit";
import activeTabReducer from "./store-slices/activeTabs";
import allFilesReducer from "./store-slices/allFilesSlice";
import connectionReducer from "./store-slices/connectionSlice";
import appSessionReducer from "./store-slices/appSession";
import windowSizeReducer from "./store-slices/windowSizeSlice";
import settingsReducer from "./store-slices/settingsSlice";


const store = configureStore({
    reducer: {
        allFiles: allFilesReducer,
        activeTab: activeTabReducer,
        connection: connectionReducer,
        appSession: appSessionReducer,
        windowSize: windowSizeReducer,
        settings: settingsReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>

export default store;