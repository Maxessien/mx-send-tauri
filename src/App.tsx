import AppWrapper from "./components/page-layouts/AppWrapper";
import { BrowserRouter, Route, Routes } from "react-router";
import AudioTab from "./components/tab-components/AudioTab";
import DocumentTab from "./components/tab-components/DocumentTab";
import VideoTab from "./components/tab-components/VideoTab";
import ImageTab from "./components/tab-components/ImageTab";
import TransferTab from "./components/tab-components/TransferTab";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const App = () => {
  useEffect(() => {
    (async () => {
      try {
        await invoke("req_file_access");
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);
  
  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
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
