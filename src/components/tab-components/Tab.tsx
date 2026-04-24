import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useGetFiles } from "../../hooks/useGetFiles";
import { FileRes, FileResType, List } from "../../types";
import { sortFileList } from "../../utils/file-utils";
import TabFilesWrapper from "./TabFilesWrapper";
import TabLoader from "./TabLoader";

interface Actions extends Omit<List, "list"> {
  search: string;
}

const Tab = ({
  tabType,
  tabTitle,
}: {
  tabType: FileResType;
  tabTitle: string;
}) => {
  const { query } = useGetFiles(tabType);
  const [list, setList] = useState<FileRes[] | undefined>(query.data);
  const [actions, setActions] = useState<Actions>({
    direction: "asc",
    sortBy: "name",
    search: "",
  });

  useEffect(() => {
    if (!query.data) return;


    const hasSearch = actions.search.trim();

    const sorted = sortFileList({
      ...actions,
      list: hasSearch
        ? query.data.filter(
            ({ file_name }) =>
              file_name.toLowerCase().startsWith(actions.search.toLowerCase()) ||
              file_name.toLowerCase().includes(actions.search.toLowerCase()),
          )
        : query.data,
    });

    setList(sorted);
  }, [actions, query.data]);

  const submitSearch = ({ searchQuery }: { searchQuery: string }) => {
    setActions((state) => ({ ...state, search: searchQuery }));
  };

  return (
    <section className="w-full space-y-3">
      <header className="flex justify-start md:justify-between md:items-center gap-2 flex-col md:flex-row">
        <h2 className="font-semibold w-full md:w-max text-center text-2xl">
          {tabTitle}
        </h2>
        <div>
          <p className="w-full text-center font-medium text-lg mb-2">Sort</p>
          <div className="flex justify-center items-center gap-2 font-medium text-md">
            <select
              className="rounded-md bg-(--main-tertiary-light) px-3 py-1"
              name="sortBy"
              id="sort_by_select"
              onChange={(e) => {
                const allowed = ["name", "size"];
                const val = e.target.value as "name" | "size";
                if (!allowed.includes(val)) return;
                setActions((state) => ({ ...state, sortBy: val }));
              }}
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <select
              className="rounded-md bg-(--main-tertiary-light) px-3 py-1"
              name="direction"
              id="direction_select"
              onChange={(e) => {
                const allowed = ["asc", "desc"];
                const val = e.target.value as "asc" | "desc";
                if (!allowed.includes(val)) return;
                setActions((state) => ({ ...state, direction: val }));
              }}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </header>
      <div className="w-full flex justify-end items-center">
        <div
          className="relative w-full max-w-120"
        >
          <input
            onChange={(e)=>submitSearch({searchQuery: e.target.value})}
            className="w-full rounded-md bg-(--main-tertiary-light) px-3 py-2 pr-9"
            type="text"
          />
          <button
            className="p-3 text-md absolute top-1/2 right-2 -translate-y-1/2"
          >
            <FaSearch />
          </button>
        </div>
      </div>
      <TabLoader isLoading={query.isFetching}>
        <TabFilesWrapper files={list ?? []} />
      </TabLoader>
    </section>
  );
};

export default Tab;
