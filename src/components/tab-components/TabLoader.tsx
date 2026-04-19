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
          <div className="w-full aspect-square max-w-30"><LoadRoller strokeWidth={10} /></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default TabLoader;
