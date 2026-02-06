import React from 'react';

const Logo = ({ className = "w-10 h-10" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_ed7d5ecc-437b-4e43-8a46-0c8ebcf9e50c/artifacts/gz4lm4r1_image.png"
      alt="Second Serve Logo"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
