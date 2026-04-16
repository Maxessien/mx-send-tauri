import { FileRes } from "../../types";
import TabListItem from "./TabListItem";

const TabFilesWrapper = ({ files }: { files: FileRes[] }) => {
  return (
    <>
      <div className="w-full space-y-2">
        {files.length > 0 ? files.map(({ file_name, file_path, file_size, type }) => {
          return (
            <TabListItem
              fileName={file_name}
              filePath={file_path}
              fileSize={file_size}
              type={type}
            />
          );
        }) : <p className="w-full text-center font-semibold text-2xl py-4">No Files found</p>}
      </div>
    </>
  );
};

export default TabFilesWrapper;
