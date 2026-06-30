import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { InView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { useSelectFile } from "../../hooks/useSelectFile";
import { RootState } from "../../store";
import { FileRes } from "../../types";

const ImageGridItem = ({
  file,
  showPrev,
  url,
  imgCount, idx
}: {
  file: FileRes;
  showPrev: () => void;
  url: string;
  imgCount: [number, React.Dispatch<React.SetStateAction<number>>];
  idx: number
}) => {
  const { handleSelection } = useSelectFile();

  const selected = useSelector((state: RootState) => state.allFiles.selected);

  const chkSelected = (file_name: string, file_path: string) =>
    selected.find(
      (f) => f.file_name === file_name && f.file_path === file_path,
    );

  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const [count, setCount] = imgCount;

  const [counted, setCounted] = useState(false);

  const { file_path, file_name } = file;

  const MAX_RENDER = 40;

  return (
    <InView
      onChange={(inv) => {
        if (inv && !counted) {
          setCount((c) => c + 1);
          setCounted(true);
        };
        if (!inv && counted && count > MAX_RENDER && count - idx >= MAX_RENDER) {
          setCount((c) => c - 1);
          setCounted(false);
        }
      }}
      as={"div"}
      threshold={0}
    >
      {({ inView, ref }) => (
        <div
          ref={ref}
          {...(chkSelected(file_name, file_path)
            ? { style: { border: "3px solid var(--main-primary)" } }
            : {})}
          className={`relative aspect-square overflow-hidden ${!imgLoaded || (!inView && count > MAX_RENDER) || counted ? "bg-gray-500" : ""}`}
        >
          <button
            {...(chkSelected(file_name, file_path)
              ? {
                  style: {
                    background: "var(--main-primary)",
                    border: "none",
                  },
                }
              : {})}
            onClick={() => handleSelection(file)}
            className="absolute top-2.5 h-5 aspect-square text-[12px] flex justify-center items-center rounded-full border-2 border-gray-700 backdrop-blur-lg left-2.5"
          >
            {chkSelected(file_name, file_path) && <FaCheck />}
          </button>
          {(inView || count <= MAX_RENDER) && counted && (
            <img
              onLoad={() => {
                setImgLoaded(true);
              }}
              decoding="async"
              loading="lazy"
              className="w-full h-full object-cover object-center"
              src={url}
              alt={file_name}
              onClick={showPrev}
            />
          )}
        </div>
      )}
    </InView>
  );
};

export default ImageGridItem;
