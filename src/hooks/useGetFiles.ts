import { invoke } from "@tauri-apps/api/core";
import {
  addManyFiles,
  FileRes,
  FileResType,
} from "../store-slices/allFilesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { RootState } from "../store";

const useGetFiles = () => {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((state: RootState) => state.activeTab);

  const getFiles = async (type: FileResType) => {
    let rustEnum: "Video" | "Image" | "Audio" | "Document" | null = null;
    switch (type) {
      case "audio":
        rustEnum = "Audio";
        break;
      case "document":
        rustEnum = "Document";
        break;
      case "images":
        rustEnum = "Image";
        break;
      case "video":
        rustEnum = "Video";
        break;
      default:
        break;
    }
    if (!rustEnum?.trim()) return;
    try {
      const files = await invoke<FileRes[]>("list_files", {
        fileType: rustEnum,
      });
      dispatch(addManyFiles({ type, info: files }));
      return files
    } catch (err) {
      console.log(err);
      throw err
    }
  };

  const query = useQuery({
    queryKey: [activeTab],
    queryFn: ({ queryKey }) => getFiles(queryKey?.[0]),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return { getFiles, query };
};

export { useGetFiles };
