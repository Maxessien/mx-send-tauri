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
import TransferHistoryTab from "./components/tab-components/TransferHistoryTab";
import SettingsTab from "./components/tab-components/SettingsTab";

const App = () => {
  const dispatch = useDispatch();
  const { socket } = useSelector((state: RootState) => state.connection);
  const settings = useSelector((state: RootState) => state.settings);
  const sessId = useSelector((state: RootState) => state.appSession);
  const { transferred, transferring } = useSelector(
    (state: RootState) => state.allFiles,
  );

  const settingsInit = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        await invoke("disconnect_server");
        if (socket) socket.close();
        const sett = await invoke<string>("get_settings", { defaultSettings });
        const trans = await invoke<string>("get_transferred");
        dispatch(setSettings(JSON.parse(sett)));
        dispatch(addTransferred({ files: JSON.parse(trans), mode: "replace" }));
        settingsInit.current = true;
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

  useEffect(() => {
    if (!settingsInit.current) return;
    (async () => {
      try {
        await invoke("save_settings", { settings: JSON.stringify(settings) });
      } catch (err) {
        console.log(err);
      }
    })();
  }, [settings]);

  useEffect(() => {
    if (!settingsInit.current) return;
    (async () => {
      try {
        await invoke("save_transfer", { content: JSON.stringify(transferred) });
      } catch (err) {
        console.log(err);
      }
    })();
  }, [transferred]);

  useEffect(() => {
    (() => {
      const completed = transferring.filter(
        ({ current, total }) => current >= total,
      );
      dispatch(
        addTransferred({
          files: completed.map(
            ({ file_name, file_path, file_size, type, sender_id }) => ({
              file_name,
              file_path,
              file_size,
              type,
              date: new Date().toISOString(),
              isReceived: sessId !== sender_id,
            }),
          ),
          mode: "append",
        }),
      );
    })();
  }, [transferring]);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.setAttribute(
      "data-theme",
      settings.theme === "system"
        ? isDark
          ? "dark"
          : "light"
        : settings.theme,
    );
  }, [settings.theme]);

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
          <Route path="/settings" element={<SettingsTab />} />
          <Route path="/history" element={<TransferHistoryTab />} />
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
