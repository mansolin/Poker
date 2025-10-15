import React from 'react';
import ChipStackIcon from './icons/ChipStackIcon';

const CashGamesLogo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 pl-4 pr-3 py-1 rounded-md" style={{ backgroundColor: '#dc2626' }}>
      <div className="flex flex-col items-start -space-y-4">
        <span
          className="text-5xl font-bold text-white"
          style={{ fontFamily: "'Brush Script MT', cursive", textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          Ca$h
        </span>
        <span 
          className="text-2xl font-extrabold text-black tracking-wider"
        >
          GAMES
        </span>
      </div>
      <ChipStackIcon className="h-14 w-16" />
    </div>
  );
};

export default CashGamesLogo;
