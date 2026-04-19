import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../store"
import { addSelected, removeSelected } from "../../store-slices/allFilesSlice"
import { TabListItemProps } from "../../types"
import { FILE_PREVIEW_IMAGES, formatFileSize } from "../../utils/file-utils"


const TabListItem = ({ fileName, filePath, fileSize, previewImgUrl, type }: TabListItemProps) => {
  const selected = useSelector((state: RootState) => state.allFiles.selected);
  const dispatch = useDispatch()

  const handleSelection = ()=>{
    const fileRes = {file_name: fileName, file_path: filePath, file_size: fileSize, type}
    const isSelected = selected.find(({file_name, file_path})=> fileName === file_name && filePath === file_path)
    isSelected ? dispatch(removeSelected(fileRes)) : dispatch(addSelected(fileRes))
  }

  // console.log(type, FILE_PREVIEW_IMAGES)

  return (
    <>
    <div onClick={handleSelection} className="flex relative w-full gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
        <div className="sm:w-15 sm:min-w-15 w-8 aspect-square rounded-md overflow-hidden">
            <img className="object-cover object-center w-full h-full" src={previewImgUrl || FILE_PREVIEW_IMAGES?.[type]} alt="Image" />
        </div>
        <div className="space-y-2 min-w-20 flex-1">
            <p className="sm:text-base text-sm wrap-break-word font-medium text-left">{fileName}</p>
            <p className="text-sm wrap-break-word font-medium text-left">{formatFileSize(fileSize)}</p>
        </div>
        <div style={{background: selected.find(({file_name, file_path})=> fileName === file_name && filePath === file_path) ? "var(--main-primary)" : "transparent"}} className="w-4 min-w-4 aspect-square rounded-[3px] border border-(--text-secondary)"></div>
    </div>
    </>
  )
}

export default TabListItem