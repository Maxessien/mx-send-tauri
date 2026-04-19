import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

import { FileResType } from "./files";


export interface NavItemProps {
  icon: ReactElement;
  title: string;
  active: boolean;
  location: string
}

export interface TabListItemProps {
  fileName: string;
  fileSize: number;
  filePath: string;
  previewImgUrl?: string;
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