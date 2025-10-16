import React from 'react';

const SpadeTreeLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 256 256" 
      xmlns="http://www.w3.org/2000/svg" 
      preserveAspectRatio="xMidYMid meet"
      aria-label="Poker Club Logo"
      role="img"
    >
      <g>
        {/* Spade Shape using a dark color from the theme */}
        <path 
          d="M128 3.6C74.4 51.5 46.9 76.5 46.9 101.6c0 23.4 20.4 31.1 20.4 31.1h121.4s20.4-7.7 20.4-31.1c0-25-27.5-50.1-81.1-98z M128 252.4l-30.6-37.2h61.2L128 252.4z" 
          fill="#1a202c"
        />
        {/* Tree Design using a lighter color for contrast */}
        <path 
          fill="#2d3748"
          d="M128 215c-3-12.7-4-25.3-4-38 0-12.7 1-25.3 4-38-2 12.7-3 25.3-3 38 0 12.7 1 25.3 3 38zm-12-68c-8 0-15 5-19 12-2 3.3-3 7.3-3 12s1 8.7 3 12c4 7 11 12 19 12-4-4-6-9-6-15s2-11 6-15zm24 0c8 0 15 5 19 12 2 3.3 3 7.3 3 12s-1 8.7-3 12c-4 7-11 12-19 12 4-4 6-9 6-15s-2-11-6-15zm-22-11c-4 3-7 7-9 12-1 3-2 6-2 9s1 6 2 9c-2-3-3-6-3-9s1-6 2-9c2-5 5-9 9-12zm20 0c4 3 7 7 9 12 1 3 2 6 2 9s-1 6-2 9c2-3 3-6 3-9s-1-6-2-9c-2-5-5-9-9-12zm-30-11c-3 2-5 5-7 8-2 3-3 6-3 10s1 7 3 10c-1-3-2-6-2-10s1-7 3-10c2-3 4-6 7-8zm38 0c3 2 5 5 7 8 2 3 3 6 3 10s-1 7-3 10c1-3 2-6 2-10s-1-7-3-10c-2-3-4-6-7-8zm-44-11c-2 2-4 4-5 7-1 2-2 5-2 8s1 6 2 8c-1-2-1-5-1-8s1-6 2-7c1-3 3-5 5-7zm50 0c2 2 4 4 5 7 1 2 2 5 2 8s-1 6-2 8c1-2 1-5 1-8s-1-6-2-7c-1-3-3-5-5-7z"
        />
      </g>
    </svg>
  );
};

export default SpadeTreeLogo;