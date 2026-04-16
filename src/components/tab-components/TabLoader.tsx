import { JSX } from "react";
import LoadRoller from "../reusable-components/LoaderRoller";

const TabLoader = ({
  children,
  isLoading,
}: {
  children: JSX.Element;
  isLoading: boolean;
}) => {
  return (
    <div>
      {isLoading ? (
        <div className="w-full h-full flex justify-center items-center">
          <LoadRoller strokeWidth={10} containerClassName="w-[80px] h-[80px]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default TabLoader;
