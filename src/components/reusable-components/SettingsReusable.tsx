import { motion } from 'framer-motion';
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import Button from "./Button";

export const Card = ({
  children,
  extraClassNames,
  attrs
}: {
  children: ReactNode;
  extraClassNames?: string;
  attrs?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
}) => {
  const baseClsn =
    "w-full px-3 py-2 rounded-md bg-(--main-tertiary) border-(--text-primary-light) border-2";
  const clsn = extraClassNames ? baseClsn + " " + extraClassNames : baseClsn;
  return <div {...attrs} className={clsn}>{children}</div>;
};

export const ToggleItem = ({
  editVal,
  subTitle,
  title,
  value,
}: {
  title: string;
  subTitle: string;
  value: boolean;
  editVal: () => void;
}) => {
  return (
    <Card extraClassNames="flex items-center">
      <div className="flex-1">
        <p className="text-base md:text-lg font-medium">{title}</p>
        <p className="text-sm text-(--text-secondary) md:text-base font-medium">
          {subTitle}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={editVal}
        style={{
          background: value
            ? "var(--main-primary)"
            : "var(--text-secondary-light)",
        }}
        className="w-9 h-6 rounded-full relative transition-colors"
      >
        <span
          style={{ 
            transform: value ? "translateX(12px)" : "translateX(0px)"
          }}
          className="h-full aspect-square rounded-full bg-(--text-primary) absolute top-0 left-0 transition-transform"
        ></span>
      </button>    </Card>
  );
};

export const WarningPopup = ({
  acceptFn,
  closeFn,
  warnMessage,
}: {
  warnMessage: string;
  acceptFn: () => void;
  closeFn: () => void;
}) => {
  return (
    <div className="fixed z-99999 top-0 flex justify-center items-center left-0 w-full h-full bg-[rgba(0,0,0,0.37)]">
      <motion.div animate={{scale: [0.5, 1.02, 1]}} transition={{duration: 0.4, ease: "easeOut"}} className="px-3 rounded-md border-2 border-(--text-primary-light) bg-(--main-secondary-light) py-2">
        <p className="w-full text-lg font-medium mb-4">{warnMessage}</p>
        <div className="flex w-full justify-between gap-2 items-center">
          <Button
            attrs={{onClick: ()=>{
		acceptFn()
		closeFn()
	}}}
            usePredefinedcolor={false}
	size="small"
            rounded="rounded-md"
            className="bg-green-700 text-white hover:bg-green-800"
          >
            Ok
          </Button>
          <Button
            attrs={{onClick: closeFn}}
            usePredefinedcolor={false}
            rounded="rounded-md"
	size="small"
            className="bg-red-700 text-white hover:bg-red-800"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
