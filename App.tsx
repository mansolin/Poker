import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import { 
    onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInAnonymously,
    setPersistence, browserSessionPersistence
} from 'firebase/auth';
import { 
    collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp 
} from 'firebase/firestore';

// Types
import type { Player, Session, GamePlayer, AppUser, UserRole, ToastState, GameDefaults, Notification, DinnerSession, DinnerParticipant } from './types';
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
import Dinner from './components/Dinner';

const App: React.FC = () => {
    // Auth state: undefined = loading, null = logged out, AppUser = logged in/visitor
    const [user, setUser] = useState<AppUser | null | undefined>(undefined);

    // Data state
    const [players, setPlayers] = useState<Player[]>([]);
    const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
    const [dinnerHistory, setDinnerHistory] = useState<DinnerSession[]>([]);
    const [liveGame, setLiveGame] = useState<Session | null>(null);
    const [liveDinner, setLiveDinner] = useState<DinnerSession | null>(null);
    const [appUsers, setAppUsers] = useState<AppUser[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [gameDefaults, setGameDefaults] = useState<GameDefaults>({ buyIn: 50, rebuy: 50, clubPixKey: '' });

    // UI state
    const [activeView, setActiveView] = useState<View>(View.Ranking);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
    const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
    const [initialSessionId, setInitialSessionId] = useState<string | null>(null);
    const [isVisitorLoggingIn, setIsVisitorLoggingIn] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const isLoading = user === undefined;
    const userRole: UserRole = user?.role || 'visitor';
    const isUserAdmin = userRole === 'admin' || userRole === 'owner';
    const isUserOwner = userRole === 'owner';
    const isUserAuthenticated = !!user && user.role !== 'visitor' && user.role !== 'pending';

    // Toast helper
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    // Helper to normalize Firestore Timestamps
    const normalizeTimestamp = (timestamp: any): Timestamp => {
        if (!timestamp) return Timestamp.now();
        // Check if it's already a Firestore Timestamp
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp as Timestamp;
        }
        // Check if it's a Firestore-like object from a different context
        if (timestamp.seconds && typeof timestamp.seconds === 'number') {
            return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0);
        }
        // Check if it's a JS Date object
        if (timestamp instanceof Date) {
            return Timestamp.fromDate(timestamp);
        }
        // Fallback for unexpected formats like strings
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return Timestamp.fromDate(date);
        }
        
        console.warn('Invalid date format encountered, using current time as fallback.', timestamp);
        return Timestamp.now();
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
                        // User exists in Auth, but not in Firestore. This can happen on first-time social login,
                        // or if the user record was deleted from Firestore but not from Auth.
                        const isSocialLogin = firebaseUser.providerData.some(
                            (provider) => provider.providerId !== 'password'
                        );

                        // Also check if this is a genuinely new user account in Auth by checking creation time against last sign in
                        const tolerance = 5 * 1000; // 5 seconds tolerance
                        const creationTime = new Date(firebaseUser.metadata.creationTime || 0).getTime();
                        const lastSignInTime = new Date(firebaseUser.metadata.lastSignInTime || 0).getTime();
                        const isNewAuthUser = Math.abs(creationTime - lastSignInTime) < tolerance;

                        if (isSocialLogin || isNewAuthUser) {
                            // This is likely a first-time sign-in. Create a 'pending' user doc.
                            const newUser: AppUser = {
                                uid: firebaseUser.uid,
                                name: firebaseUser.displayName || "Novo Usuário",
                                email: firebaseUser.email || "",
                                role: 'pending',
                            };
                            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                            setUser(newUser);
                        } else {
                            // This is an existing email/password user with a missing Firestore document.
                            // This indicates a data inconsistency. Do not create a new user and overwrite their role.
                            console.error(`Inconsistent state: User ${firebaseUser.uid} exists in Auth but is missing from Firestore.`);
                            showToast('Ocorreu um erro com sua conta. Por favor, contate o suporte.', 'error');
                            signOut(auth); // Log the user out to prevent them from using the app in a broken state.
                        }
                    }
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setIsVisitorLoggingIn(false); // Stop visitor loading spinner
        });
        return () => unsubscribeAuth();
    }, [showToast]);

    // Firestore Listeners
    useEffect(() => {
        // Only set up listeners if the user is logged in (including visitors)
        if (!user) {
            // Clear data when user logs out
            setPlayers([]);
            setSessionHistory([]);
            setDinnerHistory([]);
            setLiveGame(null);
            setLiveDinner(null);
            setAppUsers([]);
            setNotifications([]);
            return;
        }

        const handleError = (collectionName: string) => (error: Error) => {
            const message = `Firestore permission error on '${collectionName}' collection: ${error.message}`;
            // For visitors, we expect some collections might be restricted.
            // We log it for debugging but don't show a disruptive toast.
            // The UI will gracefully handle the absence of data.
            if (userRole === 'visitor') {
                console.warn(message);
            } else {
                console.error(message);
                showToast(`Permissão negada para carregar ${collectionName}.`, "error");
            }
        };

        // Players listener
        const qPlayers = query(collection(db, 'players'), orderBy('name', 'asc'));
        const unsubscribePlayers = onSnapshot(qPlayers, snapshot => {
            setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
        }, handleError('jogadores'));

        // Sessions listener
        const qSessions = query(collection(db, 'sessions'), orderBy('date', 'desc'));
        const unsubscribeSessions = onSnapshot(qSessions, snapshot => {
            setSessionHistory(snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data, 
                    date: normalizeTimestamp(data.date) 
                } as Session;
            }));
        }, handleError('histórico'));

        // Live Game listener (for all users)
        const unsubscribeLiveGame = onSnapshot(doc(db, 'live_game', 'current_session'), doc => {
            if (doc.exists()) {
                const data = doc.data();
                setLiveGame({
                    id: doc.id,
                    ...data,
                    date: normalizeTimestamp(data.date)
                } as Session);
            } else {
                setLiveGame(null);
            }
        }, handleError('jogo ao vivo'));
        
        // Live Dinner listener (for all users)
        const unsubscribeLiveDinner = onSnapshot(doc(db, 'live_dinner', 'current_dinner'), doc => {
            if (doc.exists()) {
                const data = doc.data();
                setLiveDinner({
                    id: doc.id,
                    ...data,
                    date: normalizeTimestamp(data.date)
                } as DinnerSession);
            } else {
                setLiveDinner(null);
            }
        }, handleError('jantar'));

        // Dinner History listener
        const qDinnerHistory = query(collection(db, 'dinner_sessions'), orderBy('date', 'desc'));
        const unsubscribeDinnerHistory = onSnapshot(qDinnerHistory, snapshot => {
            setDinnerHistory(snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: normalizeTimestamp(data.date)
                } as DinnerSession;
            }));
        }, handleError('histórico de jantares'));

        // Users listener (for admins)
        let unsubscribeUsers = () => {};
        if (isUserAdmin) {
            const qUsers = query(collection(db, 'users'), orderBy('name', 'asc'));
            unsubscribeUsers = onSnapshot(qUsers, snapshot => {
                setAppUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
            }, handleError('usuários'));
        } else {
            setAppUsers([]);
        }
        
        // Notifications listener (for authenticated members only)
        let unsubscribeNotifications = () => {};
        if (isUserAuthenticated) {
            const qNotifications = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
            unsubscribeNotifications = onSnapshot(qNotifications, snapshot => {
                setNotifications(snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: normalizeTimestamp(data.timestamp)
                    } as Notification;
                }));
            }, handleError('notificações'));
        } else {
            setNotifications([]); // Clear notifications for visitors
        }

        // Game Defaults listener
        const unsubscribeGameDefaults = onSnapshot(doc(db, 'config', 'game_defaults'), doc => {
            if (doc.exists()) {
                const loadedDefaults = doc.data() as Partial<GameDefaults>;
                // Merge with previous state to ensure no fields become undefined
                setGameDefaults(prevDefaults => ({
                    ...prevDefaults,
                    ...loadedDefaults,
                }));
            }
        }, handleError('configurações'));

        return () => {
            unsubscribePlayers();
            unsubscribeSessions();
            unsubscribeLiveGame();
            unsubscribeLiveDinner();
            unsubscribeDinnerHistory();
            unsubscribeUsers();
            unsubscribeNotifications();
            unsubscribeGameDefaults();
        };
    }, [user, isUserAdmin, isUserAuthenticated, userRole, showToast]);

    // Auth Handlers
    const handleLogout = useCallback(() => {
        signOut(auth);
        setActiveView(View.Ranking);
    }, []);
    
    const handleEnterAsVisitor = useCallback(async () => {
        setIsVisitorLoggingIn(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Anonymous sign-in failed:", error);
            setAuthError('Não foi possível entrar como visitante. Tente novamente.');
            setIsVisitorLoggingIn(false);
        }
    }, []);

    // Game Handlers
    const handleStartGame = useCallback(async (playerIds: string[], gameName: string) => {
        if (!isUserAdmin) {
            showToast('Apenas administradores podem iniciar um jogo.', 'error');
            return;
        }
        if (!user) {
            showToast('Erro: Usuário não encontrado para iniciar o jogo.', 'error');
            return;
        }
        if (playerIds.length < 2) {
            showToast('Selecione pelo menos 2 jogadores para iniciar um jogo.', 'error');
            return;
        }
        const selectedPlayers = players.filter(p => playerIds.includes(p.id));
        const gamePlayers: GamePlayer[] = selectedPlayers.map(p => ({
            ...p,
            buyIn: gameDefaults.buyIn,
            rebuys: 0,
            totalInvested: gameDefaults.buyIn,
            finalChips: 0,
            paid: false,
        }));

        const newGame: Omit<Session, 'id'> = {
            name: gameName,
            date: Timestamp.now(),
            players: gamePlayers,
            createdBy: user.uid,
        };

        try {
            await setDoc(doc(db, 'live_game', 'current_session'), newGame);
            setActiveView(View.LiveGame);
            showToast('Jogo iniciado com sucesso!', 'success');
        } catch (error) {
            console.error("Error starting game:", error);
            showToast('Erro ao iniciar o jogo.', 'error');
        }
    }, [isUserAdmin, players, gameDefaults, setActiveView, showToast, user]);

    const handleUpdateLiveGame = useCallback(async (updatedPlayers: GamePlayer[], gameName?: string) => {
        if (!isUserAdmin || !liveGame) return;
        try {
            const updateData: Partial<Session> = { players: updatedPlayers };
            if (gameName !== undefined) {
                updateData.name = gameName;
            }
            await updateDoc(doc(db, 'live_game', 'current_session'), updateData);
        } catch (error) {
            console.error("Error updating game:", error);
            showToast('Erro ao atualizar o jogo.', 'error');
        }
    }, [isUserAdmin, liveGame, showToast]);
    
    const handleAddRebuy = useCallback((playerId: string) => {
        if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => {
            if (p.id === playerId) {
                return { ...p, rebuys: p.rebuys + 1, totalInvested: p.totalInvested + gameDefaults.rebuy };
            }
            return p;
        });
        handleUpdateLiveGame(updatedPlayers);
    }, [liveGame, gameDefaults.rebuy, handleUpdateLiveGame]);

    const handleRemoveRebuy = useCallback((playerId: string) => {
         if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => {
            if (p.id === playerId && p.rebuys > 0) {
                return { ...p, rebuys: p.rebuys - 1, totalInvested: p.totalInvested - gameDefaults.rebuy };
            }
            return p;
        });
        handleUpdateLiveGame(updatedPlayers);
    }, [liveGame, gameDefaults.rebuy, handleUpdateLiveGame]);

    const handleUpdateFinalChips = useCallback((playerId: string, chips: number) => {
         if (!liveGame) return;
        const updatedPlayers = liveGame.players.map(p => {
            if (p.id === playerId) {
                return { ...p, finalChips: chips };
            }
            return p;
        });
        handleUpdateLiveGame(updatedPlayers);
    }, [liveGame, handleUpdateLiveGame]);

    const handleUpdateGameName = useCallback((name: string) => {
        if (!liveGame) return;
        handleUpdateLiveGame(liveGame.players, name);
    }, [liveGame, handleUpdateLiveGame]);
    
    const handleAddPlayerToGame = useCallback((playerId: string) => {
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
            handleUpdateLiveGame(updatedPlayers);
        }
    }, [liveGame, players, gameDefaults.buyIn, handleUpdateLiveGame]);
    
    const handleRemovePlayerFromGame = useCallback((playerId: string) => {
        if (!liveGame) return;
        if (window.confirm("Tem certeza que deseja remover este jogador do jogo?")) {
            const updatedPlayers = liveGame.players.filter(p => p.id !== playerId);
            handleUpdateLiveGame(updatedPlayers);
        }
    }, [liveGame, handleUpdateLiveGame]);

    const handleEndGame = useCallback(async () => {
        if (!isUserAdmin || !liveGame) return;
        
        const finalPlayers = liveGame.players.map(p => ({
            ...p,
            paid: (p.finalChips - p.totalInvested) === 0
        }));

        const sessionToSave: Omit<Session, 'id'> = {
            ...liveGame,
            players: finalPlayers,
            date: Timestamp.now(), 
        };

        try {
            await addDoc(collection(db, 'sessions'), sessionToSave);
            await deleteDoc(doc(db, 'live_game', 'current_session'));
            setActiveView(View.SessionHistory);
            showToast('Jogo salvo com sucesso!', 'success');
        } catch (error) {
            console.error("Error ending game:", error);
            showToast('Erro ao salvar o jogo.', 'error');
        }
    }, [isUserAdmin, liveGame, setActiveView, showToast]);

    const handleCancelGame = useCallback(async () => {
        if (!isUserAdmin) return;
        if (window.confirm("Tem certeza que deseja cancelar o jogo? Todos os dados serão perdidos.")) {
            try {
                await deleteDoc(doc(db, 'live_game', 'current_session'));
                showToast('Jogo cancelado.');
            } catch (error) {
                console.error("Error cancelling game:", error);
                showToast('Erro ao cancelar o jogo.', 'error');
            }
        }
    }, [isUserAdmin, showToast]);

    // Player Handlers
    const handleAddPlayer = useCallback(async (playerData: Omit<Player, 'id' | 'isActive'>) => {
        if (!isUserAdmin) return;
        try {
            await addDoc(collection(db, 'players'), { ...playerData, isActive: true });
            showToast('Jogador adicionado!', 'success');
        } catch (error) {
            console.error("Error adding player:", error);
            showToast('Erro ao adicionar jogador.', 'error');
        }
    }, [isUserAdmin, showToast]);

    const handleUpdatePlayer = useCallback(async (player: Player) => {
        if (!isUserAdmin) return;
        try {
            const { id, ...playerData } = player;
            await updateDoc(doc(db, 'players', id), playerData);
            showToast('Jogador atualizado!', 'success');
        } catch (error) {
            console.error("Error updating player:", error);
            showToast('Erro ao atualizar jogador.', 'error');
        }
    }, [isUserAdmin, showToast]);

    const handleDeletePlayer = useCallback(async (playerId: string) => {
        if (!isUserAdmin) return;
        if (window.confirm("Tem certeza? Esta ação removerá o jogador permanentemente.")) {
            try {
                await deleteDoc(doc(db, 'players', playerId));
                showToast('Jogador excluído.', 'success');
            } catch (error) {
                console.error("Error deleting player:", error);
                showToast('Erro ao excluir jogador.', 'error');
            }
        }
    }, [isUserAdmin, showToast]);

    const handleTogglePlayerStatus = useCallback(async (playerId: string) => {
        if (!isUserAdmin) return;
        const player = players.find(p => p.id === playerId);
        if (player) {
            try {
                await updateDoc(doc(db, 'players', playerId), { isActive: !player.isActive });
                showToast(`Jogador ${player.isActive ? 'inativado' : 'ativado'}.`);
            } catch (error) {
                showToast('Erro ao alterar status.', 'error');
            }
        }
    }, [isUserAdmin, players, showToast]);

    // History & Profile Handlers
    const handleEditHistoricGame = useCallback(async (session: Session) => {
        if (!isUserAdmin) {
            showToast('Apenas administradores podem editar o histórico.', 'error');
            return;
        }
        try {
            const { id, ...sessionData } = session;
            await updateDoc(doc(db, 'sessions', id), sessionData);
            showToast('Histórico do jogo atualizado!', 'success');
        } catch (error) {
            console.error("Error updating historic game:", error);
            showToast('Erro ao atualizar o histórico. Verifique as permissões.', 'error');
        }
    }, [isUserAdmin, showToast]);

    const handleDeleteHistoricGame = useCallback(async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
        if (!isUserAdmin) {
            const msg = 'Apenas administradores podem excluir jogos.';
            showToast(msg, 'error');
            return { success: false, message: msg };
        }

        try {
            await deleteDoc(doc(db, 'sessions', sessionId));
            showToast('Jogo excluído do histórico.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Error deleting session:", error);
            const msg = 'Erro ao excluir o jogo. Verifique as permissões no Firebase.';
            showToast(msg, 'error');
            return { success: false, message: msg };
        }
    }, [isUserAdmin, showToast]);


    const handleViewProfile = (playerId: string) => {
        setViewingPlayerId(playerId);
        setActiveView(View.PlayerProfile);
    };

    const handleViewSession = (sessionId: string) => {
        setInitialSessionId(sessionId);
        setActiveView(View.SessionHistory);
    };

    // Cashier Handler
    const handleSettleBalance = useCallback(async (playerId: string) => {
        if (!isUserAdmin) return;
        
        const sessionsToUpdate = sessionHistory.filter(session => 
            session.players.some(p => p.id === playerId && !p.paid)
        );

        if (sessionsToUpdate.length > 0) {
            const batch = writeBatch(db);
            sessionsToUpdate.forEach(session => {
                const updatedPlayers = session.players.map(p => 
                    p.id === playerId ? { ...p, paid: true } : p
                );
                batch.update(doc(db, 'sessions', session.id), { players: updatedPlayers });
            });

            try {
                await batch.commit();
                showToast('Saldo quitado com sucesso!', 'success');
            } catch (error) {
                console.error("Error settling balance:", error);
                showToast('Erro ao quitar saldo.', 'error');
            }
        }
    }, [isUserAdmin, sessionHistory, showToast]);

    // Dinner Handlers
    const handleStartDinner = useCallback(async (participantIds: string[]) => {
        if (!isUserAdmin || !user) {
            showToast('Apenas administradores podem iniciar um jantar.', 'error');
            return;
        }
        const participantsData = players.filter(p => participantIds.includes(p.id));
        const dinnerParticipants: DinnerParticipant[] = participantsData.map(p => ({
            id: p.id,
            name: p.name,
            isEating: true,
            isDrinking: true,
            amountOwed: 0,
        }));
        
        const date = new Date();
        const dinnerName = date.toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit', day: '2-digit' });

        const newDinner: Omit<DinnerSession, 'id'> = {
            name: dinnerName,
            date: Timestamp.fromDate(date),
            participants: dinnerParticipants,
            totalFoodCost: 0,
            totalDrinkCost: 0,
            isFinalized: false,
            createdBy: user.uid,
        };

        try {
            await setDoc(doc(db, 'live_dinner', 'current_dinner'), newDinner);
            showToast('Jantar iniciado!', 'success');
        } catch (error) {
            console.error("Error starting dinner:", error);
            showToast('Erro ao iniciar o jantar. Verifique suas permissões.', 'error');
        }
    }, [isUserAdmin, players, showToast, user]);

    const handleUpdateDinner = useCallback(async (updatedDinnerData: Partial<DinnerSession>) => {
        if (!isUserAdmin || !liveDinner) return;
        try {
            await updateDoc(doc(db, 'live_dinner', 'current_dinner'), updatedDinnerData);
        } catch (error) {
            console.error("Error updating dinner:", error);
            showToast('Erro ao atualizar o jantar.', 'error');
        }
    }, [isUserAdmin, liveDinner, showToast]);

    const handleFinalizeDinner = useCallback(async () => {
        if (!isUserAdmin || !liveDinner) return;
        if (window.confirm("Finalizar e salvar o jantar? Esta ação moverá os dados para o histórico.")) {
            // Recalculate amounts to ensure they are correct before saving
            const eatingCount = liveDinner.participants.filter(p => p.isEating).length;
            const drinkingCount = liveDinner.participants.filter(p => p.isDrinking).length;

            const foodPerPerson = eatingCount > 0 ? liveDinner.totalFoodCost / eatingCount : 0;
            const drinkPerPerson = drinkingCount > 0 ? liveDinner.totalDrinkCost / drinkingCount : 0;
            
            const finalParticipants = liveDinner.participants.map(p => {
                let amountOwed = 0;
                if (p.isEating) amountOwed += foodPerPerson;
                if (p.isDrinking) amountOwed += drinkPerPerson;
                return {...p, amountOwed: Math.round(amountOwed * 100) / 100 };
            });

            const dinnerToSave: Omit<DinnerSession, 'id'> = {
                ...liveDinner,
                participants: finalParticipants,
                isFinalized: true,
                date: Timestamp.now(),
            };
            
            try {
                await addDoc(collection(db, 'dinner_sessions'), dinnerToSave);
                await deleteDoc(doc(db, 'live_dinner', 'current_dinner'));
                showToast('Jantar salvo no histórico com sucesso!');
            } catch (error) {
                console.error("Error finalizing dinner:", error);
                showToast('Erro ao finalizar o jantar. Verifique as regras de segurança.', 'error');
            }
        }
    }, [isUserAdmin, liveDinner, showToast]);

    const handleCancelDinner = useCallback(async () => {
        if (!isUserAdmin) return;
        if (window.confirm("Tem certeza que deseja cancelar o jantar?")) {
            try {
                await deleteDoc(doc(db, 'live_dinner', 'current_dinner'));
                showToast('Jantar cancelado.');
            } catch (error) {
                showToast('Erro ao cancelar o jantar.', 'error');
            }
        }
    }, [isUserAdmin, showToast]);
    
    const handleDeleteDinnerSession = useCallback(async (dinnerSessionId: string): Promise<{ success: boolean; message?: string }> => {
        if (!isUserAdmin) {
            const msg = 'Apenas administradores podem excluir jantares.';
            showToast(msg, 'error');
            return { success: false, message: msg };
        }

        try {
            await deleteDoc(doc(db, 'dinner_sessions', dinnerSessionId));
            showToast('Jantar excluído do histórico.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Error deleting dinner session:", error);
            const msg = 'Erro ao excluir o jantar. Verifique as permissões.';
            showToast(msg, 'error');
            return { success: false, message: msg };
        }
    }, [isUserAdmin, showToast]);


    // Settings Handlers
    const handleSaveDefaults = useCallback(async (defaults: GameDefaults) => {
        if (!isUserAdmin) return;
        try {
            await setDoc(doc(db, 'config', 'game_defaults'), defaults);
            showToast('Configurações salvas!', 'success');
        } catch (error) {
            showToast('Erro ao salvar configurações.', 'error');
        }
    }, [isUserAdmin, showToast]);
    
    const handleUpdateUserRole = useCallback(async (uid: string, role: UserRole) => {
        if (!isUserOwner) return;
        try {
            await updateDoc(doc(db, 'users', uid), { role });
            showToast('Cargo do usuário atualizado.', 'success');
        } catch (error) {
            showToast('Erro ao atualizar cargo.', 'error');
        }
    }, [isUserOwner, showToast]);

    const handleAddUser = async (userData: Omit<AppUser, 'uid'>, password: string): Promise<boolean> => {
        if (!isUserOwner) return false;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: userData.name,
                email: userData.email,
                role: userData.role,
            });
            showToast('Usuário criado com sucesso!', 'success');
            return true;
        } catch (error: any) {
            console.error("User creation failed", error);
            const message = error.code === 'auth/email-already-in-use' 
                ? 'Este e-mail já está em uso.'
                : 'Erro ao criar usuário.';
            showToast(message, 'error');
            return false;
        }
    };
    
     const handleDeleteUser = useCallback(async (uid: string) => {
        if (!isUserOwner) {
            showToast('Apenas o dono pode excluir usuários.', 'error');
            return Promise.reject(new Error('Permission denied'));
        }

        const userToDelete = appUsers.find(u => u.uid === uid);
        if (userToDelete?.email === 'marcioansolin@gmail.com') {
            showToast('Não é possível excluir o usuário dono do aplicativo.', 'error');
            return Promise.reject(new Error('Cannot delete owner'));
        }
        
        try {
            await deleteDoc(doc(db, 'users', uid));
            showToast("Registro de usuário excluído do app.", 'success');
        } catch (error) {
            console.error("Error deleting user from Firestore:", error);
            showToast("Erro ao excluir registro de usuário.", 'error');
            throw error;
        }
    }, [isUserOwner, showToast, appUsers]);

    // UI Render Logic
    const renderView = () => {
        if (viewingPlayerId) {
            return <PlayerProfile playerId={viewingPlayerId} players={players} sessionHistory={sessionHistory} onBack={() => setViewingPlayerId(null)} />;
        }
        switch (activeView) {
            case View.LiveGame:
                return <LiveGame 
                            isUserAdmin={isUserAdmin} 
                            players={liveGame?.players || []} 
                            allPlayers={players}
                            gameName={liveGame?.name || null}
                            onAddRebuy={handleAddRebuy}
                            onRemoveRebuy={handleRemoveRebuy}
                            onUpdateFinalChips={handleUpdateFinalChips}
                            onUpdateGameName={handleUpdateGameName}
                            onEndGame={handleEndGame}
                            onCancelGame={handleCancelGame}
                            onGoToPlayers={() => setActiveView(View.Players)}
                            onAddPlayerToGame={handleAddPlayerToGame}
                            onRemovePlayerFromGame={handleRemovePlayerFromGame}
                            gameDefaults={gameDefaults}
                        />;
            case View.Players:
                return <Players 
                            isUserAdmin={isUserAdmin} 
                            players={players} 
                            onAddPlayer={handleAddPlayer} 
                            onUpdatePlayer={handleUpdatePlayer}
                            onDeletePlayer={handleDeletePlayer}
                            onStartGame={handleStartGame} 
                            onTogglePlayerStatus={handleTogglePlayerStatus}
                            onViewProfile={handleViewProfile}
                        />;
            case View.SessionHistory:
                return <SessionHistory 
                            isUserAdmin={isUserAdmin}
                            sessionHistory={sessionHistory} 
                            players={players} 
                            onEditHistoricGame={handleEditHistoricGame}
                            onDeleteHistoricGame={handleDeleteHistoricGame}
                            onViewProfile={handleViewProfile}
                            initialSessionId={initialSessionId}
                            onClearInitialSession={() => setInitialSessionId(null)}
                        />;
            case View.Cashier:
                return <Cashier 
                            isUserAdmin={isUserAdmin}
                            sessions={sessionHistory} 
                            players={players} 
                            onSettleBalance={handleSettleBalance}
                            onViewProfile={handleViewProfile}
                            clubPixKey={gameDefaults.clubPixKey}
                            onShowToast={showToast}
                        />;
            case View.Settings:
                if (!isUserAdmin) {
                    return (
                        <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-4">Acesso Negado</h2>
                            <p className="text-poker-gray">Você não tem permissão para acessar esta página.</p>
                        </div>
                    );
                }
                return <Settings 
                    isUserOwner={isUserOwner}
                    appUsers={appUsers}
                    onUpdateUserRole={handleUpdateUserRole}
                    onSaveDefaults={handleSaveDefaults}
                    gameDefaults={gameDefaults}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                />;
            case View.Expenses:
                return <Dinner 
                            isUserAdmin={isUserAdmin}
                            isUserOwner={isUserOwner}
                            allPlayers={players}
                            liveDinner={liveDinner}
                            dinnerHistory={dinnerHistory}
                            onStartDinner={handleStartDinner}
                            onUpdateDinner={handleUpdateDinner}
                            onFinalizeDinner={handleFinalizeDinner}
                            onCancelDinner={handleCancelDinner}
                            onDeleteDinnerSession={handleDeleteDinnerSession}
                        />;
            case View.Ranking:
            default:
                return <Ranking 
                            sessionHistory={sessionHistory}
                            onViewProfile={handleViewProfile}
                            onViewSession={handleViewSession}
                        />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-poker-dark">
                <SpadeTreeLogo className="h-24 w-24 animate-pulse" />
            </div>
        );
    }

    if (!user) {
        return <Auth onEnterAsVisitor={handleEnterAsVisitor} isVisitorLoggingIn={isVisitorLoggingIn} authError={authError} onSetAuthError={setAuthError} />;
    }

    return (
        <div className="min-h-screen bg-poker-dark">
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
                onLogout={handleLogout}
            />
            <Toast {...toast} />
        </div>
    );
};

export default App;