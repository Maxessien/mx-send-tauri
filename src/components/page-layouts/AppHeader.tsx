import Search from "./Search"


const AppHeader = () => {
  return (
    <header className="w-full px-4 py-2 flex justify-between items-center">
        <h2 className="text-3xl font-semibold">MxSend</h2>
        <Search />
    </header>
  )
}

export default AppHeader