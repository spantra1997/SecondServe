import React from 'react';

const Logo = ({ className = "w-10 h-10", color = "#3A5A40" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf shape */}
      <path
        d="M50 10C50 10 25 20 25 50C25 65 35 75 50 75C65 75 75 65 75 50C75 20 50 10 50 10Z"
        fill={color}
      />
      {/* Leaf vein */}
      <path
        d="M50 15L50 70"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Heart in the center */}
      <path
        d="M50 45C50 45 45 40 40 40C35 40 33 43 33 46C33 52 50 60 50 60C50 60 67 52 67 46C67 43 65 40 60 40C55 40 50 45 50 45Z"
        fill="white"
      />
      {/* Circular plate outline */}
      <circle
        cx="50"
        cy="75"
        r="20"
        stroke={color}
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
};

export default Logo;
