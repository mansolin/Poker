
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SessionHistory from './components/SessionHistory';
import AddHistoricGame from './components/AddHistoricGame';
import Auth from './components/Auth';
import PlayerProfile from './components/PlayerProfile';
import Cashier from './components/Cashier';
import Settings from './components/Settings';
import Toast from './components/Toast';
import ClockIcon from './components/icons/ClockIcon';
import type { Player, GamePlayer, Session, ToastState, AppUser, UserRole, GameDefaults } from './types';
import { View } from './types';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy, setDoc, writeBatch, getDoc, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('visitor');
  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [activeView, setActiveView] = useState<View>(View.Ranking);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [currentGameName, setCurrentGameName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [gameDefaults, setGameDefaults] = useState<GameDefaults>({ buyIn: 50, rebuy: 50 });

  const isUserAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsVisitorMode(false);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          setUserRole(userData.role);
        } else {
          // User document doesn't exist, create it.
          // Check if an owner already exists.
          const usersRef = collection(db, 'users');
          const ownerQuery = query(usersRef, where("role", "==", "owner"));
          const ownerSnapshot = await getDocs(ownerQuery);

          const newRole: UserRole = ownerSnapshot.empty ? 'owner' : 'pending';
          
          const newUserDocData: Omit<AppUser, 'uid'> = {
              name: currentUser.displayName || currentUser.email || 'Novo Usuário',
              email: currentUser.email || '',
              role: newRole
          };

          await setDoc(userDocRef, newUserDocData);
          setUserRole(newRole);

          if (newRole === 'owner') {
            showToast('Sua conta de Dono foi configurada!', 'success');
          }
        }
      } else {
        setUserRole('visitor');
        setIsVisitorMode(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubAppUsers: () => void = () => {};
    if (userRole === 'owner') {
        unsubAppUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setAppUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
        });
    } else {
        setAppUsers([]);
    }
    return () => unsubAppUsers();
  }, [userRole]);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });
    const sessionsQuery = query(collection(db, 'sessions'), orderBy('date', 'desc'));
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      setSessionHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));
    });
    const unsubLiveGame = onSnapshot(doc(db, 'liveGame', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        const liveGameData = snapshot.data();
        setGamePlayers(liveGameData.players || []);
        setCurrentGameName(liveGameData.gameName || null);
      } else {
        setGamePlayers([]);
        setCurrentGameName(null);
      }
    });
    const unsubConfig = onSnapshot(doc(db, 'config', 'defaults'), (snapshot) => {
        if (snapshot.exists()) {
            setGameDefaults(snapshot.data() as GameDefaults);
        }
    });
    return () => { unsubPlayers(); unsubSessions(); unsubLiveGame(); unsubConfig(); };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleAddPlayer = async (player: Omit<Player, 'id' | 'isActive'>) => {
    if (!isUserAdmin) return;
    try {
      await addDoc(collection(db, 'players'), { ...player, isActive: true });
      showToast('Jogador adicionado com sucesso!');
    } catch (e) { showToast('Erro ao adicionar jogador.', 'error'); }
  };
  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    if (!isUserAdmin) return;
    const { id, ...playerData } = updatedPlayer;
    try {
      await updateDoc(doc(db, 'players', id), playerData);
      showToast('Jogador atualizado com sucesso!');
    } catch (e) { showToast('Erro ao atualizar jogador.', 'error'); }
  };
  const handleDeletePlayer = async (playerId: string) => {
    if (!isUserAdmin) return;
    if (sessionHistory.some(s => s.players.some(p => p.id === playerId))) {
      alert("Este jogador não pode ser excluído pois possui histórico. Considere marcá-lo como inativo.");
      return;
    }
    if (window.confirm("Tem certeza que deseja excluir este jogador?")) {
      try {
        await deleteDoc(doc(db, 'players', playerId));
        showToast('Jogador excluído com sucesso!');
      } catch (e) { showToast('Erro ao excluir jogador.', 'error'); }
    }
  };
  const handleTogglePlayerStatus = async (playerId: string) => {
    if (!isUserAdmin) return;
    const player = players.find(p => p.id === playerId);
    if (player) await updateDoc(doc(db, 'players', playerId), { isActive: !player.isActive });
  };
  const handleStartGame = async (playerIds: string[]) => {
    if (!isUserAdmin) return;
    const selectedPlayers = players.filter(p => playerIds.includes(p.id));
    const newGamePlayers = selectedPlayers.map(p => ({
      ...p, buyIn: gameDefaults.buyIn, rebuys: 0, totalInvested: gameDefaults.buyIn, finalChips: 0, paid: false
    }));
    const gameName = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    await setDoc(doc(db, 'liveGame', 'current'), { gameName: gameName, players: newGamePlayers });
    setActiveView(View.LiveGame);
  };
  const handleAddPlayerToLiveGame = async (playerId: string) => {
    if (!isUserAdmin) return;
    const playerToAdd = players.find(p => p.id === playerId);
    if (playerToAdd) {
        const newGamePlayer: GamePlayer = { ...playerToAdd, buyIn: gameDefaults.buyIn, rebuys: 0, totalInvested: gameDefaults.buyIn, finalChips: 0, paid: false };
        await updateDoc(doc(db, 'liveGame', 'current'), { players: [...gamePlayers, newGamePlayer] });
    }
  };
  const handleAddRebuy = async (playerId: string) => {
    if (!isUserAdmin) return;
    const updatedPlayers = gamePlayers.map(p => p.id === playerId ? { ...p, rebuys: p.rebuys + 1, totalInvested: p.totalInvested + gameDefaults.rebuy } : p);
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };
  const handleRemoveRebuy = async (playerId: string) => {
    if (!isUserAdmin) return;
    const updatedPlayers = gamePlayers.map(p => p.id === playerId && p.rebuys > 0 ? { ...p, rebuys: p.rebuys - 1, totalInvested: p.totalInvested - gameDefaults.rebuy } : p);
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };
  const handleUpdateFinalChips = async (playerId: string, chips: number) => {
    if (!isUserAdmin) return;
    const updatedPlayers = gamePlayers.map(p => (p.id === playerId ? { ...p, finalChips: chips } : p));
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };
  const handleUpdateGameName = async (newName: string) => {
    if (!isUserAdmin) return;
    await updateDoc(doc(db, 'liveGame', 'current'), { gameName: newName });
  };
  const handleEndGame = async () => {
    if (!isUserAdmin || !currentGameName) return;
    const gamePlayersWithPayment = gamePlayers.map(p => ({ ...p, paid: (p.finalChips - p.totalInvested) >= 0 }));
    const dateParts = currentGameName.split('/');
    const gameDate = new Date(Number(`20${dateParts[2]}`), Number(dateParts[1]) - 1, Number(dateParts[0]));
    try {
      await addDoc(collection(db, 'sessions'), { name: currentGameName, date: Timestamp.fromDate(gameDate), players: gamePlayersWithPayment });
      await deleteDoc(doc(db, 'liveGame', 'current'));
      showToast('Jogo salvo no histórico com sucesso!');
      setActiveView(View.SessionHistory);
    } catch (e) { showToast('Erro ao salvar o jogo.', 'error'); }
  };
  const handleCancelGame = async () => {
    if (!isUserAdmin) return;
    if (window.confirm("Tem certeza? O progresso será perdido.")) {
      await deleteDoc(doc(db, 'liveGame', 'current'));
      setActiveView(View.Players);
    }
  };
  const handleSaveHistoricGame = async (session: Omit<Session, 'id'>) => {
    if (!isUserAdmin) return;
    try {
      if (modalMode === 'edit' && sessionToEdit) {
          await updateDoc(doc(db, 'sessions', sessionToEdit.id), session);
          showToast('Jogo histórico atualizado!');
      } else {
          await addDoc(collection(db, 'sessions'), session);
          showToast('Jogo histórico adicionado!');
      }
    } catch (e) { showToast('Erro ao salvar jogo histórico.', 'error'); }
    finally { setModalMode(null); setSessionToEdit(null); }
  };
  const handleOpenEditModal = (sessionId: string) => {
    if (!isUserAdmin) return;
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) { setSessionToEdit(session); setModalMode('edit'); }
  };
  const handleDeleteSession = async (sessionId: string) => {
    if (!isUserAdmin) return;
    if (window.confirm("Excluir este jogo do histórico?")) {
      try {
        await deleteDoc(doc(db, 'sessions', sessionId));
        showToast('Jogo excluído do histórico.', 'success');
      } catch (e) { showToast('Erro ao excluir jogo.', 'error'); }
    }
  };
  const handleTogglePaymentStatus = async (sessionId: string, playerId: string) => {
    if (!isUserAdmin) return;
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) {
        const updatedPlayers = session.players.map(p => p.id === playerId ? { ...p, paid: !p.paid } : p);
        await updateDoc(doc(db, 'sessions', sessionId), { players: updatedPlayers });
    }
  };
  const handleSettlePlayerDebts = async (playerId: string) => {
    if (!isUserAdmin) return;
    if (window.confirm(`Quitar todas as pendências de ${players.find(p => p.id === playerId)?.name}?`)) {
      const batch = writeBatch(db);
      sessionHistory.forEach(session => {
        let sessionUpdated = false;
        const updatedPlayers = session.players.map(p => {
          if (p.id === playerId && !p.paid && (p.finalChips - p.totalInvested) < 0) {
            sessionUpdated = true; return { ...p, paid: true };
          }
          return p;
        });
        if (sessionUpdated) batch.update(doc(db, 'sessions', session.id), { players: updatedPlayers });
      });
      try {
        await batch.commit();
        showToast('Dívidas quitadas com sucesso!');
      } catch (e) { showToast('Erro ao quitar dívidas.', 'error'); }
    }
  };
  const handleViewProfile = (playerId: string) => {
    setViewingPlayerId(playerId);
    setActiveView(View.PlayerProfile);
  };
  const handleLogout = () => {
    signOut(auth);
    setIsVisitorMode(false);
  };
  const handleUpdateUserRole = async (uid: string, role: UserRole) => {
      if (userRole !== 'owner') return;
      try {
          await updateDoc(doc(db, 'users', uid), { role });
          showToast('Cargo do usuário atualizado!');
      } catch { showToast('Erro ao atualizar cargo.', 'error'); }
  };
  const handleSaveDefaults = async (defaults: GameDefaults) => {
      if (!isUserAdmin) return;
      try {
          await setDoc(doc(db, 'config', 'defaults'), defaults);
          showToast('Valores padrão salvos com sucesso!');
      } catch { showToast('Erro ao salvar configurações.', 'error'); }
  };
  
  const renderContent = () => {
    switch (activeView) {
      case View.LiveGame: return <LiveGame isUserAdmin={isUserAdmin} players={gamePlayers} allPlayers={players} gameName={currentGameName} onAddRebuy={handleAddRebuy} onRemoveRebuy={handleRemoveRebuy} onUpdateFinalChips={handleUpdateFinalChips} onUpdateGameName={handleUpdateGameName} onEndGame={handleEndGame} onCancelGame={handleCancelGame} onGoToPlayers={() => setActiveView(View.Players)} onAddPlayerToGame={handleAddPlayerToLiveGame} onViewProfile={handleViewProfile} gameDefaults={gameDefaults} />;
      case View.Players: return <Players isUserAdmin={isUserAdmin} players={players} onAddPlayer={handleAddPlayer} onStartGame={handleStartGame} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onTogglePlayerStatus={handleTogglePlayerStatus} onViewProfile={handleViewProfile} />;
      case View.SessionHistory: return <SessionHistory isUserAdmin={isUserAdmin} sessions={sessionHistory} players={players} onIncludeGame={() => setModalMode('add')} onEditGame={handleOpenEditModal} onDeleteGame={handleDeleteSession} onTogglePayment={handleTogglePaymentStatus} onViewProfile={handleViewProfile}/>;
      case View.Ranking: return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} />;
      case View.PlayerProfile: return <PlayerProfile playerId={viewingPlayerId} players={players} sessionHistory={sessionHistory} onBack={() => setActiveView(View.Ranking)} />;
      case View.Cashier: return <Cashier isUserAdmin={isUserAdmin} sessions={sessionHistory} players={players} onSettleDebts={handleSettlePlayerDebts} onViewProfile={handleViewProfile} />;
      case View.Settings: return <Settings isUserOwner={userRole === 'owner'} appUsers={appUsers} onUpdateUserRole={handleUpdateUserRole} onSaveDefaults={handleSaveDefaults} gameDefaults={gameDefaults} />;
      default: return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} />;
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-poker-dark"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-poker-gold"></div><p className="ml-4 text-white text-lg">Carregando...</p></div>;
  }

  if (!user && !isVisitorMode) {
    return <Auth onEnterAsVisitor={() => setIsVisitorMode(true)} />;
  }
  
  if (userRole === 'pending') {
      return (
         <div className="min-h-screen bg-poker-dark">
            <Header userRole={userRole} isVisitor={false} activeView={activeView} setActiveView={() => {}} onLogout={handleLogout} />
            <main className="container mx-auto p-4 md:p-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)'}}>
                <div className="bg-poker-light p-10 rounded-lg shadow-xl text-center max-w-lg">
                    <div className="text-poker-gold mx-auto mb-4 w-16 h-16"><ClockIcon /></div>
                    <h2 className="text-2xl font-bold text-white mb-4">Acesso Pendente</h2>
                    <p className="text-poker-gray">Sua conta foi criada com sucesso e está aguardando aprovação do Dono do clube. <br />Você será notificado quando seu acesso for liberado.</p>
                </div>
            </main>
         </div>
      );
  }

  return (
    <div className="min-h-screen bg-poker-dark">
      <Header userRole={userRole} isVisitor={isVisitorMode} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8">
        <div key={activeView} className="animate-fade-in">{renderContent()}</div>
      </main>
      {modalMode && isUserAdmin && (
        <AddHistoricGame players={players} onSave={handleSaveHistoricGame} onClose={() => { setModalMode(null); setSessionToEdit(null); }} sessionToEdit={sessionToEdit} />
      )}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default App;
