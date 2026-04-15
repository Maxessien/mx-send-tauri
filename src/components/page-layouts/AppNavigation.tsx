import { invoke } from "@tauri-apps/api/core";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import QrCode from "react-qr-code";
import { useDispatch, useSelector } from "react-redux";
import useSendFiles from "../../hooks/useSendFiles";
import useWebsocket from "../../hooks/useWebsocket";
import { RootState } from "../../store";
import { changeTab } from "../../store-slices/activeTabs";
import {
  modifyTransferring,
} from "../../store-slices/allFilesSlice";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo, NavItemProps, SocketMessage, Transfer } from "../../types";
import { determineFilesEqual } from "../../utils/file-utils";
import Button from "../reusable-components/Button";

const scannerConfig = {
  fps: 10,
  qrbox: { width: 100, height: 100 },
  rememberLastUsedCamera: true,
};

const NavItem = ({
  icon,
  title,
  active,
}: NavItemProps) => {
  const { activeTab } = useSelector((state: RootState) => state.activeTab);
  const listStyles = (isActive: boolean) =>
    `md:w-full transition-all duration-200 h-max cursor-pointer p-3 w-max rounded-full md:rounded-md ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) hover:bg-(--main-primary-light) border-2 border-(--main-primary)" : "hover:bg-(--main-tertiary-light)"} text-lg font-medium`;
  const dispatch = useDispatch();
  return (
    <li
      onClick={() => dispatch(changeTab(active))}
      className={listStyles(activeTab === active)}
    >
      <span className="flex items-center justify-center md:hidden">{icon}</span>
      <span className="hidden md:flex md:justify-start items-center gap-2 w-full">
        <span>{icon}</span> <span>{title}</span>
      </span>
    </li>
  );
};

