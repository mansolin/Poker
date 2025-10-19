import React from 'react';
import { View, UserRole } from '../types';
import PokerChipIcon from './icons/PokerChipIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import HistoryIcon from './icons/HistoryIcon';
import CashierIcon from './icons/CashierIcon';
import SpadeTreeLogo from './SpadeTreeLogo';
import MenuIcon from './icons/MenuIcon';
import LogoutIcon from './icons/LogoutIcon';

interface HeaderProps {
  isUserAuthenticated: boolean;
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenMenu: () => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isUserAuthenticated, activeView, setActiveView, onOpenMenu, userRole, onLogout }) => {
  const navItems = [
    { view: View.LiveGame, icon: <PokerChipIcon /> },
    { view: View.Ranking, icon: <TrophyIcon /> },
    { view: View.SessionHistory, icon: <HistoryIcon /> },
    { view: View.Players, icon: <UsersIcon /> },
    { view: View.Cashier, icon: <CashierIcon /> },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (userRole === 'visitor') {
      return [View.LiveGame, View.Ranking, View.SessionHistory, View.Cashier].includes(item.view);
    }
    return true; // Show all for other roles
  });
  
  const isViewDisabled = (view: View): boolean => {
    if (!isUserAuthenticated) {
        // Disables Players view for non-authenticated roles like 'visitor' or 'pending'
        return [View.Players].includes(view);
    }
    return false;
  };
  
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
                {visibleNavItems.map(item => (
                    <li key={item.view}>
                    <button
                        onClick={() => setActiveView(item.view)}
                        className={`flex items-center px-2 py-2 sm:px-3 md:px-4 text-sm md:text-base font-semibold rounded-md transition-all duration-300 ${
                        activeView === item.view
                            ? 'bg-poker-green text-white shadow-md'
                            : 'bg-transparent text-poker-gray hover:bg-poker-dark hover:text-white'
                        } ${isViewDisabled(item.view) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={item.view}
                        disabled={isViewDisabled(item.view)}
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
            {isUserAuthenticated ? (
                <button
                    onClick={onOpenMenu}
                    title="Menu"
                    className="h-10 w-10 flex items-center justify-center rounded-full text-poker-gray hover:bg-poker-dark hover:text-white transition-colors duration-300"
                >
                    <span className="h-6 w-6"><MenuIcon /></span>
                </button>
            ) : userRole === 'visitor' && (
                <button
                    onClick={onLogout}
                    title="Sair do modo Visitante"
                    className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-poker-gray shadow-md hover:bg-poker-dark/70 hover:text-white transition-colors"
                >
                    <span className="h-5 w-5 mr-2"><LogoutIcon /></span>
                    Sair
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;