import React, { useState, useEffect, useMemo } from 'react';
import type { Session, Player } from '../types';
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

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          {sortedHistory.map(session => {
            const totalPot = session.players.reduce((sum, p) => sum + p.totalInvested, 0);
            return (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="bg-poker-dark rounded-lg p-4 cursor-pointer hover:bg-poker-dark/50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left side: Name and Date */}
                <div className="flex-grow mb-3 sm:mb-0">
                  <h3 className="font-bold text-lg text-white">{session.name}</h3>
                  <p className="text-sm text-poker-gray">{session.date.toDate().toLocaleDateString('pt-BR')}</p>
                </div>
                {/* Right side: Player count and Pot */}
                <div className="flex items-center space-x-6 flex-shrink-0 self-start sm:self-center">
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase text-poker-gray">Jogadores</p>
                    <p className="text-lg font-semibold text-white">{session.players.length}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase text-poker-gray">Montante Total</p>
                    <p className="text-xl font-bold text-poker-gold">R$ {totalPot.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            );
          })}
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