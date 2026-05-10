import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  ToggleItem,
  WarningPopup,
} from "../reusable-components/SettingsReusable";
import { RootState } from "../../store";
import { setSettings } from "../../store-slices/settingsSlice";
import Button from "../reusable-components/Button";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { addTransferred } from "../../store-slices/allFilesSlice";

const SettingsTab = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const { cacheTraversalResult, keepScreenAwake, saveTransferHistory, theme } =
    settings;

  const [popup, setPopup] = useState({
    show: false,
    acceptFn: () => {},
    message: "",
  });
  return (
    <section className="w-full space-y-3">
      <h2 className="w-full text-left font-semibold text-2xl">Settings</h2>
      <Card>
        <ToggleItem
          title="Save Transfer History"
          subTitle="Keep a log of all your sent and received files"
          value={saveTransferHistory}
          editVal={() =>
            dispatch(
              setSettings({
                ...settings,
                saveTransferHistory: !saveTransferHistory,
              }),
            )
          }
        />
        <ToggleItem
          title="Auto rescan"
          subTitle="Automatically scan for files instead of using cached results"
          value={!cacheTraversalResult}
          editVal={() =>
            dispatch(
              setSettings({
                ...settings,
                cacheTraversalResult: !cacheTraversalResult,
              }),
            )
          }
        />
        <Card extraClassNames="space-y-2">
          <p className="text-base md:text-lg font-medium">Theme</p>
          <div className="flex overflow-hidden w-full rounded-md border-2 border-(--text-secondary)">
            <button
              onClick={() =>
                dispatch(setSettings({ ...settings, theme: "dark" }))
              }
              className={`flex-1 py-2 ${theme === "dark" ? "bg-(--main-primary)" : "hover:bg-(--main-tertiary)"}`}
            >
              Dark
            </button>
            <button
              onClick={() =>
                dispatch(setSettings({ ...settings, theme: "light" }))
              }
              className={`flex-1 py-2 ${theme === "light" ? "bg-(--main-primary)" : "hover:bg-(--main-tertiary)"}`}
            >
              Light
            </button>
            <button
              onClick={() =>
                dispatch(setSettings({ ...settings, theme: "system" }))
              }
              className={`flex-1 py-2 ${theme === "system" ? "bg-(--main-primary)" : "hover:bg-(--main-tertiary)"}`}
            >
              System
            </button>
          </div>
        </Card>
        <ToggleItem
          title="Keep Screen Awake"
          subTitle="Prevent your display from sleeping while the app is active"
          value={keepScreenAwake}
          editVal={() =>
            dispatch(
              setSettings({
                ...settings,
                keepScreenAwake: !keepScreenAwake,
              }),
            )
          }
        />
      </Card>

      {popup.show && (
        <WarningPopup
          acceptFn={popup.acceptFn}
          warnMessage={popup.message}
          closeFn={() => setPopup((state) => ({ ...state, show: false }))}
        />
      )}

      <Button
        attrs={{
          onClick: () => {
            setPopup({
              show: true,
              message: "Are you sure you want to clear history",
              acceptFn: () => {
                dispatch(addTransferred({ files: [], mode: "replace" }));
              },
            });
          },
        }}
        usePredefinedcolor={false}
        className="bg-red-700 text-white hover:bg-red-800"
      >
        <span>
          <FaTrash />
        </span>
        <span>Clear Transfer History</span>
      </Button>
    </section>
  );
};

export default SettingsTab;
