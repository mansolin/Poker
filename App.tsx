
import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import { 
    onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInAnonymously 
} from 'firebase/auth';
import { 
    collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp 
} from 'firebase/firestore';

// Types
import type { Player, Session, GamePlayer, AppUser, UserRole, ToastState, GameDefaults, Notification } from './types';
import { View } from './types';

// Components
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import SessionHistory from './components/SessionHistory';
import Ranking from './components/Ranking';
import Auth from './components/Auth';
import MenuPanel from './components/MenuPanel';
import Toast from './components/Toast';
import PlayerProfile from './components/PlayerProfile';
import Cashier from './components/Cashier';
import Settings from './components/Settings';
import SpadeTreeLogo from './components/SpadeTreeLogo';


const App: React.FC = () => {
    // Auth state: undefined = loading, null = logged out, AppUser = logged in/visitor
    const [user, setUser] = useState<AppUser | null | undefined>(undefined);

    // Data state
    const [players, setPlayers] = useState<Player[]>([]);
    const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
    const [liveGame, setLiveGame] = useState<Session | null>(null);
    const [appUsers, setAppUsers] = useState<AppUser[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [gameDefaults, setGameDefaults] = useState<GameDefaults>({ buyIn: 50, rebuy: 50 });

    // UI state
    const [activeView, setActiveView] = useState<View>(View.Ranking);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
    const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
    const [initialSessionId, setInitialSessionId] = useState<string | null>(null);

    const isLoading = user === undefined;
    const userRole: UserRole = user?.role || 'visitor';
    const isUserAdmin = userRole === 'admin' || userRole === 'owner';
    const isUserOwner = userRole === 'owner';
    const isUserAuthenticated = !!user && user.role !== 'visitor';

    // Toast helper
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    // Auth Listener Effect
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if (firebaseUser.isAnonymous) {
                    // Handle anonymous user as a visitor
                    setUser({
                        uid: firebaseUser.uid,
                        name: 'Visitante',
                        email: '',
                        role: 'visitor',
                    });
                } else {
                    // Handle signed-in (non-anonymous) users
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as Omit<AppUser, 'uid'>;
                        setUser({ uid: firebaseUser.uid, ...userData });
                    } else {
                        // This case is for first-time sign-in with a provider like Google
                        // where a user document doesn't exist yet.
                        const newUser: AppUser = {
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName || 'Novo Usuário',
                            email: firebaseUser.email || '',
                            role: 'pending',
                        };
                        await setDoc(doc(db, 'users', firebaseUser.uid), { name: newUser.name, email: newUser.email, role: newUser.role });
                        setUser(newUser);
                    }
                }
            } else {
                setUser(null); // User is logged out
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Data Listeners Effect
    useEffect(() => {
        const listeners: (() => void)[] = [];
        
        // Only set up listeners if user is determined (not undefined)
        if (user) {
            // Public data for visitors and approved users
            // FIX: Simplified conditional to avoid redundant check causing TypeScript error.
            if (user.role !== 'pending') {
                 const playersQuery = query(collection(db, 'players'), orderBy('name', 'asc'));
                listeners.push(onSnapshot(playersQuery, snapshot => {
                    const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
                    setPlayers(playersData);
                }));

                const sessionsQuery = query(collection(db, 'sessions'), orderBy('date', 'desc'));
                listeners.push(onSnapshot(sessionsQuery, snapshot => {
                    const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
                    setSessionHistory(sessionsData);
                }));

                const liveGameQuery = query(collection(db, 'live-game'));
                listeners.push(onSnapshot(liveGameQuery, snapshot => {
                    if (!snapshot.empty) {
                        const liveGameDoc = snapshot.docs[0];
                        setLiveGame({ id: liveGameDoc.id, ...liveGameDoc.data() } as Session);
                    } else {
                        setLiveGame(null);
                    }
                }));

                listeners.push(onSnapshot(doc(db, 'config', 'gameDefaults'), (doc) => {
                    if (doc.exists()) {
                        setGameDefaults(doc.data() as GameDefaults);
                    }
                }));
            }

            // Admin/Owner-only listeners
            if (user.role === 'owner' || user.role === 'admin') {
                const notifsQuery = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
                listeners.push(onSnapshot(notifsQuery, snapshot => {
                    const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                    setNotifications(notifsData);
                }));
            }
            
            // Owner-only listeners
            if (user.role === 'owner') {
                const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
                listeners.push(onSnapshot(usersQuery, snapshot => {
                    const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
                    setAppUsers(usersData);
                }));
            }
        } else {
            // Clear all data if user is logged out (null) or initial state (undefined)
            setPlayers([]);
            setSessionHistory([]);
            setLiveGame(null);
            setAppUsers([]);
            setNotifications([]);
        }

        // Cleanup function
        return () => {
            listeners.forEach(unsubscribe => unsubscribe());
        };
    }, [user]);


    // Handlers
    const handleLogout = useCallback(async () => {
        await signOut(auth);
        setUser(null);
        setActiveView(View.Ranking);
    }, []);

    const handleEnterAsVisitor = async () => {
        try {
            await signInAnonymously(auth);
            // onAuthStateChanged will now handle setting the user state.
        } catch (error) {
            console.error('Anonymous sign-in failed:', error);
            showToast('Não foi possível entrar como visitante.', 'error');
        }
    };

    const handleAddPlayer = useCallback(async (playerData: Omit<Player, 'id' | 'isActive'>) => {
        try {
            await addDoc(collection(db, 'players'), { ...playerData, isActive: true });
            showToast('Jogador adicionado com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao adicionar jogador.', 'error');
        }
    }, []);

    const handleUpdatePlayer = useCallback(async (player: Player) => {
        try {
            const playerRef = doc(db, 'players', player.id);
            await updateDoc(playerRef, { ...player });
            showToast('Jogador atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar jogador.', 'error');
        }
    }, []);

    const handleDeletePlayer = useCallback(async (playerId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este jogador? Esta ação não pode ser desfeita.')) {
            try {
                await deleteDoc(doc(db, 'players', playerId));
                showToast('Jogador excluído com sucesso!');
            } catch (error) {
                console.error(error);
                showToast('Erro ao excluir jogador.', 'error');
            }
        }
    }, []);

    const handleTogglePlayerStatus = useCallback(async (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (player) {
            try {
                await updateDoc(doc(db, 'players', playerId), { isActive: !player.isActive });
                showToast(`Status de ${player.name} atualizado.`);
            } catch (error) {
                console.error(error);
                showToast('Erro ao atualizar status.', 'error');
            }
        }
    }, [players]);

    const handleStartGame = useCallback(async (playerIds: string[]) => {
        if (liveGame) {
            showToast('Já existe um jogo ativo.', 'error');
            return;
        }
        const gamePlayers: GamePlayer[] = players
            .filter(p => playerIds.includes(p.id))
            .map(p => ({
                ...p,
                buyIn: gameDefaults.buyIn,
                rebuys: 0,
                totalInvested: gameDefaults.buyIn,
                finalChips: 0,
                paid: false
            }));

        const today = new Date();
        const gameName = today.toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit', day: '2-digit' });

        try {
            await setDoc(doc(db, 'live-game', 'active-session'), {
                name: gameName,
                date: Timestamp.now(),
                players: gamePlayers
            });
            setActiveView(View.LiveGame);
            showToast('Novo jogo iniciado!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao iniciar jogo.', 'error');
        }
    }, [liveGame, players, gameDefaults]);

    const handleAddRebuy = useCallback(async (playerId: string) => {
        if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => {
            if (p.id === playerId) {
                const rebuys = p.rebuys + 1;
                const totalInvested = p.buyIn + (rebuys * gameDefaults.rebuy);
                return { ...p, rebuys, totalInvested };
            }
            return p;
        });
        await updateDoc(doc(db, 'live-game', liveGame.id), { players: updatedPlayers });
    }, [liveGame, gameDefaults]);

    const handleRemoveRebuy = useCallback(async (playerId: string) => {
        if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => {
            if (p.id === playerId && p.rebuys > 0) {
                const rebuys = p.rebuys - 1;
                const totalInvested = p.buyIn + (rebuys * gameDefaults.rebuy);
                return { ...p, rebuys, totalInvested };
            }
            return p;
        });
        await updateDoc(doc(db, 'live-game', liveGame.id), { players: updatedPlayers });
    }, [liveGame, gameDefaults]);
    
    const handleUpdateFinalChips = useCallback(async (playerId: string, chips: number) => {
        if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => p.id === playerId ? { ...p, finalChips: chips } : p);
        await updateDoc(doc(db, 'live-game', liveGame.id), { players: updatedPlayers });
    }, [liveGame]);

    const handleUpdateGameName = useCallback(async (name: string) => {
        if (!liveGame) return;
        await updateDoc(doc(db, 'live-game', liveGame.id), { name });
    }, [liveGame]);

    const handleEndGame = useCallback(async () => {
        if (!liveGame) return;
        if (window.confirm('Tem certeza que deseja encerrar e salvar o jogo no histórico?')) {
            try {
                // Mark debts as paid or not
                const finalPlayers = liveGame.players.map(p => ({
                    ...p,
                    paid: false // All players start as not paid
                }));

                await addDoc(collection(db, 'sessions'), { ...liveGame, players: finalPlayers, date: Timestamp.now() });
                await deleteDoc(doc(db, 'live-game', liveGame.id));
                showToast('Jogo salvo no histórico!');
            } catch (error) {
                console.error(error);
                showToast('Erro ao salvar jogo.', 'error');
            }
        }
    }, [liveGame]);

    const handleCancelGame = useCallback(async () => {
        if (!liveGame) return;
        if (window.confirm('Tem certeza que deseja cancelar o jogo? Todos os dados serão perdidos.')) {
            try {
                await deleteDoc(doc(db, 'live-game', liveGame.id));
                showToast('Jogo cancelado.');
            } catch (error) {
                console.error(error);
                showToast('Erro ao cancelar jogo.', 'error');
            }
        }
    }, [liveGame]);

    const handleAddPlayerToGame = useCallback(async (playerId: string) => {
        if (!liveGame) return;
        const playerToAdd = players.find(p => p.id === playerId);
        if (playerToAdd) {
            const newGamePlayer: GamePlayer = {
                ...playerToAdd,
                buyIn: gameDefaults.buyIn,
                rebuys: 0,
                totalInvested: gameDefaults.buyIn,
                finalChips: 0,
                paid: false,
            };
            const updatedPlayers = [...liveGame.players, newGamePlayer];
            await updateDoc(doc(db, 'live-game', liveGame.id), { players: updatedPlayers });
            showToast(`${playerToAdd.name} foi adicionado ao jogo.`);
        }
    }, [liveGame, players, gameDefaults]);
    
    const handleEditHistoricGame = useCallback(async (session: Session) => {
        try {
            const sessionRef = doc(db, 'sessions', session.id);
            const parts = session.name.split('/');
            const date = new Date(parseInt(`20${parts[2]}`, 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            const newTimestamp = Timestamp.fromDate(date);

            await updateDoc(sessionRef, { ...session, date: newTimestamp });
            showToast('Jogo histórico atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar o jogo.', 'error');
        }
    }, []);

    const handleSettleDebts = useCallback(async (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (player && window.confirm(`Tem certeza que deseja quitar todas as dívidas de ${player.name}?`)) {
            try {
                const batch = writeBatch(db);
                const sessionsToUpdate = sessionHistory.filter(s => s.players.some(p => p.id === playerId && !p.paid));
                
                sessionsToUpdate.forEach(session => {
                    const updatedPlayers = session.players.map(p => p.id === playerId ? { ...p, paid: true } : p);
                    batch.update(doc(db, 'sessions', session.id), { players: updatedPlayers });
                });
                await batch.commit();
                showToast('Dívidas quitadas com sucesso!');
            } catch (error) {
                console.error(error);
                showToast('Erro ao quitar dívidas.', 'error');
            }
        }
    }, [players, sessionHistory]);

    const handleUpdateUserRole = useCallback(async (uid: string, role: UserRole) => {
        try {
            await updateDoc(doc(db, 'users', uid), { role });
            showToast('Cargo do usuário atualizado.');
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar cargo.', 'error');
        }
    }, []);

    const handleSaveDefaults = useCallback(async (defaults: GameDefaults) => {
        try {
            await setDoc(doc(db, 'config', 'gameDefaults'), defaults);
            showToast('Valores padrão salvos com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar valores padrão.', 'error');
        }
    }, []);

    const handleAddUser = useCallback(async (userData: Omit<AppUser, 'uid'>, password: string): Promise<boolean> => {
        try {
            const tempUserCred = await createUserWithEmailAndPassword(auth, userData.email, password);
            await setDoc(doc(db, 'users', tempUserCred.user.uid), {
                name: userData.name,
                email: userData.email,
                role: userData.role,
            });
            showToast('Usuário criado com sucesso!');
            return true;
        } catch (error: any) {
            console.error(error);
            showToast(`Erro ao criar usuário: ${error.message}`, 'error');
            return false;
        }
    }, []);
    
    const handleDeleteUser = useCallback(async (uid: string) => {
        if (window.confirm('Excluir este usuário também o removerá da autenticação do Firebase. Esta ação é irreversível. Continuar?')) {
            try {
                await deleteDoc(doc(db, 'users', uid));
                showToast('Usuário excluído do banco de dados. Remova-o da Autenticação do Firebase manualmente.');
            } catch (error) {
                console.error(error);
                showToast('Erro ao excluir usuário.', 'error');
            }
        }
    }, []);

    // View Profile / Session
    const handleViewProfile = (playerId: string) => {
        setViewingPlayerId(playerId);
        setActiveView(View.PlayerProfile);
    };

    const handleViewSession = (sessionId: string) => {
        setInitialSessionId(sessionId);
        setActiveView(View.SessionHistory);
    };

    const renderView = () => {
        if (activeView === View.PlayerProfile && viewingPlayerId) {
            return <PlayerProfile playerId={viewingPlayerId} players={players} sessionHistory={sessionHistory} onBack={() => { setViewingPlayerId(null); setActiveView(View.Ranking); }} />;
        }

        switch(activeView) {
            case View.LiveGame:
                return <LiveGame isUserAdmin={isUserAdmin} players={liveGame?.players || []} allPlayers={players} gameName={liveGame?.name || null} onAddRebuy={handleAddRebuy} onRemoveRebuy={handleRemoveRebuy} onUpdateFinalChips={handleUpdateFinalChips} onUpdateGameName={handleUpdateGameName} onEndGame={handleEndGame} onCancelGame={handleCancelGame} onGoToPlayers={() => setActiveView(View.Players)} onAddPlayerToGame={handleAddPlayerToGame} onViewProfile={handleViewProfile} gameDefaults={gameDefaults} />;
            case View.Players:
                return <Players isUserAdmin={isUserAdmin} players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onStartGame={handleStartGame} onTogglePlayerStatus={handleTogglePlayerStatus} onViewProfile={handleViewProfile} />;
            case View.SessionHistory:
                return <SessionHistory isUserAdmin={isUserAdmin} sessionHistory={sessionHistory} players={players} onEditHistoricGame={handleEditHistoricGame} onViewProfile={handleViewProfile} initialSessionId={initialSessionId} onClearInitialSession={() => setInitialSessionId(null)} />;
            case View.Ranking:
                return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} onViewSession={handleViewSession} />;
            case View.Cashier:
                return <Cashier isUserAdmin={isUserAdmin} sessions={sessionHistory} players={players} onSettleDebts={handleSettleDebts} onViewProfile={handleViewProfile} />;
            case View.Settings:
                 return isUserAuthenticated && isUserAdmin ? <Settings isUserOwner={isUserOwner} appUsers={appUsers} onUpdateUserRole={handleUpdateUserRole} onSaveDefaults={handleSaveDefaults} gameDefaults={gameDefaults} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} /> : null;
            default:
                return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} onViewSession={handleViewSession} />;
        }
    };
    
    if (isLoading) {
        return (
            <div className="bg-poker-dark min-h-screen flex items-center justify-center">
                <SpadeTreeLogo className="h-32 w-32 animate-pulse" />
            </div>
        );
    }

    if (!user) {
        return <Auth onEnterAsVisitor={handleEnterAsVisitor} />;
    }
    
    if (user.role === 'pending') {
        return (
            <div className="bg-poker-dark min-h-screen flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold text-white mb-4">Aguardando Aprovação</h1>
                <p className="text-poker-gray mb-6">Sua conta está pendente de aprovação por um administrador.</p>
                <button onClick={handleLogout} className="px-6 py-2 text-white bg-poker-gold hover:bg-poker-gold/80 font-semibold rounded-lg text-sm">
                    Sair
                </button>
            </div>
        );
    }

    return (
        <div className="bg-poker-dark min-h-screen text-white">
            <Header
                isUserAuthenticated={isUserAuthenticated}
                activeView={activeView}
                setActiveView={setActiveView}
                onOpenMenu={() => setIsMenuOpen(true)}
                userRole={userRole}
                onLogout={handleLogout}
            />
            <main className="container mx-auto p-2 sm:p-4 md:p-8">
                {renderView()}
            </main>
            <MenuPanel
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                user={user}
                userRole={userRole}
                notifications={notifications}
                isUserAdmin={isUserAdmin}
                onGoToSettings={() => {
                    setActiveView(View.Settings);
                    setIsMenuOpen(false);
                }}
                onLogout={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                }}
            />
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
            />
        </div>
    );
};

export default App;
