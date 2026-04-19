import { useNavigate } from "react-router";
import { NavItemProps } from "../../types";

const AppNavItem = ({
  icon,
  title,
  active,
  location
}: NavItemProps) => {
  const navigate = useNavigate()
  const listStyles = (isActive: boolean) =>
    `md:w-full transition-all duration-200 h-max cursor-pointer p-3 w-max rounded-full md:rounded-md ${isActive ? "text-(--main-primary) bg-(--main-primary-lighter) hover:bg-(--main-primary-light) border-2 border-(--main-primary)" : "hover:bg-(--main-tertiary-light)"} text-lg font-medium`;
  return (
    <li
      onClick={() => navigate(location)}
      className={listStyles(active)}
    >
      <span className="flex items-center justify-center md:hidden">{icon}</span>
      <span className="hidden md:flex md:justify-start items-center gap-2 w-full">
        <span>{icon}</span> <span>{title}</span>
      </span>
    </li>
  );
};

export default AppNavItem