import AppHeader from "./components/page-layouts/AppHeader";
import AppNavigation from "./components/page-layouts/AppNavigation";
import LoadRoller from "./components/reusable-components/LoaderRoller";
import TabLayout from "./components/tab-components/TabLayout";
import { useGetFiles } from "./hooks/useGetFiles";
import "./index.css";


function App() {
  const { query } = useGetFiles();
  const { isFetching } = query;


  return (
    <div>
      <AppHeader />
      <AppNavigation>
        {isFetching ? (
          <div className="w-full flex justify-center items-center h-full">
            <div className="w-24 h-24">
              <LoadRoller strokeWidth={10} />
            </div>
          </div>
        ) : (
          <TabLayout
          ></TabLayout>
        )}
      </AppNavigation>
    </div>
  );
}

export default App;
