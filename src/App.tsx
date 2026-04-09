import { useState } from "react";
import AppHeader from "./components/page-layouts/AppHeader";
import "./index.css";
import { FileResType } from "./store-slices/AllFilesSlice";
import AppNavigation from "./components/page-layouts/AppNavigation";

function App() {
  const [activeTab, setActiveTab] = useState<FileResType>("audio")
  return (
    <div>
      <AppHeader />
      <AppNavigation activeTab={activeTab}>
        <></>
      </AppNavigation>
    </div>
  );
}

export default App;