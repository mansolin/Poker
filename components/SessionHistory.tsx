import React, { useState, useMemo } from 'react';
import type { Session, Player } from '../types';
import PlusIcon from './icons/PlusIcon';
import LayoutGridIcon from './icons/LayoutGridIcon';
import ListIcon from './icons/ListIcon';
import GameCard from './GameCard';
import TrendingUpIcon from './icons/TrendingUpIcon';

interface SessionHistoryProps {
  isUserAdmin: boolean;
  sessions: Session[];
  players: Player[];
  onIncludeGame: () => void;
  onViewSession: (sessionId: string) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = (props) => {
  const { isUserAdmin, sessions, players, onIncludeGame, onViewSession } = props;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalPot = useMemo(() => {
    return sessions.reduce((total, session) => {
      return total + session.players.reduce((sessionTotal, p) => sessionTotal + p.totalInvested, 0);
    }, 0);
  }, [sessions]);

  if (sessions.length === 0 && !isUserAdmin) {
     return (
        <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Nenhum Histórico</h2>
            <p className="text-poker-gray">Ainda não há jogos registrados no histórico.</p>
        </div>
     );
  }

  if (sessions.length === 0 && isUserAdmin) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Nenhum Histórico</h2>
        <button onClick={onIncludeGame} className="mt-6 flex items-center mx-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white"><span className="h-5 w-5 mr-2"><PlusIcon /></span> Incluir Jogo Antigo</button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-white whitespace-nowrap">Histórico de Jogos</h2>
                <div className="flex items-center bg-poker-dark p-1 rounded-md">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-poker-green' : ''}`} title="Visão em Grade"><LayoutGridIcon /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-poker-green' : ''}`} title="Visão em Lista"><ListIcon /></button>
                </div>
            </div>

            <div className="flex w-full sm:w-auto items-stretch justify-between sm:justify-end gap-2">
                {isUserAdmin && 
                    <button onClick={onIncludeGame} className="flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md bg-poker-green text-white flex-1 sm:flex-none">
                        <span className="h-5 w-5 sm:mr-2"><PlusIcon /></span>
                        <span className="hidden sm:inline">Incluir Jogo</span>
                    </button>
                }
                <div className="bg-poker-dark p-2 rounded-lg text-center flex-1 sm:flex-none">
                    <div className="flex items-center justify-center text-poker-gray text-[10px] sm:text-xs mb-1">
                        <span className="h-4 w-4 mr-1"><TrendingUpIcon /></span>
                        <h3 className="font-semibold uppercase tracking-wider">Total Jogado</h3>
                    </div>
                    <p className="text-xl sm:text-4xl font-bold text-poker-gold">R$ {totalPot.toLocaleString('pt-BR')}</p>
                </div>
            </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {sessions.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sessions.map(session => (
                  <GameCard key={session.id} session={session} onClick={() => onViewSession(session.id)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => (
                  <div key={session.id} onClick={() => onViewSession(session.id)} className="flex justify-between items-center bg-poker-dark p-3 rounded-lg cursor-pointer hover:bg-poker-dark/70">
                    <span className="font-semibold text-white">{session.name}</span>
                    <span className="text-sm text-poker-gold">R$ {session.players.reduce((sum, p) => sum + p.totalInvested, 0).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-center text-poker-gray py-8">Nenhum histórico de jogo para exibir.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionHistory;