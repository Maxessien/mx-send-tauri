

const formatFileSize = (size: number)=> {
  if (size < Math.pow(1024, 2)) return `${(size / 1024).toFixed(0)} KB`
  if (size >= Math.pow(1024, 2) && size < (Math.pow(1024, 3))) return `${(size / Math.pow(1024, 2)).toFixed(1)} MB`
  else return `${(size / Math.pow(1024, 3)).toFixed(1)} GB`
}

const TabListItem = ({fileName, filePath, fileSize, previewImgUrl}: {fileName: string, fileSize: number, filePath: string, previewImgUrl: string}) => {

  return (
    <>
    <div className="flex w-full gap-4 justify-between items-center bg-(--main-tertiary) hover:bg-(--main-tertiary-light) transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
        <div className="w-15 min-w-15 aspect-square rounded-md overflow-hidden">
            <img className="object-cover object-center w-full h-full" src={previewImgUrl} alt="Image" />
        </div>
        <div className="space-y-2 flex-1">
            <p className="text-base w-full wrap-break-word font-medium text-left">{fileName}</p>
            <p className="text-base w-full wrap-break-word text-(--text-secondary) font-medium text-left">{filePath}</p>
            <p className="text-sm w-full wrap-break-word font-medium text-left">{formatFileSize(fileSize)}</p>
        </div>
        <div className="w-4 min-w-4 aspect-square rounded-[3px] border border-(--text-secondary)"></div>
    </div>
    </>
  )
}

export default TabListItem