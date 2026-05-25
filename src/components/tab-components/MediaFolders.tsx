import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import {
  audioDir,
  downloadDir,
  pictureDir,
  videoDir,
} from "@tauri-apps/api/path";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { setSettings } from "../../store-slices/settingsSlice";
import { DirList } from "../../types";
import TabLoader from "./TabLoader";

const getFolders = async (dir: string | null) => {
  try {
    const dirList = await invoke<DirList>("list_dir", {
      dir: dir && dir.trim().length > 0 ? dir : undefined,
    });
    return dirList.folders;
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
    staleTime: 60 * 60 * 1000
  });

  const setTrPaths = (paths: string[]) => {
    dispatch(setSettings({ ...settings, extraTraversalPaths: paths }));
  };

  const handleSelection = (path: string) => {
    if (!data || defaultDirs.includes(path)) return;
    const parent = searchParams.get("path");
    if (!parent) {
      // If no parent it is in the home dir
      !extraTraversalPaths.includes(path)
        ? setTrPaths([...extraTraversalPaths, path])
        : setTrPaths(extraTraversalPaths.filter((p) => p !== path));
      return;
    }
    const parentSelected = extraTraversalPaths.includes(parent);
    const isSelected = extraTraversalPaths.includes(path) || parentSelected;
    if (isSelected) {
      if (parentSelected) {
        setTrPaths([
          ...extraTraversalPaths.filter((p) => p !== parent),
          ...data.filter((p) => p.path !== path).map(({ path }) => path),
        ]);
      } else
        setTrPaths(
          data
            .filter(
              (p) => p.path !== path && extraTraversalPaths.includes(p.path),
            )
            .map(({ path }) => path),
        );
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

  const navigate = useNavigate();

  return (
    <div className="space-y-2">
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
      <TabLoader isLoading={isFetching}>
        {data && data?.length > 0 ? (
          <ul className="space-y-1">
            {[...data].sort((a, b) => a.folder_name.localeCompare(b.folder_name)).map(({ folder_name, path }) => {              const parent = searchParams.get("path");
              const selected =
                extraTraversalPaths.includes(path) ||
                (parent && extraTraversalPaths.includes(parent)) ||
                defaultDirs.includes(path);

              return (
                <li
                  key={path}
                  className="flex items-center justify-between px-3 py-2 rounded-md"
                  style={{
                    background: "var(--main-tertiary)",
                    border: "1px solid var(--main-tertiary-light)",
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <button
                      aria-pressed={selected}
                      aria-label={
                        selected ? "Deselect folder" : "Select folder"
                      }
                      onClick={() => handleSelection(path)}
                      className={`flex border-2 cursor-pointer border-(--text-primary) items-center w-6 h-6 justify-center rounded-full`}
                      disabled={defaultDirs.includes(path)}
                    >
                      {selected && (
                        <span className="w-full h-full bg-(--main-primary) rounded-full" />
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
                      className="text-left cursor-pointer flex-1 px-3 py-2 transition-all rounded-[0px_6px_6px_0px] hover:bg-(--main-tertiary-light)"
                      disabled={defaultDirs.includes(path)}
                    >
                      <p className="m-0 font-medium">{folder_name}</p>
                      <small className="block">{path}</small>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-(--text-secondary) text-center text-xl font-semibold">No folders found</p>
        )}
      </TabLoader>
    </div>
  );
};

export default MediaFolders;
