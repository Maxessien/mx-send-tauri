import { useSelector } from "react-redux";
import TabListItem from "./TabListItem";
import { RootState } from "../../store";
import { useState } from "react";


const TransferTab = () => {
    const {transferring} = useSelector((state: RootState)=>state.allFiles)
    const [activeTransferTab, setActiveTransferTab] = useState()
  return (
    <>
      <div className="w-full space-y-2">
        {transferring.length > 0 ? transferring.map(({ file_name, file_path, file_size, type, sender_id, current, total }) => {
          return (
            <TabListItem
              fileName={file_name}
              filePath={file_path}
              fileSize={file_size}
              type={type}
            />
          );
        }) : <p className="w-full text-center font-semibold text-2xl py-4">No Files found</p>}
      </div>
    </>
  )
}

export default TransferTab