import React from 'react';
import { View, UserRole } from '../types';
import PokerChipIcon from './icons/PokerChipIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import HistoryIcon from './icons/HistoryIcon';
import CashierIcon from './icons/CashierIcon';
import SettingsIcon from './icons/SettingsIcon';
import PokerClubLogo from './PokerClubLogo';
import LogoutIcon from './icons/LogoutIcon';

interface HeaderProps {
  userRole: UserRole;
  isVisitor: boolean;
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, isVisitor, activeView, setActiveView, onLogout }) => {
  const navItems = [
    { view: View.LiveGame, icon: <PokerChipIcon /> },
    { view: View.Players, icon: <UsersIcon /> },
    { view: View.SessionHistory, icon: <HistoryIcon /> },
    { view: View.Ranking, icon: <TrophyIcon /> },
    { view: View.Cashier, icon: <CashierIcon /> },
  ];
  
  const isUserAdmin = userRole === 'owner' || userRole === 'admin';
  const shouldShowLogout = userRole !== 'visitor' || isVisitor;

  return (
    <header className="bg-poker-light shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 md:px-8 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <PokerClubLogo className="scale-75 sm:scale-100"/>
          <span className="hidden sm:inline text-poker-gray text-sm italic">by Mansolin</span>
        </div>
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
                  disabled={userRole === 'pending'}
                >
                  <span className="h-5 w-5">{item.icon}</span>
                  <span className="hidden md:inline ml-2">{item.view}</span>
                </button>
              </li>
            ))}
             {isUserAdmin && (
              <li>
                <button
                  onClick={() => setActiveView(View.Settings)}
                  title="Configurações"
                  className={`flex items-center px-2 py-2 text-sm md:text-base font-semibold rounded-md transition-all duration-300 ${
                    activeView === View.Settings ? 'bg-poker-green text-white' : 'text-poker-gray hover:text-white'
                  }`}
                >
                  <span className="h-5 w-5"><SettingsIcon /></span>
                </button>
              </li>
            )}
            {shouldShowLogout && (
               <li>
                <button
                  onClick={onLogout}
                  title="Sair"
                  className="flex items-center px-2 py-2 text-sm md:text-base font-semibold rounded-md transition-all duration-300 bg-red-800 text-white hover:bg-red-700"
                >
                  <span className="h-5 w-5"><LogoutIcon /></span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;