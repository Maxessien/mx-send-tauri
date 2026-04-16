import { FileResType } from "./files";

export type ActiveTab = FileResType | "transfers"

export interface ActiveTabState {
    activeTab: ActiveTab;
}