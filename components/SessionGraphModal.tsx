import React, { useMemo } from 'react';
import type { Session } from '../types';

interface SessionGraphModalProps {
  session: Session;
  onClose: () => void;
}

const SessionGraphModal: React.FC<SessionGraphModalProps> = ({ session, onClose }) => {

  const chartData = useMemo(() => {
    const results = session.players.map(p => ({
        name: p.name,
        profit: p.finalChips - p.totalInvested,
    })).sort((a,b) => b.profit - a.profit);
    
    const playersWithProfit = results.filter(p => p.profit >= 0);
    const playersWithLoss = results.filter(p => p.profit < 0);

    const maxProfit = Math.max(...playersWithProfit.map(p => p.profit), 0);
    const maxLoss = Math.abs(Math.min(...playersWithLoss.map(p => p.profit), 0));
    
    const scale = Math.max(maxProfit, maxLoss);

    const profitBars = playersWithProfit.map(p => ({
      ...p,
      width: scale > 0 ? (p.profit / scale) * 100 : 0,
    }));

    const lossBars = playersWithLoss.map(p => ({
      ...p,
      width: scale > 0 ? (Math.abs(p.profit) / scale) * 100 : 0,
    }));

    return { profitBars, lossBars };

  }, [session]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-poker-dark flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Gráfico da Sessão: {session.name}</h3>
          <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
          <div className="space-y-4">
            {chartData.profitBars.map(player => (
              <div key={player.name} className="flex items-center text-sm">
                <span className="w-28 text-right pr-2 truncate text-white" title={player.name}>{player.name}</span>
                <div className="flex-grow bg-poker-dark rounded-full h-6">
                  <div
                    className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${player.width}%` }}
                  >
                    <span className="font-bold text-white text-xs">+ R$ {player.profit.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
            {chartData.lossBars.map(player => (
                <div key={player.name} className="flex items-center text-sm">
                    <span className="w-28 text-right pr-2 truncate text-white" title={player.name}>{player.name}</span>
                    <div className="flex-grow bg-poker-dark rounded-full h-6">
                       <div
                        className="bg-red-500 h-6 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${player.width}%` }}
                      >
                         <span className="font-bold text-white text-xs">R$ {player.profit.toLocaleString('pt-BR')}</span>
                       </div>
                    </div>
                </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SessionGraphModal;
