import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { JSX, useEffect, useState } from "react";
import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { useReceiver } from "../../hooks/useGetFiles";
import useWebsocket from "../../hooks/useWebsocket";
import { RootState } from "../../store";
import { updateTransferProgress } from "../../store-slices/allFilesSlice";
import { setConnection } from "../../store-slices/connectionSlice";
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

  const dispatch = useDispatch();

  const stopServer = async () => {
    try {
      await invoke("disconnect_server");
      setShowQrCode({ active: false, codeVal: "" });
      dispatch(
        setConnection({
          count: 0,
          isConnected: false,
          role: "receiver",
          connectionInfo: { ip_address: "", port: "", session_id: "" },
        }),
      );
    } catch (err) {
      console.log(err);
    }
  };
  //Call websocket hook to initiate use effect that initiates socket globally when isConnected is true
  const { socket } = useWebsocket();
  const { downloadVideo } = useReceiver();
  const { connectionInfo, isConnected, role } = useSelector(
    (state: RootState) => state.connection,
  );
  const appSessionId = useSelector((state: RootState)=>state.appSession)

  useEffect(() => {
    let unlistenTauri: () => void;

    if (isConnected && role === "receiver") {
      socket.current?.emit("newConnection", connectionInfo.session_id);
      if (socket.current) {
        socket.current.on("newFile", (data: string) => {
          downloadVideo(data);
        });
      }

      listen<any>("download_progress", (event) => {
        const fileInfo = event.payload;
        if (socket.current) {
          socket.current.emit("progress", {
            ...fileInfo,
            sender_id: appSessionId,
          });
        }
        dispatch(
          updateTransferProgress({ ...fileInfo, sender_id: appSessionId }),
        );
      }).then((unlisten) => {
        unlistenTauri = unlisten;
      });
    }

    if (isConnected) setShowQrCode(state=>({...state, active: false}))

    return () => {
      socket.current?.off("newFile");
      if (unlistenTauri) unlistenTauri();
    };
  }, [isConnected, role]);

  const location = useLocation()

  return (
    <div className="w-screen flex flex-col h-screen min-h-150">
      <AppHeader />
      {showScanner.active && (
        <QrScanner
          closeScanner={() => setShowScanner({ active: false, codeVal: "" })}
        />
      )}
      <main className="w-full h-[calc(100vh-68px)] md:grid md:grid-cols-[25%_75%]">
        {showQrCode.active && (
          <QrCodeDisplay
            stopServer={stopServer}
            qrcodeVal={showQrCode.codeVal}
          />
        )}
        <aside className="md:h-full w-full z-15 fixed md:sticky flex flex-col gap-2 items-center justify-center bottom-3 left-0">
          <div className="md:hidden w-full">
            <ActionBtns
              openScanner={() => setShowScanner({ active: true, codeVal: "" })}
              setQrCode={(state) => setShowQrCode(state)}
              showQrCode={showQrCode}
              showScanner={showScanner}
            />
          </div>
          <ul className="space-y-3 md:h-full md:w-full w-[90%] mx-auto px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none flex justify-between items-center md:flex-col md:items-left md:justify-start gap-2">
            <AppNavItem location="/audio" active={location.pathname.trim()=== "/audio" || location.pathname.trim()=== "/"} icon={<FaMusic />} title="Audio" />
            <AppNavItem location="/video" active={location.pathname.trim()=== "/video"} icon={<FaVideo />} title="Video" />
            <AppNavItem location="/image" active={location.pathname.trim()=== "/image"} icon={<FaImage />} title="Image" />
            <AppNavItem location="/document" active={location.pathname.trim()=== "/document"} icon={<FaFile />} title="Document" />
            <AppNavItem
              location="/transfers" active={location.pathname.trim()=== "/transfers"}
              icon={<FiLoader />}
              title="Transfers"
            />
          </ul>
        </aside>
        <div className="hidden fixed bottom-4 w-[73vw] z-99 right-[25vw] translate-x-[23vw] md:block">
          <ActionBtns
            openScanner={() => setShowScanner({ active: true, codeVal: "" })}
            setQrCode={(state) => setShowQrCode(state)}
            showQrCode={showQrCode}
            showScanner={showScanner}
          />
        </div>
        <section className="w-full px-3 py-5 h-full overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AppWrapper;
