import { FaArrowLeft, FaFolder } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router";
import { useGetDirList } from "../../hooks/useGetFiles";
import TabListItem from "./TabListItem";

const InternalStorageTab = () => {
  const [searchPar, setSearchPar] = useSearchParams();
  const { dirList, isFetching } = useGetDirList(searchPar.get("path") || "");
  const navigate = useNavigate();
  return (
    <div className="space-y-2">
      <p className="w-full flex justify-start items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-lg font-medium flex cursor-pointer justify-center items-center"
        >
          <span className="mr-2">
            <FaArrowLeft />
          </span>{" "}
          Back
        </button>
      </p>
      {isFetching ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : dirList.folders &&
        dirList.folders?.length > 0 &&
        dirList.files &&
        dirList.files.length > 0 ? (
        <ul className="space-y-1">
          {dirList.folders?.length > 0 &&
            dirList.folders.map(({ folder_name, path }) => {
              return (
                <li
                  key={path}
                  className=" bg-(--main-tertiary) rounded-md"
                  style={{
                    border: "1px solid var(--main-tertiary-light)",
                  }}
                >
                  <button
                    onClick={() => {
                      setSearchPar({ path });
                    }}
                    className="text-left cursor-pointer flex gap-3 justify-start items-center flex-1 px-3 py-2 transition-all rounded-md hover:bg-(--main-tertiary-light)"
                  >
                    <span className="text-xl font-bold">
                      <FaFolder />
                    </span>
                    <div>
                      <p className="m-0 font-medium">{folder_name}</p>
                      <small className="block">{path}</small>
                    </div>
                  </button>
                </li>
              );
            })}
          {dirList.files?.length > 0 &&
            dirList.files.map(
              ({ file_name, file_path, file_size, file_type }) => {
                return (
                  <TabListItem
                    fileName={file_name}
                    filePath={file_path}
                    fileSize={file_size}
                    type={file_type}
                  />
                );
              },
            )}
        </ul>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>Empty folder</p>
      )}
    </div>
  );
};

export default InternalStorageTab;
