import Button from "./Button"

const NewUpdatePopup = () => {
  return (
    <div className="w-screen h-screen backdrop-blur-xl fixed top-0 left-0 flex justify-center items-center">
      <div className="rounded-md p-3 md:p-4 lg:p-6">
        <h2>New release Update</h2>
        <p>
          <input type="checkbox" className="hidden" />
          <span></span>
          <span>Do not show again</span>
        </p>
        <div>
          <Button color="secondary">Close</Button>
          <Button>Install</Button>
        </div>
      </div>
    </div>
  )
}

export default NewUpdatePopup