import React from 'react';
import { View } from '../types';
import PokerChipIcon from './icons/PokerChipIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import HistoryIcon from './icons/HistoryIcon';
import PokerClubLogo from './PokerClubLogo';


interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { view: View.LiveGame, icon: <PokerChipIcon /> },
    { view: View.Players, icon: <UsersIcon /> },
    { view: View.SessionHistory, icon: <HistoryIcon /> },
    { view: View.Ranking, icon: <TrophyIcon /> },
  ];

  return (
    <header className="bg-poker-light shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <PokerClubLogo />
          <span className="text-poker-gray text-sm italic">by Mansolin</span>
        </div>
        <nav>
          <ul className="flex items-center space-x-2 md:space-x-4">
            {navItems.map(item => (
              <li key={item.view}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-semibold rounded-md transition-all duration-300 ${
                    activeView === item.view
                      ? 'bg-poker-green text-white shadow-md'
                      : 'bg-transparent text-poker-gray hover:bg-poker-dark hover:text-white'
                  }`}
                >
                  <span className="mr-2 h-5 w-5">{item.icon}</span>
                  {item.view}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;