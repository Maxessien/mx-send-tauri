import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { FaConnectdevelop } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import useSendFiles from "../../hooks/useSendFiles";
import { RootState } from "../../store";
import { removeSelected } from "../../store-slices/allFilesSlice";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo } from "../../types";
import Button from "../reusable-components/Button";
import { ScannerState } from "./AppWrapper";

const ActionBtns = ({
  showQrCode,
  showScanner,
  openScanner,
  setQrCode,
  serverStarted,
  setServerStarted,
}: {
  showScanner: ScannerState;
  showQrCode: ScannerState;
  openScanner: () => void;
  setQrCode: (state: ScannerState) => void;
  serverStarted: boolean;
  setServerStarted: () => void;
}) => {
  const { isConnected, socket } = useSelector(
    (state: RootState) => state.connection,
  );
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const [sending, setSending] = useState(false);

  const dispatch = useDispatch();

  const { sendFile } = useSendFiles();

  const sendSelected = async () => {
    try {
      setSending(true);
      selected.forEach((s) => {
        dispatch(removeSelected(s));
      });
      await Promise.all(
        selected.map((file) => {
          sendFile(file, file.type);
        }),
      );
    } catch (err) {
      console.log(err);
      toast.error("Couldn't send files");
    } finally {
      setSending(false);
    }
  };

  const startServer = async () => {
    try {
      const info = await invoke<ConnectionInfo>("create_conn_server");
      dispatch(
        setConnection({
          connectionInfo: info,
          count: 1,
          isConnected: false,
          role: "sender",
          socket,
        }),
      );
      setServerStarted();
      setQrCode({ active: true, codeVal: JSON.stringify(info) });
    } catch (err) {
      console.log(err);
      toast.error(
        "Failed to start server, make sure you have an active IP address",
      );
    }
  };

  return (
    <div>
      {serverStarted && <div className="w-full flex justify-start mb-2">
        <Button
          attrs={{ onClick: ()=>setQrCode({active: true, codeVal: showQrCode.codeVal}) }}
          usePredefinedSize={false}
          className="p-5 text-lg"
        >
          <FaConnectdevelop />
        </Button>
      </div>}
      <div className="flex w-full gap-2 px-3 items-center">
        {isConnected ? (
          <Button
            attrs={{ onClick: sendSelected, disabled: sending }}
            width="w-full"
          >
            Send {selected.length > 0 && ` ${selected.length}`}
          </Button>
        ) : (
          <>
            <Button
              attrs={{
                onClick: startServer,
                disabled:
                  showScanner.active || showQrCode.active || serverStarted,
              }}
              className="flex-1"
              width=""
            >
              Send
            </Button>
            <Button
              attrs={{
                disabled: showQrCode.active || showScanner.active,
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
  );
};

export default ActionBtns;
