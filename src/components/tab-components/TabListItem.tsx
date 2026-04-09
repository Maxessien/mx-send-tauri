

const TabListItem = ({fileName, filePath, fileSize, previewImgUrl}: {fileName: string, fileSize: number, filePath: string, previewImgUrl: string}) => {
  return (
    <>
    <div className="flex w-full items-start bg-(--main-tertiary) hover:scale-[1.03] transition-all duration-200 shadow-[inset_0px_0px_10px_-8px_var(--text-secondary)] px-3 py-2 rounded-md">
        <div className="w-15 aspect-square rounded-md overflow-hidden">
            <img className="object-cover object-center w-full h-full" src={previewImgUrl} alt="Image" />
        </div>
        <div className="space-y-2">
            <p className="text-lg font-medium text-left">{fileName}</p>
            <p className="text-base text-(--text-secondary) font-medium text-left">{filePath}</p>
            <p className="text-sm font-medium text-left">{fileSize}MB</p>
        </div>
        <div className="w-4 h-4 rounded-md border border-(--text-secondary)"></div>
    </div>
    </>
  )
}

export default TabListItem