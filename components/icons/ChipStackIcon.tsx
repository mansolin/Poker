import React from 'react';

const ChipStackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 80"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ overflow: 'visible' }}
  >
    {/* Stack */}
    <g transform="translate(40, 0)">
      <ellipse cx="30" cy="70" rx="28" ry="8" fill="#1a202c" />
      <rect x="2" y="22" width="56" height="48" fill="#1a202c" />
      <ellipse cx="30" cy="22" rx="28" ry="8" fill="#2d3748" />
      {/* Stack stripes */}
      <rect x="2" y="28" width="56" height="6" fill="#b91c1c" />
      <rect x="2" y="40" width="56" height="6" fill="#b91c1c" />
      <rect x="2" y="52" width="56" height="6" fill="#b91c1c" />
      <rect x="2" y="64" width="56" height="6" fill="#b91c1c" />
      <ellipse cx="30" cy="22" rx="28" ry="8" stroke="#4a5568" strokeWidth="1" fill="none" />
    </g>
    {/* Leaning chip */}
    <g transform="translate(0, 15)">
      <ellipse cx="30" cy="35" rx="28" ry="8" fill="#b91c1c" stroke="#991b1b" strokeWidth="1.5" />
      <ellipse cx="30" cy="35" rx="22" ry="6" stroke="#fca5a5" strokeWidth="1.5" fill="none" />
      <text x="25" y="40" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="white">$</text>
    </g>
  </svg>
);

export default ChipStackIcon;
