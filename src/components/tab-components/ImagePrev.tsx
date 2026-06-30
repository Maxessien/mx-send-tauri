import { HiX } from "react-icons/hi"


const ImagePrev = ({closeFn, fileName, src}: {src: string, fileName: string, closeFn: ()=> void}) => {
  return (
    <div className="fixed backdrop-blur-3xl z-9999 flex flex-col top-0 left-0 w-screen h-screen space-y-3 overflow-auto py-5 px-5">
        <div className="flex flex-col mx-auto items-end w-full gap-3 max-w-150">
            <button className="font-semibold text-2xl" onClick={closeFn}><HiX /></button>
            <p className="w-full text-lg text-center font-medium">{fileName}</p>
        </div>
        <div className="flex-1 mx-auto w-full max-w-130 overflow-hidden">
            <img className="object-contain object-center h-full w-full" src={src} alt={fileName} />
        </div>
    </div>
  )
}

export default ImagePrev