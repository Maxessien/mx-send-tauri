import { FaFile, FaImage, FaMusic, FaVideo } from "react-icons/fa";
import { FileResType } from "../../store-slices/AllFilesSlice";
import { ReactNode } from "react";

const AppNavigation = ({ activeTab, children }: { activeTab: FileResType, children: ReactNode }) => {
  const listStyles = (isActive: boolean) =>
    `w-full hover:bg-(--main-tertiary) p-3 rounded-full md:rounded-md flex justify-center sm:justify-start items-center ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) border-2 border-(--main-primary)" : ""} text-lg font-medium`;
  return (
    <div>
      <nav className="w-full px-3 py-2 rounded-full bg-(--main-tertiary) border-2 border-(--text-secondary-light) md:rounded-none">
        <ul>
          <li className={listStyles(activeTab === "audio")}>
            <span>
              <FaVideo />
            </span>
            <span>
              <FaMusic /> Audio
            </span>
          </li>
          <li className={listStyles(activeTab === "video")}>
            <span>
              <FaVideo />
            </span>
            <span>
              <FaVideo /> Video
            </span>
          </li>
          <li className={listStyles(activeTab === "images")}>
            <span>
              <FaVideo />
            </span>
            <span>
              <FaImage /> Image
            </span>
          </li>
          <li className={listStyles(activeTab === "document")}>
            <span>
              <FaVideo />
            </span>
            <span>
              <FaFile /> Document
            </span>
          </li>
        </ul>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
};

export default AppNavigation;
