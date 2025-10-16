import React from 'react';

const NewPokerLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 200 150" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
      
      <g style={{ filter: 'url(#shadow)' }}>
        {/* Card 1: Clubs (Bottom Left) */}
        <g transform="rotate(-30 50 100)">
          <path d="M10 20 Q10 10 20 10 H90 Q100 10 100 20 V120 Q100 130 90 130 H20 Q10 130 10 120 Z" fill="#F8F4E8" stroke="#333A45" strokeWidth="2"/>
          <g fill="#333A45">
            <path d="M55 70 a10 10 0 0 1 -20 0 a10 10 0 0 1 20 0 Z M45 70 a10 10 0 0 1 20 0 a10 10 0 0 1 -20 0 Z M50 50 a10 10 0 0 1 0 20 Z" />
            <path d="M48 75 L52 75 L50 85 Z" />
            <text x="18" y="32" fontSize="16" fontFamily="serif" fontWeight="bold">A</text>
            <path d="M22 45 a3 3 0 0 1 -6 0 a3 3 0 0 1 6 0 Z M16 45 a3 3 0 0 1 6 0 a3 3 0 0 1 -6 0 Z M19 39 a3 3 0 0 1 0 6 Z" transform="scale(0.8) translate(3,3)" />
            <path d="M18 47 L20 47 L19 51 Z" transform="scale(0.8) translate(3,3)" />
          </g>
        </g>

        {/* Card 2: Diamonds (Behind Spades) */}
        <g transform="rotate(-15 70 100)">
           <path d="M20 15 Q20 5 30 5 H100 Q110 5 110 15 V115 Q110 125 100 125 H30 Q20 125 20 115 Z" fill="#F8F4E8" stroke="#333A45" strokeWidth="2"/>
           <g fill="#CB4335">
            <path d="M65 50 L80 70 L65 90 L50 70 Z" />
            <text x="28" y="27" fontSize="16" fontFamily="serif" fontWeight="bold">A</text>
            <path d="M33 33 L38 43 L33 53 L28 43 Z" transform="scale(0.8)" />
           </g>
        </g>

        {/* Card 3: Spades (Front, middle) */}
        <g transform="rotate(5 100 100)">
          <path d="M30 10 Q30 0 40 0 H110 Q120 0 120 10 V110 Q120 120 110 120 H40 Q30 120 30 110 Z" fill="#F8F4E8" stroke="#333A45" strokeWidth="2"/>
          <g fill="#333A45">
            <path d="M75 40 C95 60, 95 80, 75 100 C55 80, 55 60, 75 40 Z" />
            <path d="M72 100 L78 100 L75 110 Z" />
            <text x="38" y="22" fontSize="16" fontFamily="serif" fontWeight="bold">A</text>
            <path d="M43 28 C50 35, 50 45, 43 50 C36 45, 36 35, 43 28 Z" transform="scale(0.8)"/>
            <path d="M42 50 L44 50 L43 54 Z" transform="scale(0.8)" />
          </g>
        </g>

        {/* Card 4: Hearts (Front Right) */}
        <g transform="rotate(20 120 100)">
            <path d="M40 20 Q40 10 50 10 H120 Q130 10 130 20 V120 Q130 130 120 130 H50 Q40 130 40 120 Z" fill="#F8F4E8" stroke="#333A45" strokeWidth="2"/>
            <g fill="#CB4335">
                <path d="M85 50 C100 35, 115 55, 85 75 C55 55, 70 35, 85 50 Z" />
                <path d="M85 75 Q 83 85 80 95" stroke="#CB4335" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M85 75 Q 88 88 90 92" stroke="#CB4335" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="78" cy="100" r="2" />
                <text x="110" y="32" fontSize="16" fontFamily="serif" fontWeight="bold">A</text>
                <path d="M115 40 C120 32, 125 42, 115 50 C105 42, 110 32, 115 40 Z" transform="scale(0.8) translate(15, 5)" />
            </g>
        </g>
      </g>
    </svg>
  );
};

export default NewPokerLogo;
