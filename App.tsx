import React, { useState } from 'react';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SessionHistory from './components/SessionHistory';
import AddHistoricGame from './components/AddHistoricGame';
import type { Player, GamePlayer, Session } from './types';
import { View } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Players);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [currentGameName, setCurrentGameName] = useState<string | null>(null);
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);

  const handleAddPlayer = (player: Omit<Player, 'id' | 'isActive'>) => {
    setPlayers(prev => [...prev, { ...player, id: Date.now().toString(), isActive: true }]);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };
  
  const handleDeletePlayer = (playerId: string) => {
    const isPlayerInHistory = sessionHistory.some(session =>
      session.players.some(p => p.id === playerId)
    );

    if (isPlayerInHistory) {
      alert("Este jogador não pode ser excluído pois possui histórico de jogos. Considere marcá-lo como inativo.");
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir este jogador?")) {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      setGamePlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };
  
  const handleTogglePlayerStatus = (playerId: string) => {
    setPlayers(prev => 
      prev.map(p => 
        p.id === playerId ? { ...p, isActive: !p.isActive } : p
      )
    );
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

  const handleEndGame = () => {
    if (!currentGameName) return;
    const gamePlayersWithPayment = gamePlayers.map(p => ({
        ...p,
        paid: (p.finalChips - p.totalInvested) === 0
    }));

    const newSession: Session = {
      id: Date.now().toString(),
      name: currentGameName,
      players: gamePlayersWithPayment,
    };
    setSessionHistory(prev => [newSession, ...prev]);
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
  
  const handleSaveHistoricGame = (session: Session) => {
    if (modalMode === 'edit') {
        setSessionHistory(prev => prev.map(s => s.id === session.id ? session : s));
    } else {
        setSessionHistory(prev => [session, ...prev]);
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

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este jogo do histórico? Esta ação não pode ser desfeita.")) {
      setSessionHistory(prev => prev.filter(s => s.id !== sessionId));
    }
  };
  
  const handleTogglePaymentStatus = (sessionId: string, playerId: string) => {
    setSessionHistory(prev => prev.map(session => {
        if (session.id === sessionId) {
            return {
                ...session,
                players: session.players.map(player => {
                    if (player.id === playerId) {
                        return { ...player, paid: !player.paid };
                    }
                    return player;
                })
            };
        }
        return session;
    }));
  };

  const renderContent = () => {
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