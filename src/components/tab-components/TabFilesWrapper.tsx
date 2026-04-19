import { FileRes } from "../../types";
import { FILE_PREVIEW_IMAGES } from "../../utils/file-utils";
import TabListItem from "./TabListItem";

const TabFilesWrapper = ({ files }: { files: FileRes[] }) => {
  return (
    <>
      <div className="w-full space-y-2">
        {files.length > 0 ? files.map(({ file_name, file_path, file_size, type }) => {
          return (
            <TabListItem
              key={file_name + file_path}
              fileName={file_name}
              filePath={file_path}
              fileSize={file_size}
              type={type}
              previewImgUrl={FILE_PREVIEW_IMAGES?.[type] || undefined}
            />
          );
        }) : <p className="w-full text-center font-semibold text-2xl py-4">No Files found</p>}
      </div>
    </>
  );
};

export default TabFilesWrapper;
