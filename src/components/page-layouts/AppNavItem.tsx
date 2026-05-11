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
    `md:w-full transition-all duration-200 h-max cursor-pointer p-3 w-max md:rounded-md ${isActive ? "md:text-(--main-primary) md:bg-(--main-primary-lighter) hover:bg-(--main-tertiary-light) md:hover:bg-(--main-primary-light) border-b-2 border-b-(--main-primary) md:border-2 md:border-(--main-primary)" : "hover:bg-(--main-tertiary-light)"} text-base md:text-lg font-medium`;
  return (
    <li
      onClick={() => navigate(location)}
      className={listStyles(active)}
    >
      <span className="flex w-max md:w-full justify-center md:justify-start items-center gap-2">
        <span>{icon}</span> <span>{title}</span>
      </span>
    </li>
  );
};

export default AppNavItem