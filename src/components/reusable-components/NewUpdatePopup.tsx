import { useState } from "react"
import Button from "./Button"

interface NewUpdatePopupProps {
  hidePopup: () => void
  toggleShow: (val: boolean) => void
  toggActive: boolean
}

const NewUpdatePopup = ({ hidePopup, toggleShow, toggActive }: NewUpdatePopupProps) => {
  const [togg, setTogg] = useState(false)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If toggActive is false, we can update state
    if (!toggActive) {
      setTogg(e.target.checked)
    }
  }

  const handleClose = () => {
    hidePopup()
    toggleShow(togg) // Pass the current state of "Do not show again"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all duration-300">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md transform overflow-hidden rounded-2xl border p-6 shadow-2xl transition-all scale-100 animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "var(--main-tertiary)",
          borderColor: "var(--main-tertiary-light)"
        }}
      >
        {/* Header */}
        <h2 
          className="text-xl font-bold tracking-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
         New Release Update
        </h2>
        
        <p 
          className="text-sm mb-6" 
          style={{ color: "var(--text-secondary)" }}
        >
          A new version of MxSend is available with exciting features and performance improvements. Upgrade now to get the best experience!
        </p>

        {/* Custom Checkbox Wrapper */}
        <label 
          className={`flex items-center gap-3 cursor-pointer group mb-6 select-none ${toggActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              disabled={toggActive} 
              checked={togg} 
              onChange={handleCheckboxChange} 
              className="peer sr-only" 
            />
            {/* Custom Checkbox Box */}
            <div 
              className="w-5 h-5 rounded border flex items-center justify-center transition-all peer-checked:bg-(--main-primary-light) peer-checked:border-(--main-primary-light) group-hover:border-(--main-primary-light)"
              style={{ 
                borderColor: "var(--main-tertiary-light)",
                backgroundColor: "var(--main-secondary-light)"
              }}
            >
              {/* Checkmark icon (visible when checked) */}
              <svg 
                className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span 
            className="text-sm font-medium transition-colors group-hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            Do not show again
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button 
            attrs={{ onClick: handleClose }} 
            color="secondary"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-colors border"
          >
            Close
          </Button>
          
          <a 
            href="https://mxsend.vercel.app/downloads" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            style={{ backgroundColor: "var(--main-primary-light)" }}
          >
            Download Now
          </a>
        </div>
      </div>
    </div>
  )
}

export default NewUpdatePopup
