import { invoke } from "@tauri-apps/api/core";
import { useDispatch, useSelector } from "react-redux";
import useSendFiles from "../../hooks/useSendFiles";
import { RootState } from "../../store";
import { setConnection } from "../../store-slices/connectionSlice";
import { ConnectionInfo } from "../../types";
import Button from "../reusable-components/Button";
import { ScannerState } from "./AppWrapper";
import { useState } from "react";
import { toast } from "react-toastify";
import { removeSelected, updateTransferProgress } from "../../store-slices/allFilesSlice";

const ActionBtns = ({
  showQrCode,
  showScanner,
  openScanner,
  setQrCode,
}: {
  showScanner: ScannerState;
  showQrCode: ScannerState;
  openScanner: () => void;
  setQrCode: (state: ScannerState) => void;
}) => {
  const isConnected = useSelector(
    (state: RootState) => state.connection.isConnected,
  );
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const [sending, setSending] = useState(false);

  const dispatch = useDispatch();

  const { sendFile } = useSendFiles();

  const sendSelected = async () => {
    try {
      setSending(true);
      selected.forEach((s) => {
        dispatch(removeSelected(s))
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
        }),
      );
      setQrCode({ active: true, codeVal: JSON.stringify(info) });
    } catch (err) {
      console.log(err);
      toast.error("Failed to start server, make sure you have an active IP address")
    }
  };

  return (
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
              disabled: showScanner.active || showQrCode.active,
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
  );
};

export default ActionBtns;
