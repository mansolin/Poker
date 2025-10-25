import React, { useState, useEffect, useMemo } from 'react';
import type { Session, Player } from '../types';
import GameCard from './GameCard';
import SessionDetailModal from './SessionDetailModal';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';

interface SessionHistoryProps {
  isUserAdmin: boolean;
  sessionHistory: Session[];
  players: Player[];
  onEditHistoricGame: (session: Session) => void;
  onDeleteHistoricGame: (sessionId: string) => Promise<void>;
  onViewProfile: (playerId: string) => void;
  initialSessionId: string | null;
  onClearInitialSession: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  isUserAdmin,
  sessionHistory,
  players,
  onEditHistoricGame,
  onDeleteHistoricGame,
  onViewProfile,
  initialSessionId,
  onClearInitialSession,
}) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (initialSessionId) {
      const sessionToView = sessionHistory.find(s => s.id === initialSessionId);
      if (sessionToView) {
        setSelectedSession(sessionToView);
      }
      onClearInitialSession();
    }
  }, [initialSessionId, sessionHistory, onClearInitialSession]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };
  
  const handleToggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const sortedHistory = useMemo(() => {
    const sorted = [...sessionHistory];
    if (sortOrder === 'desc') {
      return sorted.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    } else {
      return sorted.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    }
  }, [sessionHistory, sortOrder]);
  
  if (sessionHistory.length === 0) {
    return (
        <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Nenhum Jogo Salvo</h2>
            <p className="text-poker-gray mb-6">Quando um jogo for finalizado, ele aparecerá aqui.</p>
        </div>
    )
  }

  return (
    <>
      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Histórico de Jogos</h2>
            <button 
              onClick={handleToggleSort} 
              className="p-1 text-poker-gray hover:text-white rounded-full hover:bg-poker-dark transition-colors"
              title={sortOrder === 'desc' ? 'Ordenar do mais antigo para o mais recente' : 'Ordenar do mais recente para o mais antigo'}
            >
              {sortOrder === 'desc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {sortedHistory.map(session => (
            <GameCard key={session.id} session={session} onClick={() => handleSessionClick(session)} />
          ))}
        </div>
      </div>

      {selectedSession && (
        <SessionDetailModal
          isUserAdmin={isUserAdmin}
          session={selectedSession}
          allPlayers={players}
          onClose={handleCloseModal}
          onSave={onEditHistoricGame}
          onDelete={onDeleteHistoricGame}
          onViewProfile={onViewProfile}
        />
      )}
    </>
  );
};

export default SessionHistory;