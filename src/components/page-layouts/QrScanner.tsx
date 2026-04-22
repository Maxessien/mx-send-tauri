import { Html5Qrcode } from "html5-qrcode";
import { ChangeEvent, useEffect, useRef } from "react";
import { HiX } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo } from "../../types";


const getWidth = (width: number) => {
  return Math.min(300, Math.floor(width * 0.75));
};

const QrScanner = ({ closeScanner }: { closeScanner: () => void }) => {
  const dispatch = useDispatch();
  const { width } = useSelector((state: RootState) => state.windowSize);

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
      closeScanner();
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

  const scannerRef = useRef<Html5Qrcode>(null)

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner

    const initScanner = async () => {
      try {
        const boxSize = getWidth(width);
        const config = {
          fps: 10,
          qrbox: { width: boxSize, height: boxSize },
          rememberLastUsedCamera: true,
        };
        const camera = await Html5Qrcode.getCameras();
        if (!isMounted) return;
        
        const backCamera = camera.find(({ label }) => label.toLowerCase().includes("back"));
        const id = backCamera ? backCamera.id : camera?.[0].id;

        console.log(id)
        
        await scanner.start(id, config, handleScanSuccess, () => null)
      } catch (err) {
        console.log(err);
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(console.log);
      }
      scannerRef.current = null
    };
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement, HTMLInputElement>)=>{
    if (!scannerRef.current) return
    const files = e.target.files
    if (!files || files.length <= 0) return

    await scannerRef.current.stop().catch(console.log)
    await scannerRef.current.scanFile(files?.[0], false)
  }

  return (
    <div className="fixed inset-0 z-9999 flex flex-col gap-2 items-center justify-center w-full h-full backdrop-blur-lg bg-[rgb(255,255,255,0.3)]">
      <HiX
        onClick={closeScanner}
        className="text-4xl cursor-pointer absolute top-6 right-6 z-10000"
      />
      <div id="reader" className="w-full max-w-100"></div>
      <label className="text-lg font-medium cursor-pointer text-shadow-black text-shadow-sm" htmlFor="qrcode-image">
        <span>Scan an image file</span>
        <input onChange={handleImageUpload} className="hidden" type="file" id="qrcode-image" />
      </label>
    </div>
  );
};

export default QrScanner;
