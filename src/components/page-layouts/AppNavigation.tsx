import { JSX, ReactNode } from "react";
import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { changeTab } from "../../store-slices/activeTabs";
import { FileResType } from "../../store-slices/allFilesSlice";

const NavItem = ({ icon, title, active }: { icon: JSX.Element; title: string, active: FileResType }) => {
  const { activeTab } = useSelector((state: RootState) => state.activeTab);
  const listStyles = (isActive: boolean) =>
    `md:w-full hover:bg-(--main-tertiary-light) transition-all duration-200 p-3 w-max rounded-full md:rounded-md ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) border-2 border-(--main-primary)" : ""} text-lg font-medium`;
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
    <div className="relative h-[calc(100vh-64px)] w-full">
      <nav className="w-full absolute bottom-3 left-0 md:relative px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none">
        <ul className="space-y-3 flex justify-between items-center md:flex-col md:items-left md:justify-start gap-2 h-full w-full">
          <NavItem icon={<FaMusic />} active="audio" title="Audio" />
          <NavItem icon={<FaVideo />} active="video" title="Video" />
          <NavItem icon={<FaImage />} active="images" title="Image" />
          <NavItem icon={<FaFile />} active="document" title="Document" />
        </ul>
      </nav>
      <main className="pt-4 pb-13 md:pb-4">{children}</main>
    </div>
  );
};

export default AppNavigation;
