import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  capitalise,
  FILE_PREVIEW_IMAGES,
  formatFileSize,
} from "../../utils/file-utils";

const TransferTab = () => {
  const transferring = useSelector(
    (state: RootState) => state.allFiles.transferring,
  );
  const appSessionId = useSelector((state: RootState) => state.appSession);
  const [activeTransferTab, setActiveTransferTab] = useState<
    "sending" | "receiving"
  >("receiving");

  const tabFilter = (fileSessId: string) => {
    return activeTransferTab === "sending"
      ? fileSessId === appSessionId
      : fileSessId !== appSessionId;
  };
  return (
    <section className="w-full space-y-3">
      <h2 className="w-full text-left font-semibold text-2xl">Transfers</h2>
      <div className="w-full flex gap-1">
        <button
          onClick={() => setActiveTransferTab("sending")}
          className={`flex-1 inline-flex justify-center items-center hover:bg-(--main-tertiary) text-xl font-medium px-3 py-2 ${activeTransferTab === "sending" ? "border-b-2 border-b-(--main-primary)" : ""}`}
        >
          Sending
        </button>
        <button
          onClick={() => setActiveTransferTab("receiving")}
          className={`flex-1 inline-flex justify-center items-center hover:bg-(--main-tertiary) text-xl font-medium px-3 py-2 ${activeTransferTab === "receiving" ? "border-b-2 border-b-(--main-primary)" : ""}`}
        >
          Receiving
        </button>
      </div>
      <div className="w-full space-y-2">
        {transferring.filter(({ sender_id }) => tabFilter(sender_id)).length >
        0 ? (
          transferring
            .filter(({ sender_id }) => tabFilter(sender_id))
            .map(
              ({
                file_name,
                file_path,
                file_type,
                file_size,
                type,
                current,
                total,
              }) => {
                return (
                  <div
                    key={file_name + file_path}
                    className="relative w-full rounded-md"
                  >
                    <div className="flex relative w-full gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
                      <div className="sm:w-15 sm:min-w-15 w-8 aspect-square rounded-md overflow-hidden">
                        <img
                          className="object-cover object-center w-full h-full"
                          src={
                            file_type
                              ? FILE_PREVIEW_IMAGES?.[file_type]
                              : FILE_PREVIEW_IMAGES?.[type]
                          }
                          alt="Image"
                        />
                      </div>
                      <div className="space-y-2 min-w-20 flex-1">
                        <p className="sm:text-base text-sm wrap-break-word font-medium text-left">
                          {file_name}
                        </p>
                        <p className="text-sm wrap-break-word font-medium text-left">
                          {formatFileSize(file_size)}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        width: `${current >= total ? "100" : (current / total) * 100}%`,
                      }}
                      className="absolute bg-[rgb(30,58,138,0.3)] h-full top-0 left-0"
                    ></div>
                  </div>
                );
              },
            )
        ) : (
          <p className="w-full text-center font-semibold text-2xl py-4">
            No Files{` ${capitalise(activeTransferTab)}`}
          </p>
        )}
      </div>
    </section>
  );
};

export default TransferTab;
