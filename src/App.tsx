import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import AppWrapper from "./components/page-layouts/AppWrapper";
import AudioTab from "./components/tab-components/AudioTab";
import DocumentTab from "./components/tab-components/DocumentTab";
import ImageTab from "./components/tab-components/ImageTab";
import TransferTab from "./components/tab-components/TransferTab";
import VideoTab from "./components/tab-components/VideoTab";
import { RootState } from "./store";
import { addTransferred } from "./store-slices/allFilesSlice";
import { setSettings } from "./store-slices/settingsSlice";
import { setWindow } from "./store-slices/windowSizeSlice";
import { defaultSettings } from "./utils/file-utils";


const App = () => {
  const dispatch = useDispatch();
  const { socket } = useSelector((state: RootState) => state.connection);
  const settings = useSelector((state: RootState)=> state.settings)
  const {transferred} = useSelector((state: RootState)=> state.allFiles)

  const settingsInit = useRef(false)

  useEffect(() => {
    (async () => {
      try {
        await invoke("disconnect_server");
        if (socket) socket.close();
        const sett = await invoke<string>("get_settings", {defaultSettings})
        const trans = await invoke<string>("get_transferred")
        dispatch(setSettings(JSON.parse(sett)))
        dispatch(addTransferred({files: JSON.parse(trans), mode: "replace"}))
        settingsInit.current = true
      } catch (err) {
        console.log(err);
      }
    })();

    const handleResize = () => {
      dispatch(
        setWindow({ height: window.innerHeight, width: window.innerWidth }),
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(()=>{
    if (!settingsInit.current) return
    (async()=>{
      try {
        await invoke("save_settings", {settings: JSON.stringify(settings)})
      } catch (err) {
        console.log(err)  
      }
    })()
  }, [settings])

  useEffect(()=>{
    if (!settingsInit.current) return
    (async()=>{
      try {
        await invoke("save_transfer", {content: JSON.stringify(transferred)})
      } catch (err) {
        console.log(err)
      }
    })()
  }, [transferred])
  
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
      <ToastContainer
        closeOnClick
        draggable
        newestOnTop
        pauseOnHover
        position="top-center"
        theme="colored"
      />
    </BrowserRouter>
  );
};

export default App;
