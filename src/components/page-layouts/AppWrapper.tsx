import { JSX, useState } from "react";
import AppHeader from "./AppHeader";
import AppNavItem from "./AppNavItem";
import { FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import useWebsocket from "../../hooks/useWebsocket";
import ActionBtns from "./ActionBtns";
import QrCodeDisplay from "./QrCodeDisplay";
import { invoke } from "@tauri-apps/api/core";
import { useDispatch } from "react-redux";
import { setConnection } from "../../store-slices/connectionSlice";
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
  const {} = useWebsocket();

  return (
    <div className="w-screen flex flex-col h-screen min-h-150">
      <AppHeader />
      <QrScanner
        closeScanner={() => setShowScanner({ active: false, codeVal: "" })}
      />
      <main className="w-full flex-1 grid grid-cols-[25%_75%]">
        {showQrCode.active && (
          <QrCodeDisplay
            stopServer={stopServer}
            qrcodeVal={showQrCode.codeVal}
          />
        )}
        <aside className="md:h-full w-full z-15 fixed md:sticky flex flex-col gap-2 items-center justify-center bottom-3 left-0">
          <ActionBtns
            openScanner={() => setShowScanner({ active: true, codeVal: "" })}
            setQrCode={(state) => setShowQrCode(state)}
            showQrCode={showQrCode}
            showScanner={showScanner}
          />
          <nav className="space-y-3 md:h-full md:w-full w-[90%] mx-auto px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none flex justify-between items-center md:flex-col md:items-left md:justify-start gap-2">
            <AppNavItem active="audio" icon={<FaMusic />} title="Audio" />
            <AppNavItem active="video" icon={<FaVideo />} title="Video" />
            <AppNavItem active="image" icon={<FaImage />} title="Image" />
            <AppNavItem active="document" icon={<FaMusic />} title="Document" />
            <AppNavItem
              active="transfers"
              icon={<FiLoader />}
              title="Transfers"
            />
          </nav>
        </aside>
        <section className="w-full px-3 py-5 h-full overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AppWrapper;
