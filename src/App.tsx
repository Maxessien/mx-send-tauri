import { useSelector } from "react-redux";
import AppHeader from "./components/page-layouts/AppHeader";
import AppNavigation from "./components/page-layouts/AppNavigation";
import LoadRoller from "./components/reusable-components/LoaderRoller";
import TabLayout from "./components/tab-components/TabLayout";
import { useGetFiles } from "./hooks/useGetFiles";
import "./index.css";
import { RootState } from "./store";

function App() {
  const { query } = useGetFiles();
  const { isFetching } = query;
  const { activeTab, audio, document, images, video } = useSelector(
    (state: RootState) => ({ ...state.activeTab, ...state.allFiles }),
  );

  const getCurrentTabInfo = () => {
    let files = audio;
    let imgUrl = "/audio-icon.jpg";
    switch (activeTab) {
      case "audio":
        files = audio;
        imgUrl = "/audio-icon.jpg";
        break;
      case "document":
        files = document;
        imgUrl = "/document-icon.png";
        break;
      case "images":
        files = images;
        imgUrl = "/icons8-image-100.png";
        break;
      case "video":
        files = video;
        imgUrl = "/icons8-video-100.png";
        break;
      default:
        break;
    }
    return { files, imgUrl };
  };

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
            prevImage={getCurrentTabInfo().imgUrl}
            files={getCurrentTabInfo().files}
          ></TabLayout>
        )}
      </AppNavigation>
    </div>
  );
}

export default App;
