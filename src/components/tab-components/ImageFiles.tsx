import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { FileRes } from "../../types";
import ImageGridItem from "../reusable-components/ImageGridItem";
import ImagePrev from "./ImagePrev";

const ImageFiles = ({ images }: { images: FileRes[] }) => {
  const [showPrev, setShowPrev] = useState({
    active: false,
    url: "",
    name: "",
  });

  const imgCount = useState<number>(0);

  useEffect(()=> console.log(imgCount), [imgCount])

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
        const url = convertFileSrc(file.file_path);
        return (
          <ImageGridItem
            imgCount={imgCount}
            key={i}
            file={file}
            url={url}
            showPrev={() =>
              setShowPrev({ active: true, name: file.file_name, url })
            }
            idx={i}
          />
        );
      })}
    </div>
  );
};

export default ImageFiles;
