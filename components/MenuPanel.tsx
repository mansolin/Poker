import React from 'react';
import type { AppUser, Notification } from '../types';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import HelpIcon from './icons/HelpIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import NotificationIcon from './icons/NotificationIcon';
import UsersIcon from './icons/UsersIcon';
import TrophyIcon from './icons/TrophyIcon';

interface MenuPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: AppUser | null;
    notifications: Notification[];
    isUserAdmin: boolean;
    onGoToSettings: () => void;
    onLogout: () => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({ isOpen, onClose, user, notifications, isUserAdmin, onGoToSettings, onLogout }) => {
    
    const timeSince = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getIconForNotification = (iconType?: Notification['icon']) => {
        switch (iconType) {
            case 'user': return <UsersIcon />;
            case 'role': return <SettingsIcon />;
            case 'game': return <TrophyIcon />;
            default: return <NotificationIcon />;
        }
    };
    
    return (
        <>
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-sm bg-poker-dark text-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <header className="flex items-center p-4 border-b border-poker-light">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-poker-light">
                        <ArrowLeftIcon />
                    </button>
                    <h2 className="text-xl font-bold mx-auto">Menu</h2>
                </header>

                <div className="flex-grow overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-poker-gray uppercase tracking-wider mb-2">Notificações</h3>
                        <div className="space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className="flex items-start p-3 bg-poker-light rounded-lg">
                                        <div className="flex-shrink-0 h-8 w-8 mt-1 flex items-center justify-center rounded-full bg-poker-green/50 text-poker-gray">
                                            {getIconForNotification(notif.icon)}
                                        </div>
                                        <div className="ml-3 flex-grow">
                                            <p className="text-sm font-semibold text-white">{notif.message}</p>
                                            <p className="text-xs text-poker-gray">{notif.subMessage}</p>
                                        </div>
                                        <time className="text-xs text-poker-gray flex-shrink-0 ml-2">{timeSince(notif.timestamp)}</time>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-poker-gray text-sm py-4">Nenhuma notificação por enquanto...</p>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-poker-light">
                        <nav className="space-y-2">
                           {isUserAdmin && (
                                <button onClick={onGoToSettings} className="w-full flex items-center p-3 text-base text-poker-gray hover:bg-poker-light hover:text-white rounded-lg transition-colors">
                                    <span className="h-6 w-6 mr-3"><SettingsIcon /></span>
                                    <span>Ajustes da conta</span>
                                </button>
                           )}
                            <button disabled className="w-full flex items-center p-3 text-base text-poker-gray/50 cursor-not-allowed">
                                <span className="h-6 w-6 mr-3"><HelpIcon /></span>
                                <span>Ajuda</span>
                            </button>
                        </nav>
                    </div>
                </div>

                <footer className="p-4 border-t border-poker-light">
                    <button onClick={onLogout} className="w-full p-3 text-base bg-red-800/50 text-red-400 hover:bg-red-800 hover:text-white font-semibold rounded-lg transition-colors">
                        Sair do App
                    </button>
                </footer>
            </div>
        </>
    );
};

export default MenuPanel;
