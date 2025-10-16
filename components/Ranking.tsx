import React, { useMemo, useState, useEffect } from 'react';
import type { Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import StatCard from './StatCard';
import TrendingUpIcon from './icons/TrendingUpIcon';
import HandIcon from './icons/HandIcon';
import CrownIcon from './icons/CrownIcon';
import MedalIcon from './icons/MedalIcon';

interface RankingProps {
  sessionHistory: Session[];
  onViewProfile: (playerId: string) => void;
  onViewSession: (sessionId: string) => void;
}

const Ranking: React.FC<RankingProps> = ({ sessionHistory, onViewProfile, onViewSession }) => {
  const [rankingView, setRankingView] = useState<'annual' | 'lastGame'>('annual');

  const highlightStats = useMemo(() => {
    if (sessionHistory.length === 0) {
      return { totalPot: 0, biggestWin: null, biggestWinner: null, kingOfConsistency: null };
    }

    const totalPot = sessionHistory.reduce((sum, session) => sum + session.players.reduce((pSum, p) => pSum + p.totalInvested, 0), 0);

    let biggestWin: { name: string; value: number; playerId: string; sessionId: string; date: string } | null = null;
    sessionHistory.forEach(session => {
      session.players.forEach(p => {
        const profit = p.finalChips - p.totalInvested;
        if (!biggestWin || profit > biggestWin.value) {
          biggestWin = {
            name: p.name,
            value: profit,
            playerId: p.id,
            sessionId: session.id,
            date: session.date.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
          };
        }
      });
    });

    const playerStats = new Map<string, { id: string; name: string; total: number; wins: number }>();
    sessionHistory.forEach(session => {
      session.players.forEach(p => {
        const profit = p.finalChips - p.totalInvested;
        const current = playerStats.get(p.id) || { id: p.id, name: p.name, total: 0, wins: 0 };
        playerStats.set(p.id, {
          ...current,
          total: current.total + profit,
          wins: current.wins + (profit > 0 ? 1 : 0),
        });
      });
    });

    const sortedByProfit = Array.from(playerStats.values()).sort((a, b) => b.total - a.total);
    const biggestWinner = sortedByProfit.length > 0 ? { name: sortedByProfit[0].name, value: sortedByProfit[0].total, playerId: sortedByProfit[0].id } : null;

    const sortedByWins = Array.from(playerStats.values()).sort((a, b) => b.wins - a.wins);
    const kingOfConsistency = sortedByWins.length > 0 ? { name: sortedByWins[0].name, value: sortedByWins[0].wins, playerId: sortedByWins[0].id } : null;

    return { totalPot, biggestWin, biggestWinner, kingOfConsistency };
  }, [sessionHistory]);

  const availableYears = useMemo(() => {
    const years = new Set(sessionHistory.map(s => s.date.toDate().getFullYear().toString()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [sessionHistory]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) setSelectedYear(availableYears[0]);
    else if (availableYears.length === 0) setSelectedYear(new Date().getFullYear().toString());
  }, [availableYears, selectedYear]);

  const annualRankingData = useMemo(() => {
    const profits = new Map<string, number>();
    const playerNames = new Map<string, string>();
    sessionHistory.filter(s => s.date.toDate().getFullYear().toString() === selectedYear).forEach(s => {
      s.players.forEach(p => {
        profits.set(p.id, (profits.get(p.id) || 0) + (p.finalChips - p.totalInvested));
        if (!playerNames.has(p.id)) playerNames.set(p.id, p.name);
      });
    });
    return Array.from(profits.entries()).map(([id, profit]) => ({ id, name: playerNames.get(id)!, profit })).sort((a, b) => b.profit - a.profit);
  }, [sessionHistory, selectedYear]);

  const lastGameRankingData = useMemo(() => {
    if (sessionHistory.length === 0) return [];
    return sessionHistory[0].players.map(p => ({ id: p.id, name: p.name, profit: p.finalChips - p.totalInvested })).sort((a, b) => b.profit - a.profit);
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
  const title = rankingView === 'annual' ? `Ranking Anual (${selectedYear})` : `Resultado - Último Jogo (${sessionHistory[0]?.name || ''})`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUpIcon />} title="Total Jogado" value={`R$ ${highlightStats.totalPot.toLocaleString('pt-BR')}`} valueClassName="text-4xl md:text-5xl" />
          <StatCard icon={<HandIcon />} title="Maior Prêmio/Jogo" value={`R$ ${highlightStats.biggestWin?.value.toLocaleString('pt-BR')}`} subtitle={highlightStats.biggestWin?.name} details={highlightStats.biggestWin?.date} onValueClick={() => highlightStats.biggestWin && onViewSession(highlightStats.biggestWin.sessionId)} onSubtitleClick={() => highlightStats.biggestWin && onViewProfile(highlightStats.biggestWin.playerId)} />
          <StatCard icon={<CrownIcon />} title="Maior Ganhador (Acumulado)" value={`R$ ${highlightStats.biggestWinner?.value.toLocaleString('pt-BR')}`} subtitle={highlightStats.biggestWinner?.name} onSubtitleClick={() => highlightStats.biggestWinner && onViewProfile(highlightStats.biggestWinner.playerId)} />
          <StatCard icon={<MedalIcon />} title="Rei da Constância" value={`${highlightStats.kingOfConsistency?.value} vitórias`} subtitle={highlightStats.kingOfConsistency?.name} onSubtitleClick={() => highlightStats.kingOfConsistency && onViewProfile(highlightStats.kingOfConsistency.playerId)} />
      </div>

      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center bg-poker-dark p-1 rounded-lg">
            <button onClick={() => setRankingView('lastGame')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${rankingView === 'lastGame' ? 'bg-poker-green text-white' : 'text-poker-gray'}`}>Último Jogo</button>
            <button onClick={() => setRankingView('annual')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${rankingView === 'annual' ? 'bg-poker-green text-white' : 'text-poker-gray'}`}>Anual</button>
          </div>
          {rankingView === 'annual' && availableYears.length > 0 && (<select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2"><{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select>)}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
          {dataToDisplay.length > 0 ? (
            dataToDisplay.map((playerData, index) => (
              <div key={playerData.id} className={`flex items-center justify-between bg-poker-dark p-3 rounded-lg border-l-4 ${getPodiumColor(index)}`}>
                <div className="flex items-center"><span className="text-xl font-bold text-poker-gray w-8 text-center">{index + 1}º</span><PlayerAvatar name={playerData.name} size="md" /><button onClick={() => onViewProfile(playerData.id)} className="ml-4 text-lg font-semibold text-white hover:text-poker-gold text-left">{playerData.name}</button></div>
                <div className={`text-xl font-bold ${playerData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {playerData.profit.toLocaleString('pt-BR')}</div>
              </div>
            ))
          ) : (<p className="text-center text-poker-gray py-8">{rankingView === 'annual' ? `Nenhum dado de jogo encontrado para ${selectedYear}.` : 'Nenhum dado encontrado para o último jogo.'}</p>)}
        </div>
      </div>
    </div>
  );
};

export default Ranking;