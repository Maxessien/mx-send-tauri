import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import Onboarding from "./components/onboarding/Onboarding";
import AppWrapper from "./components/page-layouts/AppWrapper";
import AudioTab from "./components/tab-components/AudioTab";
import DocumentTab from "./components/tab-components/DocumentTab";
import ImageTab from "./components/tab-components/ImageTab";
import InternalStorageTab from "./components/tab-components/InternalStorageTab";
import MediaFolders from "./components/tab-components/MediaFolders";
import SettingsTab from "./components/tab-components/SettingsTab";
import TransferHistoryTab from "./components/tab-components/TransferHistoryTab";
import TransferTab from "./components/tab-components/TransferTab";
import VideoTab from "./components/tab-components/VideoTab";
import { RootState } from "./store";
import { addTransferred } from "./store-slices/allFilesSlice";
import { setSettings } from "./store-slices/settingsSlice";
import { setWindow } from "./store-slices/windowSizeSlice";
import {
  checkFieldsInObj,
  defaultSettings,
  determineFilesEqual,
  hasUpdate,
} from "./utils/file-utils";
import { AppSettings } from "./types";
import NewUpdatePopup from "./components/reusable-components/NewUpdatePopup";

const App = () => {
  const dispatch = useDispatch();
  const { socket } = useSelector((state: RootState) => state.connection);
  const settings = useSelector((state: RootState) => state.settings);
  const sessId = useSelector((state: RootState) => state.appSession);
  const { transferred, transferring } = useSelector(
    (state: RootState) => state.allFiles,
  );

  const settingsInit = useRef(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (socket) socket.close();
        const sett = await invoke<string>("get_settings", {
          defaultSettings: JSON.stringify(defaultSettings),
        });
        const trans = await invoke<string>("get_transferred");

        let parsedSett: AppSettings = (() => {
          try {
            return JSON.parse(sett);
          } catch (error) {
            console.log(error);
            return null;
          }
        })();

        let parsedTran = (() => {
          try {
            return JSON.parse(trans);
          } catch (error) {
            console.log(error);
            return null;
          }
        })();

        setShowUpdatePopup(
          checkFieldsInObj(parsedSett, ["showUpdatePopup"]) &&
            Date.now() - parsedSett.showUpdatePopup.timeChecked > 60 * 60 * 24 * 1000
            ? await hasUpdate(
                checkFieldsInObj(parsedSett, ["showUpdatePopup"])
                  ? parsedSett.showUpdatePopup
                  : defaultSettings.showUpdatePopup,
                (latest, show) => {
                  setSettings({
                    ...settings,
                    showUpdatePopup: {
                      version: latest,
                      show,
                      timeChecked: Date.now(),
                    },
                  });
                },
              )
            : false,
        );

        dispatch(
          setSettings(
            checkFieldsInObj(parsedSett, [
              "cacheTraversalResult",
              "extraTraversalPaths",
              "firstTimeUse",
              "keepScreenAwake",
              "organizeFilesByType",
              "saveTransferHistory",
              "theme",
              "showUpdatePopup",
            ])
              ? parsedSett
              : defaultSettings,
          ),
        );

        dispatch(
          addTransferred({
            files: parsedTran ? parsedTran : [],
            mode: "replace",
          }),
        );
      } catch (err) {
        console.log(err);
        dispatch(setSettings(defaultSettings));
        dispatch(addTransferred({ files: [], mode: "replace" }));
      } finally {
        settingsInit.current = true;
        setSettingsLoaded(true);
      }
    })();

    (async () => {
      try {
        await invoke("disconnect_server");
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
    const timeout = setTimeout(async () => {
      try {
        await invoke("save_settings", { settings: JSON.stringify(settings) });
      } catch (err) {
        console.log(err);
      }
    }, 3000);

    return () => clearTimeout(timeout);
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
      const completed = transferring
        .filter(({ current, total }) => current >= total)
        .filter(
          (file) => !transferred.some((f) => determineFilesEqual(f, file)),
        );
      if (completed.length > 0)
        dispatch(
          addTransferred({
            files: completed.map(
              ({
                file_name,
                file_path,
                file_size,
                type,
                file_type,
                sender_id,
              }) => ({
                file_name,
                file_path,
                file_size,
                type: type || file_type,
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
      {!settingsLoaded ? (
        <section className="w-screen h-screen flex justify-center items-center text-lg font-medium">
          Loading app...
        </section>
      ) : settings.firstTimeUse ? (
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate replace to="/onboarding" />} />
        </Routes>
      ) : (
        <>
          {showUpdatePopup && (
            <NewUpdatePopup
              hidePopup={() => setShowUpdatePopup(false)}
              toggleShow={(val) =>
                setSettings({
                  ...settings,
                  showUpdatePopup: { ...settings.showUpdatePopup, show: val },
                })
              }
              toggActive={settingsInit.current}
            />
          )}
          <AppWrapper>
            <Routes>
              <Route path="/" element={<Navigate replace to="/audio" />} />
              <Route path="/audio" element={<AudioTab />} />
              <Route path="/document" element={<DocumentTab />} />
              <Route path="/video" element={<VideoTab />} />
              <Route path="/image" element={<ImageTab />} />
              <Route path="/transfers" element={<TransferTab />} />
              <Route path="/settings" element={<SettingsTab />} />
              <Route path="/history" element={<TransferHistoryTab />} />
              <Route path="/media" element={<MediaFolders />} />
              <Route path="/storage" element={<InternalStorageTab />} />
              <Route
                path="/onboarding"
                element={<Navigate replace to="/audio" />}
              />
            </Routes>
          </AppWrapper>
        </>
      )}
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
