import { FaArrowLeft, FaFolder, FaSearch } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router";
import { useGetDirList } from "../../hooks/useGetFiles";
import TabListItem from "./TabListItem";
import TabLoader from "./TabLoader";

const InternalStorageTab = () => {
  const [searchPar, setSearchPar] = useSearchParams();
  const { dirList, isFetching, setSearchQuery, searchQuery } = useGetDirList(searchPar.get("path") || "");
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="w-full flex flex-col gap-2">
        {searchPar.get("path") && (
          <p className="w-full flex justify-start items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="text-lg font-medium flex cursor-pointer justify-center items-center text-(--text-primary)"
            >
              <span className="mr-2">
                <FaArrowLeft />
              </span>{" "}
              Back
            </button>
          </p>
        )}
        <div className="flex w-full items-center bg-(--main-tertiary) rounded-md px-3 py-2" style={{ border: "1px solid var(--main-tertiary-light)" }}>
          <FaSearch className="text-(--text-secondary) mr-2" />
          <input
            type="text"
            placeholder="Search files and folders..."
            aria-label="Search files and folders"
            className="w-full bg-transparent border-none outline-none text-(--text-primary) placeholder-(--text-secondary)"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>
      </div>
      <TabLoader isLoading={isFetching}>
        {(dirList.folders &&
        dirList.folders?.length > 0) ||
        (dirList.files &&
        dirList.files.length > 0) ? (
          <ul className="space-y-1">
            {dirList.folders?.length > 0 &&
              dirList.folders.map(({ folder_name, path }) => {
                return (
                  <li
                    key={path}
                    className=" bg-(--main-tertiary) w-full rounded-md"
                    style={{
                      border: "1px solid var(--main-tertiary-light)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSearchPar({ path });
                      }}
                      className="text-left cursor-pointer w-full flex gap-3 justify-start items-center w-full px-3 py-2 transition-all rounded-md hover:bg-(--main-tertiary-light)"
                    >
                      <span className="text-xl font-bold">
                        <FaFolder />
                      </span>
                      <div className="flex-1 max-w-[calc(100%-30px)]">
                        <p className="m-0 w-full line-clamp-2 wrap-break-word font-medium">{folder_name}</p>
                        <small className="w-full line-clamp-3 wrap-break-word">{path}</small>
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
          <p className="text-(--text-secondary) text-center text-xl font-semibold">Empty folder</p>
        )}
      </TabLoader>
    </div>
  );
};

export default InternalStorageTab;
