import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SessionHistory from './components/SessionHistory';
import AddHistoricGame from './components/AddHistoricGame';
import Login from './components/Login';
import PlayerProfile from './components/PlayerProfile';
import Cashier from './components/Cashier';
import Settings from './components/Settings';
import Toast from './components/Toast';
import type { Player, GamePlayer, Session, ToastState } from './types';
import { View } from './types';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy, setDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
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

  const isLoggedIn = !!user;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsVisitor(false);
      }
      setIsLoading(false);
    });
    
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersData);
    });

    const sessionsQuery = query(collection(db, 'sessions'), orderBy('date', 'desc'));
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessionHistory(sessionsData);
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

    return () => {
      unsubscribeAuth();
      unsubPlayers();
      unsubSessions();
      unsubLiveGame();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleAddPlayer = async (player: Omit<Player, 'id' | 'isActive'>) => {
    if (!isLoggedIn) return;
    try {
      await addDoc(collection(db, 'players'), { ...player, isActive: true });
      showToast('Jogador adicionado com sucesso!');
    } catch (e) {
      showToast('Erro ao adicionar jogador.', 'error');
    }
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    if (!isLoggedIn) return;
    const playerRef = doc(db, 'players', updatedPlayer.id);
    const { id, ...playerData } = updatedPlayer;
    try {
      await updateDoc(playerRef, playerData);
      showToast('Jogador atualizado com sucesso!');
    } catch (e) {
      showToast('Erro ao atualizar jogador.', 'error');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!isLoggedIn) return;
    const isPlayerInHistory = sessionHistory.some(session => session.players.some(p => p.id === playerId));
    if (isPlayerInHistory) {
      alert("Este jogador não pode ser excluído pois possui histórico de jogos. Considere marcá-lo como inativo.");
      return;
    }
    if (window.confirm("Tem certeza que deseja excluir este jogador?")) {
      try {
        await deleteDoc(doc(db, 'players', playerId));
        showToast('Jogador excluído com sucesso!');
      } catch (e) {
        showToast('Erro ao excluir jogador.', 'error');
      }
    }
  };

  const handleTogglePlayerStatus = async (playerId: string) => {
    if (!isLoggedIn) return;
    const player = players.find(p => p.id === playerId);
    if (player) {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, { isActive: !player.isActive });
    }
  };

  const handleStartGame = async (playerIds: string[]) => {
    if (!isLoggedIn) return;
    const selectedPlayers = players.filter(p => playerIds.includes(p.id));
    const newGamePlayers = selectedPlayers.map(p => ({
      ...p, buyIn: 50, rebuys: 0, totalInvested: 50, finalChips: 0, paid: false
    }));
    const today = new Date();
    const gameName = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const liveGameData = { gameName: gameName, players: newGamePlayers };
    await setDoc(doc(db, 'liveGame', 'current'), liveGameData);
    setActiveView(View.LiveGame);
  };
  
  const handleAddPlayerToLiveGame = async (playerId: string) => {
    if (!isLoggedIn) return;
    const playerToAdd = players.find(p => p.id === playerId);
    if (playerToAdd) {
        const newGamePlayer: GamePlayer = { ...playerToAdd, buyIn: 50, rebuys: 0, totalInvested: 50, finalChips: 0, paid: false };
        const updatedPlayers = [...gamePlayers, newGamePlayer];
        await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
    }
  };

  const handleAddRebuy = async (playerId: string) => {
    if (!isLoggedIn) return;
    const updatedPlayers = gamePlayers.map(p => p.id === playerId ? { ...p, rebuys: p.rebuys + 1, totalInvested: p.totalInvested + 50 } : p);
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };

  const handleRemoveRebuy = async (playerId: string) => {
    if (!isLoggedIn) return;
    const updatedPlayers = gamePlayers.map(p => p.id === playerId && p.rebuys > 0 ? { ...p, rebuys: p.rebuys - 1, totalInvested: p.totalInvested - 50 } : p);
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };

  const handleUpdateFinalChips = async (playerId: string, chips: number) => {
    if (!isLoggedIn) return;
    const updatedPlayers = gamePlayers.map(p => (p.id === playerId ? { ...p, finalChips: chips } : p));
    await updateDoc(doc(db, 'liveGame', 'current'), { players: updatedPlayers });
  };

  const handleUpdateGameName = async (newName: string) => {
    if (!isLoggedIn) return;
    await updateDoc(doc(db, 'liveGame', 'current'), { gameName: newName });
  };

  const handleEndGame = async () => {
    if (!isLoggedIn || !currentGameName) return;
    const gamePlayersWithPayment = gamePlayers.map(p => ({ ...p, paid: (p.finalChips - p.totalInvested) >= 0 }));
    const dateParts = currentGameName.split('/');
    const gameDate = new Date(Number(`20${dateParts[2]}`), Number(dateParts[1]) - 1, Number(dateParts[0]));
    const newSession = { name: currentGameName, date: Timestamp.fromDate(gameDate), players: gamePlayersWithPayment };
    try {
      await addDoc(collection(db, 'sessions'), newSession);
      await deleteDoc(doc(db, 'liveGame', 'current'));
      showToast('Jogo salvo no histórico com sucesso!');
      setActiveView(View.SessionHistory);
    } catch (e) {
      showToast('Erro ao salvar o jogo.', 'error');
    }
  };

  const handleCancelGame = async () => {
    if (!isLoggedIn) return;
    if (window.confirm("Tem certeza que deseja cancelar este jogo? Todo o progresso será perdido.")) {
      await deleteDoc(doc(db, 'liveGame', 'current'));
      setActiveView(View.Players);
    }
  };

  const handleSaveHistoricGame = async (session: Omit<Session, 'id'>) => {
    if (!isLoggedIn) return;
    try {
      if (modalMode === 'edit' && sessionToEdit) {
          const sessionRef = doc(db, 'sessions', sessionToEdit.id);
          await updateDoc(sessionRef, session);
          showToast('Jogo histórico atualizado!');
      } else {
          await addDoc(collection(db, 'sessions'), session);
          showToast('Jogo histórico adicionado!');
      }
    } catch (e) {
      showToast('Erro ao salvar jogo histórico.', 'error');
    } finally {
      setModalMode(null);
      setSessionToEdit(null);
    }
  };

  const handleOpenEditModal = (sessionId: string) => {
    if (!isLoggedIn) return;
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) {
      setSessionToEdit(session);
      setModalMode('edit');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!isLoggedIn) return;
    if (window.confirm("Tem certeza que deseja excluir este jogo do histórico? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'sessions', sessionId));
        showToast('Jogo excluído do histórico.', 'success');
      } catch (e) {
        showToast('Erro ao excluir jogo.', 'error');
      }
    }
  };

  const handleTogglePaymentStatus = async (sessionId: string, playerId: string) => {
    if (!isLoggedIn) return;
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) {
        const updatedPlayers = session.players.map(p => p.id === playerId ? { ...p, paid: !p.paid } : p);
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, { players: updatedPlayers });
    }
  };
  
  const handleSettlePlayerDebts = async (playerId: string) => {
    if (!isLoggedIn) return;
    if (window.confirm(`Tem certeza que deseja quitar todas as pendências de ${players.find(p => p.id === playerId)?.name}?`)) {
      const batch = writeBatch(db);
      sessionHistory.forEach(session => {
        let sessionWasUpdated = false;
        const updatedPlayers = session.players.map(p => {
          if (p.id === playerId && !p.paid && (p.finalChips - p.totalInvested) < 0) {
            sessionWasUpdated = true;
            return { ...p, paid: true };
          }
          return p;
        });
        if (sessionWasUpdated) {
          const sessionRef = doc(db, 'sessions', session.id);
          batch.update(sessionRef, { players: updatedPlayers });
        }
      });
      try {
        await batch.commit();
        showToast('Dívidas quitadas com sucesso!');
      } catch (e) {
        showToast('Erro ao quitar dívidas.', 'error');
      }
    }
  };

  const handleViewProfile = (playerId: string) => {
    setViewingPlayerId(playerId);
    setActiveView(View.PlayerProfile);
  };

  const handleLogout = () => {
    if (isLoggedIn) signOut(auth);
    else if (isVisitor) setIsVisitor(false);
  };
  
  const renderContent = () => {
    switch (activeView) {
      case View.LiveGame: return <LiveGame isLoggedIn={isLoggedIn} players={gamePlayers} allPlayers={players} gameName={currentGameName} onAddRebuy={handleAddRebuy} onRemoveRebuy={handleRemoveRebuy} onUpdateFinalChips={handleUpdateFinalChips} onUpdateGameName={handleUpdateGameName} onEndGame={handleEndGame} onCancelGame={handleCancelGame} onGoToPlayers={() => setActiveView(View.Players)} onAddPlayerToGame={handleAddPlayerToLiveGame} onViewProfile={handleViewProfile} />;
      case View.Players: return <Players isLoggedIn={isLoggedIn} players={players} onAddPlayer={handleAddPlayer} onStartGame={handleStartGame} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onTogglePlayerStatus={handleTogglePlayerStatus} onViewProfile={handleViewProfile} />;
      case View.SessionHistory: return <SessionHistory isLoggedIn={isLoggedIn} sessions={sessionHistory} players={players} onIncludeGame={() => setModalMode('add')} onEditGame={handleOpenEditModal} onDeleteGame={handleDeleteSession} onTogglePayment={handleTogglePaymentStatus} onViewProfile={handleViewProfile}/>;
      case View.Ranking: return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} />;
      case View.PlayerProfile: return <PlayerProfile playerId={viewingPlayerId} players={players} sessionHistory={sessionHistory} onBack={() => setActiveView(View.Players)} />;
      case View.Cashier: return <Cashier isLoggedIn={isLoggedIn} sessions={sessionHistory} players={players} onSettleDebts={handleSettlePlayerDebts} onViewProfile={handleViewProfile} />;
      case View.Settings: return <Settings />;
      default: return <Ranking sessionHistory={sessionHistory} onViewProfile={handleViewProfile} />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-poker-dark">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-poker-gold"></div>
        <p className="ml-4 text-white text-lg">Carregando...</p>
      </div>
    );
  }

  if (!user && !isVisitor) {
      return <Login onEnterAsVisitor={() => setIsVisitor(true)} />;
  }

  return (
    <div className="min-h-screen bg-poker-dark">
      <Header isLoggedIn={isLoggedIn} isVisitor={isVisitor} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8">
        <div key={activeView} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
      {modalMode && isLoggedIn && (
        <AddHistoricGame players={players} onSave={handleSaveHistoricGame} onClose={() => { setModalMode(null); setSessionToEdit(null); }} sessionToEdit={sessionToEdit} />
      )}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default App;
