import { HiX } from "react-icons/hi";
import QrCode from "react-qr-code";

const QrCodeDisplay = ({
  qrcodeVal,
  stopServer,
}: {
  stopServer: () => void;
  qrcodeVal: string;
}) => {
  return (
    <div className="w-screen h-screen top-0 left-0 fixed z-999 flex justify-center items-center backdrop-blur-lg bg-[rgb(255,255,255,0.3)]">
      <HiX onClick={stopServer} className="text-xl fixed top-15 right-13" />
      <QrCode
        size={256}
        style={{ height: "auto", maxWidth: "50%", width: "100%" }}
        value={qrcodeVal}
        viewBox={`0 0 256 256`}
      />
    </div>
  );
};

export default QrCodeDisplay;
