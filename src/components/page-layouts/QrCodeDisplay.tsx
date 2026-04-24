import { HiX } from "react-icons/hi";
import QrCode from "react-qr-code";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import Button from "../reusable-components/Button";

const QrCodeDisplay = ({
  qrcodeVal,
  stopServer,
  closeDisplay
}: {
  stopServer: () => void;
  qrcodeVal: string;
  closeDisplay: ()=> void
}) => {
  const {count, isConnected} = useSelector((state: RootState)=> state.connection)
  return (
    <div className="w-screen h-screen flex-col top-0 left-0 fixed z-999 flex justify-center items-center backdrop-blur-lg bg-[rgb(255,255,255,0.3)]">
      <Button attrs={{onClick: closeDisplay}} usePredefinedSize={false} className="text-xl fixed p-2 top-3 right-3">
        <HiX/>
      </Button>
      <QrCode
        size={256}
        style={{ height: "auto", maxWidth: "560px" }}
        value={qrcodeVal}
        viewBox={`0 0 256 256`}
        className="sm:w-2/5 w-4/5"
      />
      <div className="sm:w-1/2 w-4/5 mt-4 space-y-2">
        <p className="w-full text-center text-lg font-semibold">Connected :{isConnected ? ` ${count}` : " 0"}</p>
        <Button attrs={{onClick: stopServer}} width="w-full">Disconnect Server</Button>
      </div>
    </div>
  );
};

export default QrCodeDisplay;
