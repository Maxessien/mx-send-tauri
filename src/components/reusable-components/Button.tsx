import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

const interfaces = {
  primary:
    "bg-(var(--main-primary)) text-(var(--text-secondary-light)) hover:bg-(var(--main-primary-light))",
  secondary:
    "text-(var(--main-primary)) shadow-[0px_0.4px_10px_-7px_black] bg-(var(--main-primary-light)) hover:bg-red-200",
  tertiary:
    "bg-transparent text-(var(--main-primary)) border-[2px] border-(var(--main-primary))",
};

const sizes = {
  small: "px-3 py-1.5 text-sm",
  medium: "px-4 py-2 text-base",
  large: "px-6 py-3 text-lg",
};

interface ButtonType {
  size?: "small" | "medium" | "large";
  usePredefinedSize?: boolean;
  color?: "primary" | "secondary" | "tertiary";
  usePredefinedcolor?: boolean;
  className?: string;
  width?: string;
  rounded?: string;
  attrs?: Omit<HTMLAttributes<HTMLButtonElement>, "className"> & ButtonHTMLAttributes<HTMLButtonElement>;
  children?: ReactNode;
}

const defaults =
  "cursor-pointer disabled:opacity-65 transition-all duration-[200ms] inline-flex justify-center items-center font-semibold gap-2";

const Button = ({
  size = "medium",
  usePredefinedcolor = true,
  usePredefinedSize = true,
  color = "primary",
  children = <>Button</>,
  className = "",
  rounded = "rounded-full",
  width = "w-max",
  attrs,
}: ButtonType) => {
  const completeClassNames = `${usePredefinedSize ? sizes[size] : ""} ${usePredefinedcolor ? interfaces[color] : ""} ${rounded} ${width} ${defaults} ${className}`;
  return (
    <button type="button" {...attrs} className={completeClassNames.trimStart().trimEnd()}>
      {children}
    </button>
  );
};

export default Button