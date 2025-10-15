import React, { useMemo, useState, useEffect } from 'react';
import type { Session } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface RankingProps {
  sessionHistory: Session[];
  onViewProfile: (playerId: string) => void;
}

const Ranking: React.FC<RankingProps> = ({ sessionHistory, onViewProfile }) => {
  const [rankingView, setRankingView] = useState<'annual' | 'lastGame'>('annual');

  const availableYears = useMemo(() => {
    const years = new Set(sessionHistory.map(s => s.date.toDate().getFullYear().toString()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [sessionHistory]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    } else if (availableYears.length === 0) {
      setSelectedYear(new Date().getFullYear().toString());
    }
  }, [availableYears, selectedYear]);

  const annualRankingData = useMemo(() => {
    const profits = new Map<string, number>();
    const playerNames = new Map<string, string>();

    sessionHistory
      .filter(session => session.date.toDate().getFullYear().toString() === selectedYear)
      .forEach(session => {
        session.players.forEach(p => {
          const currentProfit = profits.get(p.id) || 0;
          profits.set(p.id, currentProfit + (p.finalChips - p.totalInvested));
          if (!playerNames.has(p.id)) {
            playerNames.set(p.id, p.name);
          }
        });
      });

    return Array.from(profits.entries())
      .map(([id, totalProfit]) => ({
        id,
        name: playerNames.get(id)!,
        profit: totalProfit,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [sessionHistory, selectedYear]);

  const lastGameRankingData = useMemo(() => {
    if (sessionHistory.length === 0) return [];
    const lastSession = sessionHistory[0]; // Sessions are pre-sorted by date desc
    return lastSession.players
      .map(p => ({
        id: p.id,
        name: p.name,
        profit: p.finalChips - p.totalInvested,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [sessionHistory]);

  if (sessionHistory.length === 0) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Ranking Indisponível</h2>
        <p className="text-poker-gray">Nenhum histórico de jogo encontrado para gerar o ranking.</p>
      </div>
    );
  }
  
  const getPodiumColor = (index: number) => {
    if (index === 0) return 'border-poker-gold bg-poker-gold/10';
    if (index === 1) return 'border-gray-400 bg-gray-400/10';
    if (index === 2) return 'border-yellow-700 bg-yellow-700/10';
    return 'border-transparent';
  };

  const dataToDisplay = rankingView === 'annual' ? annualRankingData : lastGameRankingData;
  const title = rankingView === 'annual' 
    ? `Ranking Anual (${selectedYear})` 
    : `Resultado - Último Jogo (${sessionHistory[0]?.name || ''})`;

  return (
    <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center bg-poker-dark p-1 rounded-lg">
          <button onClick={() => setRankingView('lastGame')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${rankingView === 'lastGame' ? 'bg-poker-green text-white' : 'text-poker-gray'}`}>
            Último Jogo
          </button>
          <button onClick={() => setRankingView('annual')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${rankingView === 'annual' ? 'bg-poker-green text-white' : 'text-poker-gray'}`}>
            Anual
          </button>
        </div>
        {rankingView === 'annual' && availableYears.length > 0 && (
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        )}
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{title}</h2>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
        {dataToDisplay.length > 0 ? (
          dataToDisplay.map((playerData, index) => (
            <div key={playerData.id} className={`flex items-center justify-between bg-poker-dark p-3 rounded-lg border-l-4 ${getPodiumColor(index)}`}>
              <div className="flex items-center">
                <span className="text-xl font-bold text-poker-gray w-8 text-center">{index + 1}º</span>
                <PlayerAvatar name={playerData.name} size="md" />
                <button onClick={() => onViewProfile(playerData.id)} className="ml-4 text-lg font-semibold text-white hover:text-poker-gold text-left">
                  {playerData.name}
                </button>
              </div>
              <div className={`text-xl font-bold ${playerData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {playerData.profit.toLocaleString('pt-BR')}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-poker-gray py-8">
            {rankingView === 'annual' ? `Nenhum dado de jogo encontrado para ${selectedYear}.` : 'Nenhum dado encontrado para o último jogo.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Ranking;