import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { JSX, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { changeTab } from "../../store-slices/activeTabs";

const NavItem = ({ icon, title }: { icon: JSX.Element; title: string }) => {
  const { activeTab } = useSelector((state: RootState) => state.activeTab);
  const listStyles = (isActive: boolean) =>
    `w-full hover:bg-(--main-tertiary) p-3 rounded-full md:rounded-md ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) border-2 border-(--main-primary)" : ""} text-lg font-medium`;
  const dispatch = useDispatch();
  return (
    <li
      onClick={() => dispatch(changeTab("audio"))}
      className={listStyles(activeTab === "audio")}
    >
      <span className="flex items-center justify-center sm:hidden">{icon}</span>
      <span className="hidden sm:flex sm:justify-start items-center gap-2 w-full">
        <span>{icon}</span> <span>{title}</span>
      </span>
    </li>
  );
};

const AppNavigation = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <nav className="w-full px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none">
        <ul>
          <NavItem icon={<FaMusic />} title="Audio" />
          <NavItem icon={<FaVideo />} title="Video" />
          <NavItem icon={<FaImage />} title="Immage" />
          <NavItem icon={<FaFile />} title="Document" />
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
};

export default AppNavigation;
