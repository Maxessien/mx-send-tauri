import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router";
import AppWrapper from "./components/page-layouts/AppWrapper";
import AudioTab from "./components/tab-components/AudioTab";
import DocumentTab from "./components/tab-components/DocumentTab";
import ImageTab from "./components/tab-components/ImageTab";
import TransferTab from "./components/tab-components/TransferTab";
import VideoTab from "./components/tab-components/VideoTab";
import { setWindow } from "./store-slices/windowSizeSlice";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        await invoke("req_file_access");
      } catch (err) {
        console.log(err);
      }
    })();

    const handleResize = () => {
      dispatch(setWindow({ height: window.innerHeight, width: window.innerWidth }));
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);
  
  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
          <Route path="/" element={<AudioTab />} />
          <Route path="/audio" element={<AudioTab />} />
          <Route path="/document" element={<DocumentTab />} />
          <Route path="/video" element={<VideoTab />} />
          <Route path="/image" element={<ImageTab />} />
          <Route path="/transfers" element={<TransferTab />} />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
};

export default App;
