import { convertFileSrc } from "@tauri-apps/api/core";
import { FileRes } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useSelectFile } from "../../hooks/useSelectFile";
import { useState } from "react";

const ImageFiles = ({ images }: { images: FileRes[] }) => {
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const { handleSelection } = useSelectFile();

  const [imgLoaded, setImagLoaded] = useState(false);

  return (
    <div className="grid justify-between w-full gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {images.map((file) => {
        const { file_path, file_name } = file;
        return (
          <div
            {...(selected.find(
              (f) => f.file_name === file_name && f.file_path === file_path,
            )
              ? { style: { border: "3px solid var(--main-primary)" } }
              : {})}
            className={`relative aspect-square overflow-hidden ${imgLoaded ? "bg-gray-500" : ""}`}
          >
            <button
              {...(selected.find(
                (f) => f.file_name === file_name && f.file_path === file_path,
              )
                ? { style: { background: "var(--main-primary)" } }
                : {})}
              onClick={() => handleSelection(file)}
              className="absolute top-2.5 h-5 aspect-square rounded-full border-2 border-gray-700 backdrop-blur-lg left-2.5"
            ></button>
            <img
              onLoadedData={() => setImagLoaded(true)}
              decoding="async"
              loading="lazy"
              className="w-full h-full object-cover object-center"
              src={convertFileSrc(file_path)}
              alt={file_name}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ImageFiles;
