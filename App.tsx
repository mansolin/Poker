import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SessionHistory from './components/SessionHistory';
import AddHistoricGame from './components/AddHistoricGame';
import type { Player, GamePlayer, Session } from './types';
import { View } from './types';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Ranking);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [currentGameName, setCurrentGameName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribePlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersData);
    });

    const sessionsQuery = query(collection(db, 'sessions'), orderBy('date', 'desc'));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessionHistory(sessionsData);
      setIsLoading(false);
    });

    return () => {
      unsubscribePlayers();
      unsubscribeSessions();
    };
  }, []);


  const handleAddPlayer = async (player: Omit<Player, 'id' | 'isActive'>) => {
    await addDoc(collection(db, 'players'), { ...player, isActive: true });
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    const playerRef = doc(db, 'players', updatedPlayer.id);
    const { id, ...playerData } = updatedPlayer;
    await updateDoc(playerRef, playerData);
  };

  const handleDeletePlayer = async (playerId: string) => {
    const isPlayerInHistory = sessionHistory.some(session =>
      session.players.some(p => p.id === playerId)
    );

    if (isPlayerInHistory) {
      alert("Este jogador não pode ser excluído pois possui histórico de jogos. Considere marcá-lo como inativo.");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este jogador?")) {
      await deleteDoc(doc(db, 'players', playerId));
      setGamePlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const handleTogglePlayerStatus = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, { isActive: !player.isActive });
    }
  };

  const handleStartGame = (playerIds: string[]) => {
    const selectedPlayers = players.filter(p => playerIds.includes(p.id));
    const newGamePlayers = selectedPlayers.map(p => ({
      ...p,
      buyIn: 50,
      rebuys: 0,
      totalInvested: 50,
      finalChips: 0,
      paid: false
    }));

    const today = new Date();
    const gameName = today.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    setCurrentGameName(gameName);

    setGamePlayers(newGamePlayers);
    setActiveView(View.LiveGame);
  };
  
  const handleAddPlayerToLiveGame = (playerId: string) => {
    const playerToAdd = players.find(p => p.id === playerId);
    if (playerToAdd) {
        const newGamePlayer: GamePlayer = {
            ...playerToAdd,
            buyIn: 50,
            rebuys: 0,
            totalInvested: 50,
            finalChips: 0,
            paid: false
        };
        setGamePlayers(prev => [...prev, newGamePlayer]);
    }
  };

  const handleAddRebuy = (playerId: string) => {
    setGamePlayers(prev =>
      prev.map(p =>
        p.id === playerId
          ? {
              ...p,
              rebuys: p.rebuys + 1,
              totalInvested: p.totalInvested + 50,
            }
          : p
      )
    );
  };

  const handleRemoveRebuy = (playerId: string) => {
    setGamePlayers(prev =>
      prev.map(p => {
        if (p.id === playerId && p.rebuys > 0) {
          return {
            ...p,
            rebuys: p.rebuys - 1,
            totalInvested: p.totalInvested - 50,
          };
        }
        return p;
      })
    );
  };

  const handleUpdateFinalChips = (playerId: string, chips: number) => {
    setGamePlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, finalChips: chips } : p))
    );
  };

  const handleUpdateGameName = (newName: string) => {
    setCurrentGameName(newName);
  };

  const handleEndGame = async () => {
    if (!currentGameName) return;
    const gamePlayersWithPayment = gamePlayers.map(p => ({
        ...p,
        paid: (p.finalChips - p.totalInvested) === 0
    }));

    const dateParts = currentGameName.split('/');
    const gameDate = new Date(Number(`20${dateParts[2]}`), Number(dateParts[1]) - 1, Number(dateParts[0]));

    const newSession = {
      name: currentGameName,
      date: Timestamp.fromDate(gameDate),
      players: gamePlayersWithPayment,
    };
    await addDoc(collection(db, 'sessions'), newSession);
    setGamePlayers([]);
    setCurrentGameName(null);
    setActiveView(View.SessionHistory);
  };

  const handleCancelGame = () => {
    if (window.confirm("Tem certeza que deseja cancelar este jogo? Todo o progresso será perdido.")) {
      setGamePlayers([]);
      setCurrentGameName(null);
      setActiveView(View.Players);
    }
  };

  const handleSaveHistoricGame = async (session: Omit<Session, 'id'>) => {
    if (modalMode === 'edit' && sessionToEdit) {
        const sessionRef = doc(db, 'sessions', sessionToEdit.id);
        await updateDoc(sessionRef, session);
    } else {
        await addDoc(collection(db, 'sessions'), session);
    }
    setModalMode(null);
    setSessionToEdit(null);
  };

  const handleOpenEditModal = (sessionId: string) => {
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) {
      setSessionToEdit(session);
      setModalMode('edit');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este jogo do histórico? Esta ação não pode ser desfeita.")) {
      await deleteDoc(doc(db, 'sessions', sessionId));
    }
  };

  const handleTogglePaymentStatus = async (sessionId: string, playerId: string) => {
    const session = sessionHistory.find(s => s.id === sessionId);
    if (session) {
        const updatedPlayers = session.players.map(player => {
            if (player.id === playerId) {
                return { ...player, paid: !player.paid };
            }
            return player;
        });
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, { players: updatedPlayers });
    }
  };
  
    const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-poker-gold"></div>
          <p className="ml-4 text-white text-lg">Carregando dados...</p>
        </div>
      );
    }
    
    switch (activeView) {
      case View.LiveGame:
        return (
          <LiveGame
            players={gamePlayers}
            allPlayers={players}
            gameName={currentGameName}
            onAddRebuy={handleAddRebuy}
            onRemoveRebuy={handleRemoveRebuy}
            onUpdateFinalChips={handleUpdateFinalChips}
            onUpdateGameName={handleUpdateGameName}
            onEndGame={handleEndGame}
            onCancelGame={handleCancelGame}
            onGoToPlayers={() => setActiveView(View.Players)}
            onAddPlayerToGame={handleAddPlayerToLiveGame}
          />
        );
      case View.Players:
        return (
          <Players 
            players={players} 
            onAddPlayer={handleAddPlayer} 
            onStartGame={handleStartGame} 
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onTogglePlayerStatus={handleTogglePlayerStatus}
          />
        );
      case View.SessionHistory:
        return <SessionHistory sessions={sessionHistory} onIncludeGame={() => setModalMode('add')} onEditGame={handleOpenEditModal} onDeleteGame={handleDeleteSession} onTogglePayment={handleTogglePaymentStatus}/>;
      case View.Ranking:
        return <Ranking gamePlayers={gamePlayers} sessionHistory={sessionHistory} players={players} gameName={currentGameName} />;
      default:
        return <Players players={players} onAddPlayer={handleAddPlayer} onStartGame={handleStartGame} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onTogglePlayerStatus={handleTogglePlayerStatus} />;
    }
  };

  return (
    <div className="min-h-screen bg-poker-dark">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      {modalMode && (
        <AddHistoricGame
          players={players}
          onSave={handleSaveHistoricGame}
          onClose={() => {
            setModalMode(null);
            setSessionToEdit(null);
          }}
          sessionToEdit={sessionToEdit}
        />
      )}
    </div>
  );
};

export default App;
