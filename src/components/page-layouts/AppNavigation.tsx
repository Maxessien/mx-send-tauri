import { JSX, ReactNode } from "react";
import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { changeTab } from "../../store-slices/activeTabs";
import { FileResType } from "../../store-slices/allFilesSlice";

const NavItem = ({ icon, title, active }: { icon: JSX.Element; title: string, active: FileResType }) => {
  const { activeTab } = useSelector((state: RootState) => state.activeTab);
  const listStyles = (isActive: boolean) =>
    `md:w-full transition-all duration-200 h-max p-3 w-max rounded-full md:rounded-md ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) hover:bg-(--main-primary-light) border-2 border-(--main-primary)" : "hover:bg-(--main-tertiary-light)"} text-lg font-medium`;
  const dispatch = useDispatch();
  return (
    <li
      onClick={() => dispatch(changeTab(active))}
      className={listStyles(activeTab === active)}
    >
      <span className="flex items-center justify-center md:hidden">{icon}</span>
      <span className="hidden md:flex md:justify-start items-center gap-2 w-full">
        <span>{icon}</span> <span>{title}</span>
      </span>
    </li>
  );
};

const AppNavigation = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] md:grid md:grid-cols-[25%_75%] w-full">
      <nav className="md:h-full w-full z-15 fixed md:sticky flex items-center justify-center bottom-3 left-0">
        <ul className="space-y-3 md:h-full md:w-full w-[90%] mx-auto px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none flex justify-between items-center md:flex-col md:items-left md:justify-start gap-2">
          <NavItem icon={<FaMusic />} active="audio" title="Audio" />
          <NavItem icon={<FaVideo />} active="video" title="Video" />
          <NavItem icon={<FaImage />} active="images" title="Image" />
          <NavItem icon={<FaFile />} active="document" title="Document" />
        </ul>
      </nav>
      <main className="px-4 h-full w-full overflow-y-auto overflow-x-hidden pb-13 md:pb-4">{children}</main>
    </div>
  );
};

export default AppNavigation;
