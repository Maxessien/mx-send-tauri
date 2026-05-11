import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { MdFilterList } from "react-icons/md";
import { useSelector } from "react-redux";
import { useGetFiles } from "../../hooks/useGetFiles";
import { RootState } from "../../store";
import { FileRes, FileResType, List } from "../../types";
import { sortFileList } from "../../utils/file-utils";
import Button from "../reusable-components/Button";
import TabFilesWrapper from "./TabFilesWrapper";
import TabLoader from "./TabLoader";

interface Actions extends Omit<List, "list"> {
  search: string;
}

interface Mappings extends Pick<List, "direction" | "sortBy"> {
  text: string;
}

const checkMappingsEqual = (mapping1: Mappings, mapping2: Mappings) =>
  mapping1.direction === mapping1.direction &&
  mapping1.sortBy === mapping2.sortBy &&
  mapping1.text === mapping2.text;

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
  const {width} = useSelector((state: RootState)=> state.windowSize)

  const mappings: Mappings[] = [
    { direction: "asc", sortBy: "name", text: "A-Z" },
    { direction: "desc", sortBy: "name", text: "Z-A" },
    { direction: "desc", sortBy: "size", text: "Largest First" },
    { direction: "asc", sortBy: "size", text: "Smallest First" },
  ];
  const [selectedMapping, setSelectedMapping] = useState<Mappings>(mappings[0]);
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!query.data) return;

    const hasSearch = actions.search.trim();

    const sorted = sortFileList({
      ...actions,
      list: hasSearch
        ? query.data.filter(
            ({ file_name }) =>
              file_name
                .toLowerCase()
                .startsWith(actions.search.toLowerCase()) ||
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
      <header className="flex justify-start md:items-center">
        <h2 className="font-semibold w-full md:w-max text-center text-2xl">
          {tabTitle}
        </h2>
      </header>
      <div className="w-full relative flex gap-2 justify-between items-center">
        <div className="relative w-full max-w-120">
          <input
            onChange={(e) => submitSearch({ searchQuery: e.target.value })}
            className="w-full rounded-md bg-(--main-tertiary-light) px-3 py-2 pr-9"
            type="text"
          />
          <button className="text-md absolute top-1/2 right-2 -translate-y-1/2">
            <FaSearch />
          </button>
        </div>
        <Button attrs={{onClick: ()=> setShowFilters(!showFilters)}} rounded="rounded-md" size={width > 480 ? "medium" : "small"} color="primary">
          <span>
            <MdFilterList size={22} />
          </span>
          <span className="hidden sm:inline">{selectedMapping.text}</span>
        </Button>
        {showFilters && <div className="absolute z-99 flex flex-col gap-2 rounded-md bg-(--main-tertiary) border border-(--text-primary) p-1 top-[calc(100%+10px)] right-0">
          {mappings.map((mapping) => {
            const { direction, sortBy, text } = mapping;
            return (
              <button
                className={`w-full px-3 py-2 cursor-pointer ${checkMappingsEqual(mapping, selectedMapping) ? "bg-(--main-primary) hover:bg-(--main-primary-light)" : "hover:bg-(--main-tertiary-light)"} rounded-md`}
                onClick={() =>{
                  setActions((state) => ({ ...state, direction, sortBy }))
                  setSelectedMapping(mapping)
                }}
              >
                {text}
              </button>
            );
          })}
        </div>}
      </div>
      <TabLoader isLoading={query.isFetching}>
        <TabFilesWrapper files={list ?? []} />
      </TabLoader>
    </section>
  );
};

export default Tab;
