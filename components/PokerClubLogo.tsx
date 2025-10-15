import React from 'react';

const PokerClubLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg className="h-full w-full" viewBox="0 0 140 60" preserveAspectRatio="xMidYMid meet">
        {/* Golden Star */}
        <g fill="#d69e2e">
          <polygon points="25,5 30,22 48,22 34,33 38,50 25,40 12,50 16,33 2,22 20,22" />
        </g>
        {/* Text */}
        <text x="55" y="32" fontFamily="serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="start">
          POKER
        </text>
        <text x="55" y="50" fontFamily="sans-serif" fontSize="10" fill="#a0aec0" letterSpacing="1" textAnchor="start">
          THE CLUB
        </text>
      </svg>
    </div>
  );
};

export default PokerClubLogo;