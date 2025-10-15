import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import LiveGame from './components/LiveGame';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SessionHistory from './components/SessionHistory';
import AddHistoricGame from './components/AddHistoricGame';
import type { Player, GamePlayer, Session } from './types';
import { View } from './types';

// Helper function to generate mock data for a realistic simulation
const generateMockData = () => {
  const mockPlayers: Player[] = [
    { id: '1', name: 'João Silva', whatsapp: '11987654321', pixKey: 'joao.silva@email.com', isActive: true },
    { id: '2', name: 'Carlos Pereira', whatsapp: '21987654321', pixKey: 'carlos.p@email.com', isActive: true },
    { id: '3', name: 'Pedro Alves', whatsapp: '31987654321', pixKey: '12345678900', isActive: true },
    { id: '4', name: 'Lucas Costa', whatsapp: '41987654321', pixKey: 'lucas.costa@email.com', isActive: true },
    { id: '5', name: 'Mateus Ferreira', whatsapp: '51987654321', pixKey: '51987654321', isActive: true },
    { id: '6', name: 'Gabriel Rodrigues', whatsapp: '61987654321', pixKey: 'gabriel.r@email.com', isActive: true },
    { id: '7', name: 'Bruno Gomes', whatsapp: '71987654321', pixKey: '71987654321', isActive: false },
    { id: '8', name: 'Thiago Martins', whatsapp: '81987654321', pixKey: 'thiago.m@email.com', isActive: true },
    { id: '9', name: 'Rafael Souza', whatsapp: '91987654321', pixKey: '98765432100', isActive: true },
    { id: '10', name: 'Felipe Oliveira', whatsapp: '12987654321', pixKey: 'felipe.o@email.com', isActive: true },
  ];

  const sessions: Session[] = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear - 2; year <= currentYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === currentYear && month > new Date().getMonth() + 1) {
        continue;
      }

      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(year, month - 1, day);
      const gameName = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

      const activePlayers = mockPlayers.filter(p => p.isActive);
      const shuffledPlayers = [...activePlayers].sort(() => 0.5 - Math.random());
      const numPlayers = Math.floor(Math.random() * (Math.min(8, activePlayers.length) - 5 + 1)) + 5;
      const sessionParticipants = shuffledPlayers.slice(0, numPlayers);

      let totalPot = 0;
      const gamePlayersData = sessionParticipants.map(player => {
        const rebuys = Math.floor(Math.random() * 4);
        const totalInvested = 50 + rebuys * 50;
        totalPot += totalInvested;
        return {
          ...player,
          buyIn: 50,
          rebuys,
          totalInvested,
          finalChips: 0,
        };
      });

      let remainingPot = totalPot;
      for (let i = 0; i < gamePlayersData.length - 1; i++) {
        const maxChipsForPlayer = Math.max(0, remainingPot - (gamePlayersData.length - 1 - i) * 0);
        const chips = Math.floor(Math.random() * maxChipsForPlayer);
        gamePlayersData[i].finalChips = chips;
        remainingPot -= chips;
      }
      gamePlayersData[gamePlayersData.length - 1].finalChips = remainingPot;

      const finalGamePlayers = gamePlayersData.sort(() => 0.5 - Math.random()).map(p => ({
          ...p,
          paid: (p.finalChips - p.totalInvested === 0) ? true : Math.random() > 0.3
      }));

      sessions.push({
        id: `${year}-${month}-${day}-${Math.random()}`,
        name: gameName,
        players: finalGamePlayers,
      });
    }
  }

  return { players: mockPlayers, sessions };
};


const App: React.FC = () => {
  const initialData = useMemo(() => generateMockData(), []);

  const [activeView, setActiveView] = useState<View>(View.Ranking);
  const [players, setPlayers] = useState<Player[]>(initialData.players);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Session[]>(initialData.sessions);
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