import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { FileResType, MergedHistory } from "../../types";
import {
  FILE_PREVIEW_IMAGES,
  formatFileSize,
  sortTransferred,
} from "../../utils/file-utils";
import Button from "../reusable-components/Button";
import { openPath } from "@tauri-apps/plugin-opener";
import { toast } from "react-toastify";
import { invoke } from "@tauri-apps/api/core";

const TransferHistoryTab = () => {
  const { transferred } = useSelector((state: RootState) => state.allFiles);
  const [historyActiveTab, setHistoryActiveTab] = useState<"sent" | "received">(
    "received",
  );
  const [sorted, setSorted] = useState<{
    raw: { [key: string]: MergedHistory };
    merged: MergedHistory[];
  }>({ raw: sortTransferred(transferred), merged: [] });

  useEffect(() => {
    (() => {
      const m: MergedHistory[] = [];
      for (let info in sorted.raw) {
        m.push(sorted.raw[info]);
      }
      m.reverse();
      setSorted((state) => ({ ...state, merged: m }));
    })();
  }, [sorted.raw]);

  useEffect(() => {
    (() => {
      setSorted((state) => ({ ...state, raw: sortTransferred(transferred) }));
    })();
  }, [transferred]);

  const openFile = async (fileName: string, fileType: FileResType) => {
    try {
      const path = await invoke<string>("get_transfer_path", {
        fileName,
        fileType: fileType.slice(0, 1).toUpperCase() + fileType.slice(1),
      });
      await openPath(path);
    } catch (err) {
      console.log(err);
      toast.error("Unable to open file");
    }
  };

  return (
    <section className="w-full space-y-3">
      <h2 className="w-full text-left font-semibold text-2xl">History</h2>
      <div className="w-full flex gap-1">
        <button
          onClick={() => setHistoryActiveTab("received")}
          className={`flex-1 inline-flex justify-center items-center hover:bg-(--main-tertiary) text-xl font-medium px-3 py-2 ${historyActiveTab === "received" ? "border-b-2 border-b-(--main-primary)" : ""}`}
        >
          Received
        </button>
        <button
          onClick={() => setHistoryActiveTab("sent")}
          className={`flex-1 inline-flex justify-center items-center hover:bg-(--main-tertiary) text-xl font-medium px-3 py-2 ${historyActiveTab === "sent" ? "border-b-2 border-b-(--main-primary)" : ""}`}
        >
          Sent
        </button>
      </div>

      <div className="space-y-2.6">
        {sorted.merged.map(({ date, files }) => {
          return files.filter(({ isReceived }) =>
            historyActiveTab === "received" ? isReceived : !isReceived,
          ).length > 0 ? (
            <div key={date} className="space-y-2">
              <h3 className="w-full text-center font-medium text-xl">{date}</h3>
              <div className="space-y-1.5">
                {files
                  .filter(({ isReceived }) =>
                    historyActiveTab === "received" ? isReceived : !isReceived,
                  )
                  .map((f) => {
                    const { file_name, file_size, type } = f;
                    return (
                      <div className="flex relative w-full gap-2 sm:gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
                        <div className="sm:w-15 sm:min-w-15 w-8 aspect-square rounded-md overflow-hidden">
                          <img
                            className="object-cover object-center w-full h-full"
                            src={FILE_PREVIEW_IMAGES?.[type]}
                            alt="Image"
                          />
                        </div>
                        <div className="space-y-2 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-200px)]  flex-1">
                          <p className="sm:text-base text-sm w-full line-clamp-2 wrap-break-word font-medium text-left">
                            {file_name}
                          </p>
                          <p className="text-sm line-clamp-2 wrap-break-word font-medium text-left">
                            {formatFileSize(file_size)}
                          </p>
                        </div>
                        <Button
                          size="small"
                          rounded="rounded-md"
                          attrs={{ onClick: () => openFile(file_name, type) }}
                        >
                          Open
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <></>
          );
        })}
      </div>
    </section>
  );
};

export default TransferHistoryTab;
