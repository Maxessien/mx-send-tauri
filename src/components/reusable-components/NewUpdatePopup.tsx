import { useState } from "react"
import Button from "./Button"

const NewUpdatePopup = ({hidePopup, toggleShow, toggActive}: {hidePopup: ()=> void, toggleShow: (val: boolean)=> void, toggActive: boolean}) => {
  const [togg, setTogg] = useState(false)

  return (
    <div className="w-screen h-screen backdrop-blur-xl fixed top-0 left-0 flex justify-center items-center">
      <div className="rounded-md p-3 md:p-4 lg:p-6">
        <h2>New release Update</h2>
        <p>
          <input type="checkbox" disabled={toggActive} defaultChecked={togg} onChange={({target: {checked}})=> {if (toggActive) setTogg(checked)}} className="hidden" />
          <span></span>
          <span>Do not show again</span>
        </p>
        <div>
          <Button attrs={{onClick: ()=>{
            hidePopup()
            toggleShow(!togg)
          }}} color="secondary">Close</Button>
          <a href="https://mxsend.vercel.app/downloads">Download</a>
        </div>
      </div>
    </div>
  )
}

export default NewUpdatePopup