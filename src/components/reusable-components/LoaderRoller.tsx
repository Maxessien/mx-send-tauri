"use client";

import { motion } from "framer-motion";
import { LoadRollerProps } from "../../types";

const LoadRoller = ({ className = "", containerClassName="", strokeWidth = 8, duration = 1 }: LoadRollerProps) => {

  const circlePercentage = 0.7;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - circlePercentage);

  return (
    //Add container classname to default ones so the latter would overide the before
    <div className={("w-full h-full inline-block " + containerClassName).trimEnd()}>
      <motion.svg
        viewBox="0 0 100 100"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration * 2,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={className}
        />
      </motion.svg>
    </div>
  );
};

export default LoadRoller;
