

import { useGetFiles } from "../../hooks/useGetFiles";
import { FileResType } from "../../types";
import TabFilesWrapper from "./TabFilesWrapper";
import TabLoader from "./TabLoader";

export const Tab = ({tabType, tabTitle}: {tabType: FileResType, tabTitle: string}) => {
  const { query } = useGetFiles(tabType);

  return (
    <section className="w-full space-y-3">
      <h2 className="w-full text-left font-semibold text-2xl">{tabTitle}</h2>
      <TabLoader isLoading={query.isFetching}>
        <TabFilesWrapper files={query.data || []} />
      </TabLoader>
    </section>
  );
};


const AudioTab = () => {
  return (
    <Tab tabTitle="Audio Files" tabType="audio" />
  )
}

export default AudioTab