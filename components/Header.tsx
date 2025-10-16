import React from 'react';
import { View, UserRole } from '../types';
import PokerChipIcon from './icons/PokerChipIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';
import HistoryIcon from './icons/HistoryIcon';
import CashierIcon from './icons/CashierIcon';
import SettingsIcon from './icons/SettingsIcon';
import SpadeTreeLogo from './SpadeTreeLogo';
import LogoutIcon from './icons/LogoutIcon';

interface HeaderProps {
  userName: string | null;
  userRole: UserRole;
  isVisitor: boolean;
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, userRole, isVisitor, activeView, setActiveView, onLogout }) => {
  const navItems = [
    { view: View.LiveGame, icon: <PokerChipIcon /> },
    { view: View.Players, icon: <UsersIcon /> },
    { view: View.SessionHistory, icon: <HistoryIcon /> },
    { view: View.Ranking, icon: <TrophyIcon /> },
    { view: View.Cashier, icon: <CashierIcon /> },
  ];
  
  const isUserAdmin = userRole === 'owner' || userRole === 'admin';
  const shouldShowLogout = userRole !== 'visitor' || isVisitor;
  
  const roleTranslations: { [key in UserRole]: string } = {
    owner: 'Dono',
    admin: 'Admin',
    pending: 'Pendente',
    visitor: 'Visitante'
  };

  return (
    <header className="bg-poker-light shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 md:px-8 flex items-center justify-between h-16">
        <div className="flex items-center h-full">
            <div className="flex items-center space-x-2 sm:space-x-4 pr-4 sm:pr-6 border-r border-poker-gray/20">
                <SpadeTreeLogo className="h-12 w-12"/>
            </div>
        </div>

        <div className="flex items-center">
            <nav className="mr-2">
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
                </ul>
            </nav>

            <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                    {isUserAdmin && (
                        <button
                        onClick={() => setActiveView(View.Settings)}
                        title="Configurações"
                        className={`h-10 w-10 flex items-center justify-center rounded-md transition-all duration-300 ${
                            activeView === View.Settings ? 'bg-green-700 text-white' : 'bg-transparent text-poker-gray hover:text-white'
                        }`}
                        >
                        <span className="h-6 w-6"><SettingsIcon /></span>
                        </button>
                    )}
                    {shouldShowLogout && (
                        <button
                        onClick={onLogout}
                        title="Sair"
                        className="h-10 w-10 flex items-center justify-center rounded-md transition-all duration-300 bg-red-800 text-white hover:bg-red-700"
                        >
                        <span className="h-6 w-6"><LogoutIcon /></span>
                        </button>
                    )}
                </div>
                 <div className="h-4 mt-1 text-right text-xs text-poker-gray pr-1">
                    {isVisitor ? (
                        <span className="italic">Visitante</span>
                    ) : (
                        userName && userRole !== 'pending' ? (
                            <>
                                <span className="hidden sm:inline">Usuário: </span><span className="font-semibold text-white">{userName}</span> | <span className="italic">{roleTranslations[userRole]}</span>
                            </>
                        ) : userRole === 'visitor' ? (
                           <span className="italic">Visitante</span>
                        ) : null
                    )}
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
