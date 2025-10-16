import React, { useMemo } from 'react';
import type { Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import TrophyIcon from './icons/TrophyIcon';

interface GameCardProps {
  session: Session;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ session, onClick }) => {
  const { totalPot, winner } = useMemo(() => {
    const pot = session.players.reduce((sum, p) => sum + p.totalInvested, 0);
    const topPlayer = [...session.players]
      .map(p => ({ ...p, profit: p.finalChips - p.totalInvested }))
      .sort((a, b) => b.profit - a.profit)[0];
    return { totalPot: pot, winner: topPlayer };
  }, [session]);

  return (
    <div onClick={onClick} className="bg-poker-dark rounded-lg shadow-lg p-4 cursor-pointer hover:scale-105 hover:shadow-poker-gold/20 transition-all duration-200 flex flex-col justify-between h-48">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-white">{session.name}</h3>
          <span className="text-xs text-poker-gray">{session.players.length} jogadores</span>
        </div>
        <div className="text-center bg-poker-dark/50 border-t border-b border-poker-light/50 py-2">
          <p className="text-xs uppercase text-poker-gray">Montante Total</p>
          <p className="text-2xl font-bold text-poker-gold">R$ {totalPot.toLocaleString('pt-BR')}</p>
        </div>
      </div>
      
      {winner && (
        <div className="flex items-center mt-3">
          <span className="text-poker-gold mr-2 h-5 w-5"><TrophyIcon/></span>
          <div className="flex-grow flex items-center min-w-0">
            <PlayerAvatar name={winner.name} size="sm" />
            <div className="ml-2 min-w-0">
              <p className="text-xs text-poker-gray truncate">Vencedor</p>
              <p className="text-sm font-semibold text-white truncate" title={winner.name}>{winner.name}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-green-400 ml-2 whitespace-nowrap">
            +R${winner.profit.toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameCard;
