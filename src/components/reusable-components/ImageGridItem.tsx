import { useEffect, useState } from "react";
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
  idx, showList
}: {
  file: FileRes;
  showPrev: () => void;
  url: string;
  showList: [number[], React.Dispatch<React.SetStateAction<number[]>>];
  idx: number
}) => {
  const { handleSelection } = useSelectFile();

  const selected = useSelector((state: RootState) => state.allFiles.selected);

  const chkSelected = (file_name: string, file_path: string) =>
    selected.find(
      (f) => f.file_name === file_name && f.file_path === file_path,
    );

  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const [show, setShow] = showList

  const { file_path, file_name } = file;

  useEffect(()=>{
    if (!show.includes(idx)) setImgLoaded(false)
  }, [show])

  return (
    <InView
      onChange={(inv) => {
        if (inv && !show.includes(idx)) setShow([...show.slice(1), idx])
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
          className={`relative aspect-square overflow-hidden ${!imgLoaded ? "bg-gray-500" : ""}`}
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
          {(inView || show.includes(idx)) && (
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
