import React, { useState, useEffect } from 'react';
import type { Session, Player } from '../types';
import GameCard from './GameCard';
import SessionDetailModal from './SessionDetailModal';

interface SessionHistoryProps {
  isUserAdmin: boolean;
  sessionHistory: Session[];
  players: Player[];
  onEditHistoricGame: (session: Session) => void;
  onViewProfile: (playerId: string) => void;
  initialSessionId: string | null;
  onClearInitialSession: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  isUserAdmin,
  sessionHistory,
  players,
  onEditHistoricGame,
  onViewProfile,
  initialSessionId,
  onClearInitialSession,
}) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

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
          <h2 className="text-xl font-bold text-white">Histórico de Jogos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {sessionHistory.map(session => (
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
          onViewProfile={onViewProfile}
        />
      )}
    </>
  );
};

export default SessionHistory;
