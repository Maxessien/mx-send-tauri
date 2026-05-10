import { FileRes } from "./files"

export type AppTheme = "dark" | "light" | "system"

export interface AppSettings {
    theme: AppTheme,
    cacheTraversalResult: boolean,
    organizeFilesByType: boolean,
    saveTransferHistory: boolean,
    keepScreenAwake: boolean,
    extraTraversalPaths: string[]
}

export interface FileTransferred extends FileRes {
    date: string,
    isReceived: boolean
}