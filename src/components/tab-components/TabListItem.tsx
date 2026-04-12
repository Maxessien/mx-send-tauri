import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../store"
import { addSelected, removeSelected } from "../../store-slices/allFilesSlice"


const formatFileSize = (size: number)=> {
  if (size < Math.pow(1024, 2)) return `${(size / 1024).toFixed(0)} KB`
  if (size >= Math.pow(1024, 2) && size < (Math.pow(1024, 3))) return `${(size / Math.pow(1024, 2)).toFixed(1)} MB`
  else return `${(size / Math.pow(1024, 3)).toFixed(1)} GB`
}

const TabListItem = ({fileName, filePath, fileSize, previewImgUrl}: {fileName: string, fileSize: number, filePath: string, previewImgUrl: string}) => {
  const {selected} = useSelector((state: RootState)=>state.allFiles)
  const dispatch = useDispatch()

  const handleSelection = ()=>{
    const fileRes = {file_name: fileName, file_path: filePath, file_size: fileSize}
    const isSelected = selected.find(({file_name, file_path})=> fileName === file_name && filePath === file_path)
    isSelected ? dispatch(removeSelected(fileRes)) : dispatch(addSelected(fileRes))
  }

  return (
    <>
    <div onClick={handleSelection} className="flex w-full gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
        <div className="sm:w-15 sm:min-w-15 w-8 aspect-square rounded-md overflow-hidden">
            <img className="object-cover object-center w-full h-full" src={previewImgUrl} alt="Image" />
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