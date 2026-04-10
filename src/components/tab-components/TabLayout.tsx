import { FileRes } from "../../store-slices/allFilesSlice";
import TabListItem from "./TabListItem";

const TabLayout = ({
  files,
  prevImage,
}: {
  files: FileRes[];
  prevImage: string;
}) => {
  return (
    <>
      <section className="space-y-2 w-full">
        {files.length > 0 ? (
          files.map(({ file_name, file_path, file_size }) => {
            return (
              <TabListItem
                fileName={file_name}
                filePath={file_path}
                fileSize={file_size}
                previewImgUrl={prevImage}
              />
            );
          })
        ) : (
          <p className="w-full py-4 text-center font-medium text-2xl">No files found</p>
        )}
      </section>
    </>
  );
};

export default TabLayout;
