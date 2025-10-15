import React from 'react';
import SpadeIcon from './icons/SpadeIcon';
import HeartIcon from './icons/HeartIcon';
import ClubIcon from './icons/ClubIcon';
import DiamondIcon from './icons/DiamondIcon';

const PokerLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center -ml-4">
      <h1
        className="text-4xl font-extrabold tracking-wider text-poker-gold"
        style={{
          fontFamily: 'Georgia, serif',
          textShadow: '0 0 5px #d69e2e, 0 0 10px #d69e2e, 0 0 15px #000',
        }}
      >
        POKER
      </h1>
      <div className="flex items-center space-x-2 -mt-2">
        <div className="h-5 w-5">
            <SpadeIcon />
        </div>
        <div className="h-5 w-5">
            <HeartIcon />
        </div>
        <div className="h-5 w-5">
            <ClubIcon />
        </div>
        <div className="h-5 w-5">
            <DiamondIcon />
        </div>
      </div>
    </div>
  );
};

export default PokerLogo;