const AppNavigation = ({ children }: { children: ReactNode }) => {
  const [showQrCode, setShowQrCode] = useState({ active: false, codeVal: "" });
  const [showScanner, setShowScanner] = useState({
    active: false,
    codeVal: "",
  });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { count, isConnected, selected, connectionInfo, transferring } =
    useSelector((state: RootState) => ({
      ...state.connection,
      ...state.allFiles,
    }));

  const { socket, setConnect } = useWebsocket();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        scannerConfig,
        false,
      );
    }

    const handleScanSuccess = (res: string) => {
      try {
        const info = JSON.parse(res) as ConnectionInfo;
        setConnect(true);
        socket.current?.send(
          JSON.stringify({ type: "NewConnection", payload: info.session_id }),
        );
        dispatch(
          setConnection({
            connectionInfo: info,
            count: 1,
            isConnected: socket.current ? true : false,
            role: "reciever",
          }),
        );
      } catch (err) {
        console.log(err);
      }
    };

    scannerRef.current.render(handleScanSuccess, (err) => {
      console.log(err);
    });

    return () => {
      scannerRef.current?.clear().catch((err) => console.log(err));
    };
  }, [showScanner.active]);

  const startServer = async () => {
    try {
      const info = await invoke<ConnectionInfo>("create_conn_server");
      setConnect(true);
      setShowQrCode({ active: true, codeVal: JSON.stringify(info) });
      if (socket.current)
        socket.current.onmessage = (e: MessageEvent<SocketMessage>) => {
          const data = e.data;
          switch (data.type) {
            case "NewConnection":
              dispatch(
                setConnection({
                  connectionInfo: connectionInfo,
                  count: count + 1,
                  isConnected: true,
                  role: "sender",
                }),
              );
              break;
            case "Progress":
              const temp = transferring;
              const newTransfer = e.data.payload as Transfer;
              const alreadyExists = temp.find((file) =>
                determineFilesEqual(file, newTransfer),
              );
              if (newTransfer.current >= newTransfer.total)
                temp.filter((file) => determineFilesEqual(file, newTransfer));
              if (alreadyExists)
                temp.map((file) =>
                  determineFilesEqual(file, newTransfer)
                    ? { ...file, current: newTransfer.current }
                    : file,
                );
              dispatch(modifyTransferring(temp));
              break;
            default:
              break;
          }
        };
    } catch (err) {
      console.log(err);
    }
  };

  const stopServer = async () => {
    try {
      const info = await invoke("disconnect_server");
      console.log(info);
      setShowQrCode({ active: false, codeVal: "" });
      dispatch(
        setConnection({
          count: 0,
          isConnected: false,
          role: "sender",
          connectionInfo: { ip_address: "", port: "", session_id: "" },
        }),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const openScanner = () => {
    setShowScanner({ active: true, codeVal: "" });
  };

  const closeScanner = () => {
    setShowScanner({ active: false, codeVal: "" });
  };

  const { sendFile } = useSendFiles();

  const sendSelected = async () => {
    await Promise.all(
      selected.map((file) => {
        sendFile(file, file.type);
      }),
    );
  };

  return (
    <>
      {showScanner.active && (
        <div className="backdrop-blur-lg bg-[rgb(255,255,255,0.3)] relative">
          <HiX
            onClick={closeScanner}
            className="text-2xl z-9999 absolute top-3 right-6"
          />
          <div id="reader"></div>
        </div>
      )}
      <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] md:grid md:grid-cols-[25%_75%] w-full">
        {showQrCode.active && (
          <div className="w-screen h-screen top-0 left-0 fixed z-999 flex justify-center items-center backdrop-blur-lg bg-[rgb(255,255,255,0.3)]">
            <HiX
              onClick={stopServer}
              className="text-xl fixed top-15 right-13"
            />
            <QrCode
              size={256}
              style={{ height: "auto", maxWidth: "50%", width: "100%" }}
              value={showQrCode.codeVal}
              viewBox={`0 0 256 256`}
            />
          </div>
        )}

        <nav className="md:h-full w-full z-15 fixed md:sticky flex flex-col gap-2 items-center justify-center bottom-3 left-0">
          <div className="md:hidden flex w-full gap-2 px-3 items-center">
            {isConnected ? (
              <Button attrs={{ onClick: sendSelected }} width="w-full">
                Send {selected.length > 0 && ` ${selected.length}`}
              </Button>
            ) : (
              <>
                <Button
                  attrs={{ onClick: startServer, disabled: showScanner.active }}
                  className="flex-1"
                  width=""
                >
                  Send
                </Button>
                <Button
                  attrs={{
                    disabled: showQrCode.active,
                    onClick: openScanner,
                  }}
                  className="flex-1"
                  width=""
                >
                  Receive
                </Button>
              </>
            )}
          </div>
          <ul className="space-y-3 md:h-full md:w-full w-[90%] mx-auto px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none flex justify-between items-center md:flex-col md:items-left md:justify-start gap-2">
            <NavItem icon={<FaMusic />} active="audio" title="Audio" />
            <NavItem icon={<FaVideo />} active="video" title="Video" />
            <NavItem icon={<FaImage />} active="images" title="Image" />
            <NavItem icon={<FaFile />} active="document" title="Document" />
          </ul>
        </nav>
        <main className="px-4 h-full w-full overflow-y-auto overflow-x-hidden pb-13 md:pb-4">
          {children}
          <div className="hidden fixed right-0 bottom-9 md:flex justify-center items-center w-[75%]">
            <div className="flex w-full items-center gap-3 max-w-160">
              {isConnected ? (
                <Button attrs={{ onClick: sendSelected }} width="w-full">
                  Send {selected.length > 0 && ` ${selected.length}`}
                </Button>
              ) : (
                <>
                  <Button
                    attrs={{
                      onClick: startServer,
                      disabled: showScanner.active,
                    }}
                    className="flex-1"
                    width=""
                  >
                    Send
                  </Button>
                  <Button
                    attrs={{
                      disabled: showQrCode.active,
                      onClick: openScanner,
                    }}
                    className="flex-1"
                    width=""
                  >
                    Receive
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AppNavigation;
