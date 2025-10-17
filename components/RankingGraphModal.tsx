import React, { useMemo } from 'react';

interface PlayerStats {
  id: string;
  name: string;
  profit: number;
  gamesPlayed: number;
  winRate: number;
  totalInvested: number;
  biggestWin: number;
}

interface RankingGraphModalProps {
  rankedPlayers: PlayerStats[];
  onClose: () => void;
}

const RankingGraphModal: React.FC<RankingGraphModalProps> = ({ rankedPlayers, onClose }) => {
  const chartData = useMemo(() => {
    const playersWithProfit = rankedPlayers.filter(p => p.profit > 0);
    const playersWithLoss = rankedPlayers.filter(p => p.profit < 0).sort((a, b) => a.profit - b.profit);

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
  }, [rankedPlayers]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-poker-dark flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Gráfico de Ganhos e Perdas</h3>
          <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
        </header>
        <main className="p-4 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-4 text-center">Jogadores com Lucro</h4>
              <div className="space-y-3">
                {chartData.profitBars.map(player => (
                  <div key={player.id} className="flex items-center text-sm">
                    <span className="w-28 text-right pr-2 truncate text-white" title={player.name}>{player.name}</span>
                    <div className="flex-grow bg-poker-dark rounded-full h-6">
                      <div
                        className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${player.width}%` }}
                      >
                        <span className="font-bold text-white text-xs">R$ {player.profit.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {chartData.profitBars.length === 0 && <p className="text-center text-poker-gray">Nenhum jogador com lucro.</p>}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-400 mb-4 text-center">Jogadores com Prejuízo</h4>
              <div className="space-y-3">
                {chartData.lossBars.map(player => (
                  <div key={player.id} className="flex items-center text-sm">
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
                 {chartData.lossBars.length === 0 && <p className="text-center text-poker-gray">Nenhum jogador com prejuízo.</p>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RankingGraphModal;
