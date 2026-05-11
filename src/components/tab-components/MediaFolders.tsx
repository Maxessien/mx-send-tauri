import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import {
  audioDir,
  downloadDir,
  pictureDir,
  videoDir,
} from "@tauri-apps/api/path";
import {} from "@tauri-apps/plugin-fs";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { setSettings } from "../../store-slices/settingsSlice";
import { FolderRes } from "../../types";

const getFolders = async (dir: string | null) => {
  try {
    const folders = await invoke<FolderRes[]>("list_folders", {
      dir: dir && dir.trim().length > 0 ? dir : undefined,
    });
    return folders;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const getPathSafe = async (fn: () => Promise<string>) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

const getDefaultDirs = async () => {
  const dirs = await Promise.all([
    getPathSafe(downloadDir),
    getPathSafe(pictureDir),
    getPathSafe(videoDir),
    getPathSafe(audioDir),
  ]);

  return [
    ...dirs.filter((dir): dir is string => dir !== null),
    "/storage/emulated/0/Download",
    "/storage/emulated/0/Movies",
    "/storage/emulated/0/Pictures",
    "/storage/emulated/0/Music",
  ];
};

const MediaFolders = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const settings = useSelector((state: RootState) => state.settings);
  const { extraTraversalPaths } = settings;
  const dispatch = useDispatch();
  const [defaultDirs, setDefaultDirs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const dirs = await getDefaultDirs();
        setDefaultDirs(dirs);
      } catch (err) {
        console.error("Failed to fetch default directories:", err);
      }
    })();
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: [searchParams.get("path")],
    queryFn: ({ queryKey }) => getFolders(queryKey[0]),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const setTrPaths = (paths: string[]) => {
    dispatch(setSettings({ ...settings, extraTraversalPaths: paths }));
  };

  const deselectParent = () => {
    const parent = searchParams.get("path");
    if (!parent || !data || !extraTraversalPaths.includes(parent)) return;
    const childDeselected = data.some(({ path }) =>
      extraTraversalPaths.includes(path),
    );
    if (childDeselected)
      setTrPaths(extraTraversalPaths.filter((p) => p !== parent));
  };

  const handleSelection = (path: string) => {
    if (!data || defaultDirs.includes(path)) return;
    const parent = searchParams.get("path");
    if (!parent) return;
    const parentSelected = extraTraversalPaths.includes(parent);
    const isSelected = extraTraversalPaths.includes(path) || parentSelected;
    if (isSelected) {
      if (parentSelected)
        setTrPaths([
          ...extraTraversalPaths,
          ...data.filter((p) => p.path !== path).map(({ path }) => path),
        ]);
      else
        setTrPaths(
          data
            .filter(
              (p) => p.path !== path && extraTraversalPaths.includes(p.path),
            )
            .map(({ path }) => path),
        );
      deselectParent();
    } else {
      const allChildrenPaths = data.map((p) => p.path);
      const allChildrenSelected = data
        .filter((p) => p.path !== path)
        .every(({ path }) => extraTraversalPaths.includes(path));
      if (allChildrenSelected)
        setTrPaths([
          ...extraTraversalPaths.filter((p) => !allChildrenPaths.includes(p)),
          parent,
        ] as string[]);
      else setTrPaths([...extraTraversalPaths, path]);
    }
  };

  return (
    <div className="space-y-2">
      {isFetching ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : data && data?.length > 0 ? (
        <ul className="space-y-1">
          {data.map(({ folder_name, path }) => {
            const parent = searchParams.get("path");
            const selected =
              extraTraversalPaths.includes(path) ||
              (parent && extraTraversalPaths.includes(parent)) ||
              defaultDirs.includes(path)
            return (
              <li
                key={path}
                className="flex items-center justify-between px-3 py-2 rounded-md"
                style={{
                  background: "var(--main-tertiary)",
                  border: "1px solid var(--main-tertiary-light)",
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    aria-pressed={selected}
                    aria-label={selected ? "Deselect folder" : "Select folder"}
                    onClick={() => handleSelection(path)}
                    className="flex items-center w-9 h-9 justify-center rounded-md"
                    disabled={defaultDirs.includes(path)}
                  >
                    {selected && (
                      <span className="w-full h-full bg-(--main-primary) rounded-md" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (defaultDirs.includes(path)) {
                        toast.error("Cannot view protected locations");
                        return;
                      }
                      setSearchParams({ path });
                    }}
                    className="text-left"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    disabled={defaultDirs.includes(path)}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {folder_name}
                    </p>
                    <small
                      style={{
                        color: "var(--text-secondary)",
                        display: "block",
                      }}
                    >
                      {path}
                    </small>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>No folders found</p>
      )}
    </div>
  );
};

export default MediaFolders;
