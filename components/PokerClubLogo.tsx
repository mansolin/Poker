import React from 'react';

const PokerClubLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: '120px', height: '80px' }}>
      <svg className="absolute h-full w-full" viewBox="0 0 120 80">
        {/* Golden flourishes and compass points */}
        <g fill="#d69e2e">
          {/* Top flourish */}
          <path d="M40,25 Q60,10 80,25" stroke="#d69e2e" strokeWidth="2" fill="none" />
          {/* Bottom flourish */}
          <path d="M40,55 Q60,70 80,55" stroke="#d69e2e" strokeWidth="2" fill="none" />
          
          {/* Compass points */}
          <polygon points="60,0 65,20 60,15 55,20" />
          <polygon points="60,80 65,60 60,65 55,60" />
          <polygon points="10,40 35,35 30,40 35,45" />
          <polygon points="110,40 85,35 90,40 85,45" />
        </g>

        {/* Red circle segments */}
        <g stroke="#b91c1c" strokeWidth="8">
          <path d="M45,22 A30,30 0 0,1 75,22" fill="none" />
          <path d="M45,58 A30,30 0 0,1 75,58" fill="none" />
        </g>
      </svg>
      <div className="relative text-center text-white leading-tight font-serif">
        <span className="text-xs tracking-wider">THE</span>
        <h1 className="text-2xl font-bold -my-1">POKER</h1>
        <span className="text-xs tracking-wider">CLUB</span>
      </div>
    </div>
  );
};

export default PokerClubLogo;