import React, { useMemo } from 'react';
import type { Session, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface CashierProps {
  isUserAdmin: boolean;
  sessions: Session[];
  players: Player[];
  onSettleDebts: (playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

const Cashier: React.FC<CashierProps> = ({ isUserAdmin, sessions, players, onSettleDebts, onViewProfile }) => {

  const playerBalances = useMemo(() => {
    const balances = new Map<string, number>();
    sessions.forEach(session => {
      session.players.forEach(p => {
        if (!p.paid) {
          const profit = p.finalChips - p.totalInvested;
          if (profit < 0) {
            balances.set(p.id, (balances.get(p.id) || 0) + profit);
          }
        }
      });
    });
    
    players.forEach(player => {
        if (player.isActive && !balances.has(player.id)) balances.set(player.id, 0);
    });

    return Array.from(balances.entries())
      .map(([playerId, balance]) => ({ player: players.find(p => p.id === playerId)!, balance }))
      .filter(item => item.player)
      .sort((a, b) => a.balance - b.balance);
  }, [sessions, players]);
  
  const totalDebt = useMemo(() => playerBalances.reduce((sum, item) => sum + item.balance, 0), [playerBalances]);

  return (
    <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Caixa do Clube</h2>
        <div className="bg-poker-dark p-4 rounded-lg text-center">
            <h3 className="text-sm font-semibold text-poker-gray uppercase">Total a Receber</h3>
            <p className="text-2xl font-bold text-red-400">R$ {Math.abs(totalDebt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
        {playerBalances.length > 0 ? (
          playerBalances.map(({ player, balance }) => (
            <div key={player.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-poker-dark p-3 rounded-lg">
                <div className="flex items-center w-full sm:w-auto flex-grow mb-3 sm:mb-0">
                    <PlayerAvatar name={player.name} />
                    <button onClick={() => onViewProfile(player.id)} className="ml-4 text-left hover:opacity-80">
                      <p className="text-base font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-poker-gray">{player.whatsapp}</p>
                    </button>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-center">
                    <div className="text-right">
                        <p className="text-xs text-poker-gray">Saldo Pendente</p>
                        <p className={`text-lg font-bold ${balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            R$ {balance.toLocaleString('pt-BR')}
                        </p>
                    </div>
                    {isUserAdmin && balance < 0 && (
                        <button onClick={() => onSettleDebts(player.id)} className="px-4 py-2 text-sm text-white bg-poker-green hover:bg-poker-green/80 rounded-lg">Quitar</button>
                    )}
                </div>
            </div>
          ))
        ) : (
          <p className="text-center text-poker-gray py-8">Nenhuma pendência financeira encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default Cashier;
