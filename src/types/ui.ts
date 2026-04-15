import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

import { FileResType, Transfer } from "./files";
import { ActiveTab } from "./activeTab";

export interface NavItemProps {
  icon: ReactElement;
  title: string;
  active: ActiveTab;
}

export interface SocketMessage {
  type: "NewFile" | "Progress" | "NewConnection";
  payload: string | Transfer;
}

export interface TabListItemProps {
  fileName: string;
  fileSize: number;
  filePath: string;
  previewImgUrl: string;
  type: FileResType;
}

export interface ButtonType {
  size?: "small" | "medium" | "large";
  usePredefinedSize?: boolean;
  color?: "primary" | "secondary" | "tertiary";
  usePredefinedcolor?: boolean;
  className?: string;
  width?: string;
  rounded?: string;
  attrs?: ButtonHTMLAttributes<HTMLButtonElement> &
    Omit<HTMLAttributes<HTMLButtonElement>, "className">;
  children?: ReactNode;
}

export interface LoadRollerProps {
  className?: string;
  containerClassName?: string;
  strokeWidth?: number;
  duration?: number;
}