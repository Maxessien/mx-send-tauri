import { useState } from "react"
import Button from "../reusable-components/Button"
import { FaSearch } from "react-icons/fa"


const Search = () => {
    const [input, setInput] = useState("")

    const search = ()=>{}

  return (
    <form onSubmit={search} className="w-full relative max-w-80">
        <input value={input} onChange={(e)=>setInput(e.target.value)} className="w-full px-2 py-3 pr-13 rounded-full shadow-[0px_0px_10px_-6px_var(--text-secondary-light)]" type="text" />
        <Button attrs={{onClick: search}} usePredefinedSize={false} className="p-3 absolute top-1/2 right-2 -translate-y-1/2 text-base"><FaSearch /></Button>
    </form>
  )
}

export default Search