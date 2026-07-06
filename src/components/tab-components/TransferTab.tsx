import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { RootState } from "../../store";
import { Transfer } from "../../types";
import {
  capitalise,
  FILE_PREVIEW_IMAGES,
  formatFileSize,
} from "../../utils/file-utils";

export const TransferTabItem = ({
  file,
}: {
  file: Omit<Transfer, "current" | "total" | "sender_id" | "last_modified">;
}) => {
  const { file_name, file_size, type, file_type } = file;
  return (
    <div className="flex w-full gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
      <div className="sm:w-15 sm:min-w-15 w-8 aspect-square rounded-md overflow-hidden">
        <img
          className="object-cover object-center w-full h-full"
          src={
            file_type
              ? FILE_PREVIEW_IMAGES?.[file_type]
              : FILE_PREVIEW_IMAGES?.[type]
          }
          alt={`${file_type || type || "file"} preview icon`}
        />
      </div>
      <div className="space-y-2 min-w-20 flex-1">
        <p className="sm:text-base text-sm line-clamp-2 font-medium text-left">
          {file_name}
        </p>
        <p className="text-sm line-clamp-2 font-medium text-left">
          {formatFileSize(file_size)}
        </p>
      </div>
    </div>
  );
};

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
  const navigate = useNavigate();
  return (
    <section className="w-full space-y-3">
      <p className="w-full flex justify-start items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-lg font-medium flex cursor-pointer justify-center items-center"
        >
          <span className="mr-2">
            <FaArrowLeft />
          </span>{" "}
          Back
        </button>
      </p>
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
            .map((file) => {
              const { file_name, file_path, current, total, is_cancelled } =
                file;
              return (
                <div
                  key={file_name + file_path}
                  className="relative w-full rounded-md"
                >
                  <TransferTabItem file={file} />
                  {is_cancelled && (
                    <div className="w-full h-full flex justify-center items-center backdrop-blur-lg">
                      <p className="text-red-700 font-medium text-2xl">
                        Cancelled
                      </p>
                    </div>
                  )}
                  <div
                    style={{
                      width: `${current >= total ? "100" : (current / total) * 100}%`,
                    }}
                    className="absolute bg-[rgb(30,58,138,0.3)] h-full top-0 left-0"
                  ></div>
                </div>
              );
            })
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
