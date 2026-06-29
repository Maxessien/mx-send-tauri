import { useDispatch, useSelector } from "react-redux";
import { FileRes } from "../types";
import { addSelected, removeSelected } from "../store-slices/allFilesSlice";
import { RootState } from "../store";

export const useSelectFile = ()=>{
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const dispatch = useDispatch();

  const handleSelection = (fileRes: FileRes) => {
    const isSelected = selected.find(
      ({ file_name, file_path }) =>
        fileRes.file_name === file_name && fileRes.file_path === file_path,
    );
    isSelected
      ? dispatch(removeSelected(fileRes))
      : dispatch(addSelected(fileRes));
  };

  return {handleSelection}
}