import React, { useMemo } from 'react';
import type { Session, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface CashierProps {
  isUserAdmin: boolean;
  sessions: Session[];
  players: Player[];
  onSettleBalance: (playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

const Cashier: React.FC<CashierProps> = ({ isUserAdmin, sessions, players, onSettleBalance, onViewProfile }) => {

  const playerBalances = useMemo(() => {
    const balancesAndDetails = new Map<string, { balance: number; unpaidSessions: { name: string; amount: number }[] }>();

    sessions.forEach(session => {
      session.players.forEach(p => {
        if (!p.paid) {
          const profit = p.finalChips - p.totalInvested;
          if (profit !== 0) {
            if (!balancesAndDetails.has(p.id)) {
              balancesAndDetails.set(p.id, { balance: 0, unpaidSessions: [] });
            }
            const details = balancesAndDetails.get(p.id)!;
            details.balance += profit;
            details.unpaidSessions.push({ name: session.name, amount: profit });
          }
        }
      });
    });

    players.forEach(player => {
      if (player.isActive && !balancesAndDetails.has(player.id)) {
        balancesAndDetails.set(player.id, { balance: 0, unpaidSessions: [] });
      }
    });

    return Array.from(balancesAndDetails.entries())
      .map(([playerId, data]) => ({
        player: players.find(p => p.id === playerId)!,
        balance: data.balance,
        unpaidSessions: data.unpaidSessions.sort((a, b) => new Date(b.name.split('/').reverse().join('-')).getTime() - new Date(a.name.split('/').reverse().join('-')).getTime()),
      }))
      .filter(item => item.player)
      .sort((a, b) => b.balance - a.balance);
  }, [sessions, players]);
  
  const { totalToReceive, totalToPayOut } = useMemo(() => {
    let toReceive = 0;
    let toPayOut = 0;
    playerBalances.forEach(({ balance }) => {
        if (balance < 0) {
            toReceive += balance;
        } else if (balance > 0) {
            toPayOut += balance;
        }
    });
    return { totalToReceive: Math.abs(toReceive), totalToPayOut: toPayOut };
  }, [playerBalances]);

  return (
    <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Caixa do Clube</h2>
        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="bg-poker-dark p-3 rounded-lg text-center">
                <h3 className="text-xs md:text-sm font-semibold text-poker-gray uppercase">Total a Receber</h3>
                <p className="text-xl md:text-2xl font-bold text-red-400">R$ {totalToReceive.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-poker-dark p-3 rounded-lg text-center">
                <h3 className="text-xs md:text-sm font-semibold text-poker-gray uppercase">Total a Pagar</h3>
                <p className="text-xl md:text-2xl font-bold text-green-400">R$ {totalToPayOut.toLocaleString('pt-BR')}</p>
            </div>
        </div>
      </div>
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
        {playerBalances.length > 0 ? (
          playerBalances.map(({ player, balance, unpaidSessions }) => (
            <div key={player.id} className="bg-poker-dark p-3 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <div className="flex items-center w-full sm:w-auto flex-grow mb-3 sm:mb-0">
                        <PlayerAvatar name={player.name} />
                        <button onClick={() => onViewProfile(player.id)} className="ml-4 text-left hover:opacity-80">
                        <p className="text-base font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-poker-gray">{player.whatsapp}</p>
                        </button>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-center">
                        <div className="text-right">
                            <p className="text-xs text-poker-gray">Saldo Total</p>
                            <p className={`text-lg font-bold ${balance < 0 ? 'text-red-400' : (balance > 0 ? 'text-green-400' : 'text-white')}`}>
                                R$ {balance.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        {isUserAdmin && balance !== 0 && (
                            <button onClick={() => onSettleBalance(player.id)} className="px-4 py-2 text-sm text-white bg-poker-green hover:bg-poker-green/80 rounded-lg">Quitar</button>
                        )}
                    </div>
                </div>
                {unpaidSessions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-poker-light/50 space-y-1">
                        <h4 className="text-xs font-semibold text-poker-gray mb-1">Detalhes da Pendência:</h4>
                        {unpaidSessions.map((session, index) => (
                            <div key={index} className="flex justify-between items-center text-xs pl-2">
                                <span className="text-poker-gray">Jogo: {session.name}</span>
                                <span className={`font-medium ${session.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    R$ {session.amount.toLocaleString('pt-BR')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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