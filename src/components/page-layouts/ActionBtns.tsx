import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import Button from "../reusable-components/Button";
import { ScannerState } from "./AppWrapper";
import useSendFiles from "../../hooks/useSendFiles";
import { invoke } from "@tauri-apps/api/core";
import { ConnectionInfo } from "../../types";
import { setConnection } from "../../store-slices/connectionSlice";

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
  const { isConnected, selected } = useSelector((state: RootState) => ({
    ...state.connection,
    ...state.allFiles,
  }));

  const dispatch = useDispatch();

  const { sendFile } = useSendFiles();

  const sendSelected = async () => {
    await Promise.all(
      selected.map((file) => {
        sendFile(file, file.type);
      }),
    );
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
    }
  };

  return (
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
  );
};

export default ActionBtns;
