import React from 'react';
import { View } from '../types';
import PokerChipIcon from './icons/PokerChipIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import HistoryIcon from './icons/HistoryIcon';
import CashierIcon from './icons/CashierIcon';
import SpadeTreeLogo from './SpadeTreeLogo';
import MenuIcon from './icons/MenuIcon';

interface HeaderProps {
  isUserAuthenticated: boolean;
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ isUserAuthenticated, activeView, setActiveView, onOpenMenu }) => {
  const navItems = [
    { view: View.LiveGame, icon: <PokerChipIcon /> },
    { view: View.Players, icon: <UsersIcon /> },
    { view: View.SessionHistory, icon: <HistoryIcon /> },
    { view: View.Ranking, icon: <TrophyIcon /> },
    { view: View.Cashier, icon: <CashierIcon /> },
  ];
  
  return (
    <header className="bg-poker-light shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 md:px-8 flex items-center justify-between h-16">
        <div className="flex items-center h-full">
            <div className="flex items-center space-x-2 sm:space-x-4 pr-4 sm:pr-6 border-r border-poker-gray/20">
                <SpadeTreeLogo className="h-12 w-12"/>
            </div>
        </div>
        
        <div className="flex-grow flex justify-center">
            <nav>
                <ul className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                {navItems.map(item => (
                    <li key={item.view}>
                    <button
                        onClick={() => setActiveView(item.view)}
                        className={`flex items-center px-2 py-2 sm:px-3 md:px-4 text-sm md:text-base font-semibold rounded-md transition-all duration-300 ${
                        activeView === item.view
                            ? 'bg-poker-green text-white shadow-md'
                            : 'bg-transparent text-poker-gray hover:bg-poker-dark hover:text-white'
                        }`}
                        title={item.view}
                        disabled={!isUserAuthenticated}
                    >
                        <span className="h-5 w-5">{item.icon}</span>
                        <span className="hidden md:inline ml-2">{item.view}</span>
                    </button>
                    </li>
                ))}
                </ul>
            </nav>
        </div>

        <div className="flex items-center">
            {isUserAuthenticated && (
                <button
                    onClick={onOpenMenu}
                    title="Menu"
                    className="h-10 w-10 flex items-center justify-center rounded-full text-poker-gray hover:bg-poker-dark hover:text-white transition-colors duration-300"
                >
                    <span className="h-6 w-6"><MenuIcon /></span>
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
