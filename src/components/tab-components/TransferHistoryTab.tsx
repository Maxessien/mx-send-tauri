import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { MergedHistory } from "../../types";
import { sortTransferred } from "../../utils/file-utils";
import { TransferTabItem } from "./TransferTab";

const TransferHistoryTab = () => {
  const { transferred } = useSelector((state: RootState) => state.allFiles);
  const [historyActiveTab, setHistoryActiveTab] = useState<"sent" | "received">(
    "received",
  );
  console.log(transferred)
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
      setSorted((state) => ({ ...state, merged: m }));
    })();
  }, [sorted.raw]);

  useEffect(() => {
    (() => {
      setSorted((state) => ({ ...state, raw: sortTransferred(transferred) }));
    })();
  }, [transferred]);


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
          return (
            files.filter(({ isReceived }) =>
                    historyActiveTab === "received" ? isReceived : !isReceived,
                  ).length > 0 ? <div key={date} className="space-y-2">
              <h3 className="w-full text-center font-medium text-xl">{date}</h3>
              <div className="space-y-1.5">
                {files
                  .filter(({ isReceived }) =>
                    historyActiveTab === "received" ? isReceived : !isReceived,
                  )
                  .map((f) => {
                    return <TransferTabItem file={f} />;
                  })}
              </div>
            </div> : <></>
          );
        })}
      </div>
    </section>
  );
};

export default TransferHistoryTab;
