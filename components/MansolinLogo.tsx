import React from 'react';

const MansolinLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="text-8xl mb-4" aria-label="Card Suits">
        <span role="img" aria-label="Spade suit">♠️</span>
        <span role="img" aria-label="Heart suit" className="ml-4">♥️</span>
        <span role="img" aria-label="Diamond suit" className="ml-4">♦️</span>
        <span role="img" aria-label="Club suit" className="ml-4">♣️</span>
      </div>
      <h1 className="text-5xl font-serif font-bold text-white">
        Mansolin
      </h1>
    </div>
  );
};

export default MansolinLogo;
