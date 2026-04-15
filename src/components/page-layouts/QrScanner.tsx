import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { HiX } from "react-icons/hi";
import { useDispatch } from "react-redux";
import useWebsocket from "../../hooks/useWebsocket";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo, SocketMessage } from "../../types";
import { useReceiver } from "../../hooks/useGetFiles";

const scannerConfig = {
  fps: 10,
  qrbox: { width: 100, height: 100 },
  rememberLastUsedCamera: true,
};

const QrScanner = ({ closeScanner }: { closeScanner: () => void }) => {
  const { setConnect, socket } = useWebsocket();
  const dispatch = useDispatch();
  const { downloadVideo } = useReceiver();

  const handleScanSuccess = (res: string) => {
    try {
      const info = JSON.parse(res) as ConnectionInfo;
      setConnect(true);
      socket.current?.send(
        JSON.stringify({ type: "NewConnection", payload: info.session_id }),
      );
      if (socket.current)
        socket.current.onmessage = (e: MessageEvent<string>) => {
          const data = JSON.parse(e.data) as SocketMessage;
          if (data.type === "NewFile" && typeof data.payload === "string")
            downloadVideo(data.payload);
        };
      dispatch(
        setConnection({
          connectionInfo: info,
          count: 1,
          isConnected: socket.current ? true : false,
          role: "receiver",
        }),
      );
    } catch (err) {
      console.log(err);
      setConnect(false)
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", scannerConfig, false);
    scanner.render(handleScanSuccess, (err) => {
      console.log(err);
    });

    return () => {
      scanner.clear();
    };
  }, []);

  return (
    <div className="backdrop-blur-lg bg-[rgb(255,255,255,0.3)] relative">
      <HiX
        onClick={closeScanner}
        className="text-2xl z-9999 absolute top-3 right-6"
      />
      <div id="reader"></div>
    </div>
  );
};

export default QrScanner;
