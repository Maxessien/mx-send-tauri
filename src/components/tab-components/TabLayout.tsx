import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import Button from "../reusable-components/Button";
import TabListItem from "./TabListItem";
import { FILE_PREVIEW_IMAGES } from "../../utils/file-utils";


const TabLayout = () => {
  const [input, setInput] = useState("");
  const {activeTab, ...files} = useSelector((state: RootState)=>({...state.activeTab, ...state.allFiles}))

  const search = () => {};
    const formatTabTitle = ()=>{
      const start = activeTab.slice(0, 1)
      const end = activeTab.slice(1)
  
      return `${start.toUpperCase() + end} Files`
    }

  return (
    <>
      <section className="space-y-2 w-full">
        <header className="w-full py-3 flex gap-2 justify-between items-center">
          <h2 className="text-xl font-semibold">{formatTabTitle()}</h2>
          <div className="flex-1 flex justify-end">
            <form onSubmit={search} className="w-full relative max-w-80">
              <input
                value={input}
                id="search_input"
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-2 py-3 pr-13 rounded-full shadow-[0px_0px_10px_-4px_var(--text-secondary)]"
                type="text"
              />
              <Button
                attrs={{ onClick: search }}
                usePredefinedSize={false}
                className="p-3 absolute top-1/2 right-2 -translate-y-1/2 text-base"
              >
                <FaSearch />
              </Button>
            </form>
          </div>
        </header>
        {files?.[activeTab].length > 0 ? (
          files?.[activeTab].map(({ file_name, file_path, file_size }) => {
            return (
              <TabListItem
                fileName={file_name}
                filePath={file_path}
                fileSize={file_size}
                type={activeTab}
                previewImgUrl={FILE_PREVIEW_IMAGES[activeTab]}
              />
            );
          })
        ) : (
          <p className="w-full py-4 text-center font-medium text-2xl">
            No files found
          </p>
        )}
      </section>
    </>
  );
};

export default TabLayout;
