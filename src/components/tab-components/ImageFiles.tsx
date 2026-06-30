import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { InView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { useSelectFile } from "../../hooks/useSelectFile";
import { RootState } from "../../store";
import { FileRes } from "../../types";
import ImagePrev from "./ImagePrev";

const ImageFiles = ({ images }: { images: FileRes[] }) => {
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const { handleSelection } = useSelectFile();

  const [imgLoaded, setImgLoaded] = useState<boolean[]>(
    Array(images.length).fill(false),
  );

  const [showPrev, setShowPrev] = useState({
    active: false,
    url: "",
    name: "",
  });

  const chkSelected = (file_name: string, file_path: string) =>
    selected.find(
      (f) => f.file_name === file_name && f.file_path === file_path,
    );

  const MAX_RENDER = 100;

  return (
    <div className="grid justify-between w-full gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {showPrev.active && (
        <ImagePrev
          fileName={showPrev.name}
          src={showPrev.url}
          closeFn={() => setShowPrev((st) => ({ ...st, active: false }))}
        />
      )}
      {images.map((file, i) => {
        const { file_path, file_name } = file;
        const url = convertFileSrc(file_path);
        return (
          <InView
            onChange={(inv) => {
              if (!inv) {
                const copy = [...imgLoaded];
                copy[i] = false;
                setImgLoaded(copy);
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
                className={`relative aspect-square overflow-hidden ${!imgLoaded[i] || (!inView && imgLoaded.filter((bool)=> bool).length > MAX_RENDER) ? "bg-gray-500" : ""}`}
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
                  className="absolute top-2.5 h-5 aspect-square text-[12px] text-center rounded-full border-2 border-gray-700 backdrop-blur-lg left-2.5"
                >
                  {chkSelected(file_name, file_path) && <FaCheck />}
                </button>
                {(inView && imgLoaded.filter((bool)=> bool).length <= MAX_RENDER) && (
                  <img
                    onLoad={() => {
                      const copy = [...imgLoaded];
                      copy[i] = true;
                      setImgLoaded(copy);
                    }}
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover object-center"
                    src={url}
                    alt={file_name}
                    onClick={() =>
                      setShowPrev({ active: true, name: file_name, url })
                    }
                  />
                )}
              </div>
            )}
          </InView>
        );
      })}
    </div>
  );
};

export default ImageFiles;
