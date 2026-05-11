import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { JSX, useEffect, useState } from "react";
import {
  FaClock,
  FaCog,
  FaFile,
  FaFolder,
  FaImage,
  FaMusic,
  FaVideo
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { toast } from "react-toastify";
import { useReceiver } from "../../hooks/useGetFiles";
import useWebsocket from "../../hooks/useWebsocket";
import { RootState } from "../../store";
import { setConnection } from "../../store-slices/connectionSlice";
import { DownloadProgress, FileRes, UploadProgress } from "../../types";
import ActionBtns from "./ActionBtns";
import AppHeader from "./AppHeader";
import AppNavItem from "./AppNavItem";
import QrCodeDisplay from "./QrCodeDisplay";
import QrScanner from "./QrScanner";

export interface ScannerState {
  active: boolean;
  codeVal: string;
}

const AppWrapper = ({ children }: { children: JSX.Element }) => {
  const [showQrCode, setShowQrCode] = useState<ScannerState>({
    active: false,
    codeVal: "",
  });
  const [showScanner, setShowScanner] = useState<ScannerState>({
    active: false,
    codeVal: "",
  });

  const [serverStarted, setServerStarted] = useState(false);

  const dispatch = useDispatch();

  const stopServer = async () => {
    console.log("running");
    try {
      const res = await invoke("disconnect_server");
      console.log(res);
      setShowQrCode({ active: false, codeVal: "" });
      dispatch(
        setConnection({
          count: 0,
          isConnected: false,
          role: "receiver",
          connectionInfo: { ip_address: "", port: "", session_id: "" },
          socket: null,
        }),
      );
      setServerStarted(false);
    } catch (err) {
      console.log(err);
    } finally {
      console.log("ran");
    }
  };

  const { socket } = useWebsocket();
  const { downloadVideo } = useReceiver();
  const { connectionInfo, isConnected, role } = useSelector(
    (state: RootState) => state.connection,
  );
  const appSessionId = useSelector((state: RootState) => state.appSession);

  useEffect(() => {
    let unlistenTauri: UnlistenFn[] = [];
    let isMounted = true;

    if (isConnected) {
      setShowQrCode({ active: false, codeVal: "" });
      setShowScanner({ active: false, codeVal: "" });
    }

    if (isConnected && role === "receiver" && socket) {
      socket.emit("newConnection", connectionInfo.session_id);
      socket.on("newFile", (data: { file_id: string; sender_id: string }) => {
        downloadVideo(data.file_id, data.sender_id);
      });
      listen<DownloadProgress>("download_progress", (event) => {
        const progress = event.payload;
        socket?.emit("progress", {
          ...progress,
        });
      })
        .then((unlisten) => {
          if (isMounted) unlistenTauri.push(unlisten);
          else unlisten();
        })
        .catch(() => {
          toast.error("Couldn't broadcast download progress");
        });

      listen<UploadProgress>("upload_progress", (event) => {
        const { current, info } = event.payload;
        const { file_name, file_path, file_size, type } = JSON.parse(
          info,
        ) as FileRes;
        socket?.emit("progress", {
          current,
          file_name,
          file_path,
          file_size,
          file_type: type,
          total: file_size,
          sender_id: appSessionId,
        });
      })
        .then((unlisten) => {
          if (isMounted) unlistenTauri.push(unlisten);
          else unlisten();
        })
        .catch(() => {
          toast.error("Couldn't broadcast upload progress");
        });
    }

    if (isConnected) setShowQrCode((state) => ({ ...state, active: false }));

    return () => {
      isMounted = false;
      socket?.off("newFile");
      unlistenTauri.forEach((fn) => {
        fn();
      });
    };
  }, [isConnected, role, socket]);

  const location = useLocation();

  return (
    <div className="w-screen flex flex-col h-screen min-h-150">
      <AppHeader />
      {showScanner.active && (
        <QrScanner
          closeScanner={() => setShowScanner({ active: false, codeVal: "" })}
        />
      )}
      <main className="w-full h-[calc(100vh-68px)] flex flex-col md:grid md:grid-cols-[25%_75%]">
        {showQrCode.active && (
          <QrCodeDisplay
            stopServer={stopServer}
            qrcodeVal={showQrCode.codeVal}
            closeDisplay={() =>
              setShowQrCode((state) => ({ ...state, active: false }))
            }
          />
        )}
        <aside className="md:h-full w-full">
          <ul className="md:space-y-3 md:h-full w-full md:px-3 md:py-2 overflow-x-auto scrollbar-hide md:overflow-x-hidden bg-(--main-tertiary) md:border-2 md:border-(--text-secondary-light) flex items-center md:flex-col md:items-left justify-start gap-2">
            <AppNavItem
              location="/history"
              active={location.pathname.trim() === "/history"}
              icon={<FaClock />}
              title="Transfer History"
            />
            <AppNavItem
              location="/audio"
              active={
                location.pathname.trim() === "/audio" ||
                location.pathname.trim() === "/"
              }
              icon={<FaMusic />}
              title="Audio"
            />
            <AppNavItem
              location="/video"
              active={location.pathname.trim() === "/video"}
              icon={<FaVideo />}
              title="Video"
            />
            <AppNavItem
              location="/image"
              active={location.pathname.trim() === "/image"}
              icon={<FaImage />}
              title="Image"
            />
            <AppNavItem
              location="/document"
              active={location.pathname.trim() === "/document"}
              icon={<FaFile />}
              title="Document"
            />
            <AppNavItem
              location="/storage"
              active={location.pathname.trim() === "/storage"}
              icon={<FaFolder />}
              title="Internal Storage"
            />
            <AppNavItem
              location="/settings"
              active={location.pathname.trim() === "/settings"}
              icon={<FaCog />}
              title="Settings"
            />
          </ul>
        </aside>
        <div className="flex-1 flex pb-3 min-h-0 flex-col">
          <section className="w-full px-3 flex-1 py-5 overflow-y-auto">
            {children}
          </section>
          <div className="block">
            <ActionBtns
              openScanner={() => setShowScanner({ active: true, codeVal: "" })}
              setQrCode={(state) => setShowQrCode(state)}
              showQrCode={showQrCode}
              showScanner={showScanner}
              serverStarted={serverStarted}
              setServerStarted={() => setServerStarted(true)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppWrapper;
