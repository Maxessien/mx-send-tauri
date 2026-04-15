import { FileResType } from "./files";

export type ActiveTab = FileResType | "transferring"

export interface ActiveTabState {
    activeTab: ActiveTab;
}