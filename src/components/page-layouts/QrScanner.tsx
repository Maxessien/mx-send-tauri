import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { HiX } from "react-icons/hi";
import { useDispatch } from "react-redux";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo } from "../../types";

const scannerConfig = {
  fps: 10,
  qrbox: { width: 100, height: 100 },
  rememberLastUsedCamera: true,
};

const QrScanner = ({ closeScanner }: { closeScanner: () => void }) => {
  const dispatch = useDispatch();

  const handleScanSuccess = (res: string) => {
    try {
      const info = JSON.parse(res) as ConnectionInfo;
      dispatch(
        setConnection({
          connectionInfo: info,
          count: 1,
          isConnected: true,
          role: "receiver",
        }),
      );
      closeScanner()
    } catch (err) {
      console.log(err);
      dispatch(
        setConnection({
          connectionInfo: { ip_address: "", port: "", session_id: "" },
          count: 0,
          isConnected: false,
          role: "receiver",
        }),
      );
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
