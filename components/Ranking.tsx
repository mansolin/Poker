import React, { useMemo, useState, useEffect } from 'react';
import type { Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import StatCard from './StatCard';
import RankingGraphModal from './RankingGraphModal';
import TrophyIcon from './icons/TrophyIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import HandIcon from './icons/HandIcon';
import CrownIcon from './icons/CrownIcon';
import BarChartIcon from './icons/BarChartIcon';
import MedalIcon from './icons/MedalIcon';

interface RankingProps {
  sessionHistory: Session[];
  onViewProfile: (playerId: string) => void;
  onViewSession: (sessionId: string) => void;
}

interface PlayerStats {
  id: string;
  name: string;
  profit: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  totalInvested: number;
  biggestWin: number;
  biggestWinSessionId: string | null;
}

const calculateStats = (sessions: Session[]): { rankedPlayers: PlayerStats[], totalGames: number, totalPot: number, biggestWinner: PlayerStats | null, biggestPrizePlayer: PlayerStats | null } => {
    const stats = new Map<string, PlayerStats>();

    sessions.forEach(session => {
        session.players.forEach(p => {
            if (!stats.has(p.id)) {
                stats.set(p.id, {
                    id: p.id, name: p.name, profit: 0, gamesPlayed: 0, wins: 0,
                    winRate: 0, totalInvested: 0, biggestWin: 0, biggestWinSessionId: null
                });
            }
            const playerStats = stats.get(p.id)!;
            const profit = p.finalChips - p.totalInvested;

            playerStats.profit += profit;
            playerStats.gamesPlayed++;
            playerStats.totalInvested += p.totalInvested;
            if (profit > 0) playerStats.wins++;
            if (profit > playerStats.biggestWin) {
                playerStats.biggestWin = profit;
                playerStats.biggestWinSessionId = session.id;
            }
        });
    });

    const rankedPlayers = Array.from(stats.values())
        .map(p => ({ ...p, winRate: p.gamesPlayed > 0 ? (p.wins / p.gamesPlayed) * 100 : 0 }))
        .sort((a, b) => b.profit - a.profit);
    
    const totalGames = sessions.length;
    const totalPot = sessions.reduce((sum, s) => sum + s.players.reduce((ps, p) => ps + p.totalInvested, 0), 0);
    
    const biggestWinner = [...rankedPlayers].sort((a, b) => b.profit - a.profit)[0] || null;
    const biggestPrizePlayer = [...rankedPlayers].sort((a,b) => b.biggestWin - a.biggestWin)[0] || null;

    return { rankedPlayers, totalGames, totalPot, biggestWinner, biggestPrizePlayer };
};


const Ranking: React.FC<RankingProps> = ({ sessionHistory, onViewProfile, onViewSession }) => {
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<'acumulado' | 'anual' | 'ultimoJogo'>('acumulado');

    const availableYears = useMemo(() => {
        if (!sessionHistory) return [];
        const years = new Set<number>();
        sessionHistory.forEach(session => {
            years.add(session.date.toDate().getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [sessionHistory]);

    const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());

    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);
    
    // All-time stats for the cards, never changes with filters
    const allTimeStats = useMemo(() => calculateStats(sessionHistory), [sessionHistory]);

    // Filtered sessions for the list below the cards
    const filteredSessions = useMemo(() => {
        if (!sessionHistory) return [];
        switch (filterType) {
            case 'ultimoJogo':
                const sortedHistory = [...sessionHistory].sort((a, b) => b.date.toMillis() - a.date.toMillis());
                return sortedHistory.length > 0 ? [sortedHistory[0]] : [];
            case 'anual':
                return sessionHistory.filter(session => session.date.toDate().getFullYear() === selectedYear);
            case 'acumulado':
            default:
                return sessionHistory;
        }
    }, [sessionHistory, filterType, selectedYear]);
    
    // Filtered ranking data for the list and graph
    const filteredRankingData = useMemo(() => calculateStats(filteredSessions), [filteredSessions]);


    const getRankColor = (index: number) => {
        if (index === 0) return 'border-poker-gold bg-poker-gold/10';
        if (index === 1) return 'border-gray-400 bg-gray-400/10';
        if (index === 2) return 'border-yellow-700 bg-yellow-700/10';
        return 'border-transparent';
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <TrophyIcon />;
        if (index === 1) return <MedalIcon />;
        if (index === 2) return <MedalIcon />;
        return <span className="font-bold text-sm">{index + 1}</span>;
    };
    
    if (sessionHistory.length === 0) {
        return (
             <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4">Sem dados para exibir</h2>
                <p className="text-poker-gray mb-6">Nenhum jogo foi salvo no histórico ainda.</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                   <StatCard 
                        icon={<CrownIcon />}
                        title="Maior Ganhador (Total)"
                        value={allTimeStats.biggestWinner?.name || '-'}
                        onValueClick={() => allTimeStats.biggestWinner && onViewProfile(allTimeStats.biggestWinner.id)}
                        subtitle={`R$ ${allTimeStats.biggestWinner?.profit.toLocaleString('pt-BR') || '0'}`}
                    />
                    <StatCard 
                        icon={<TrophyIcon />}
                        title="Maior Prêmio (Único)"
                        value={`R$ ${allTimeStats.biggestPrizePlayer?.biggestWin.toLocaleString('pt-BR') || '0'}`}
                        subtitle={allTimeStats.biggestPrizePlayer?.name}
                        onSubtitleClick={() => allTimeStats.biggestPrizePlayer && allTimeStats.biggestPrizePlayer.biggestWinSessionId && onViewSession(allTimeStats.biggestPrizePlayer.biggestWinSessionId)}
                    />
                    <StatCard 
                        icon={<HandIcon />}
                        title="Total de Partidas"
                        value={allTimeStats.totalGames}
                        subtitle={`Acumulado`}
                    />
                    <StatCard 
                        icon={<TrendingUpIcon />}
                        title="Montante Total"
                        value={`R$ ${allTimeStats.totalPot.toLocaleString('pt-BR')}`}
                        subtitle={`Acumulado`}
                    />
                </div>
                
                <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
                        <div className="flex border-b border-poker-dark">
                            <button onClick={() => setFilterType('acumulado')} className={`px-4 py-2 text-sm font-semibold transition-colors ${filterType === 'acumulado' ? 'text-poker-gold border-b-2 border-poker-gold' : 'text-poker-gray hover:text-white'}`}>
                                Acumulado
                            </button>
                            <button onClick={() => setFilterType('anual')} className={`px-4 py-2 text-sm font-semibold transition-colors ${filterType === 'anual' ? 'text-poker-gold border-b-2 border-poker-gold' : 'text-poker-gray hover:text-white'}`}>
                                Anual
                            </button>
                            <button onClick={() => setFilterType('ultimoJogo')} className={`px-4 py-2 text-sm font-semibold transition-colors ${filterType === 'ultimoJogo' ? 'text-poker-gold border-b-2 border-poker-gold' : 'text-poker-gray hover:text-white'}`}>
                                Último Jogo
                            </button>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {filterType === 'anual' && availableYears.length > 0 && (
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 focus:ring-poker-gold focus:border-poker-gold w-full sm:w-auto"
                                >
                                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            )}
                             <button onClick={() => setIsGraphModalOpen(true)} className="flex items-center justify-center w-full sm:w-auto px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                               <span className="h-5 w-5 mr-2"><BarChartIcon/></span> Visualizar Gráfico
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-2">
                        {filteredRankingData.rankedPlayers.map((player, index) => (
                            <div key={player.id} className={`flex items-center bg-poker-dark py-1 px-2 rounded-lg border-l-4 ${getRankColor(index)}`}>
                                <div className="w-6 h-6 flex items-center justify-center text-poker-gray font-bold flex-shrink-0">{getRankIcon(index)}</div>
                                <PlayerAvatar name={player.name} size="xs" />
                                <div className="ml-2 flex-grow cursor-pointer min-w-0" onClick={() => onViewProfile(player.id)}>
                                    <p className="text-sm text-white hover:text-poker-gold truncate">{player.name}</p>
                                    <p className="text-xs text-poker-gray">{player.gamesPlayed} jogos</p>
                                </div>
                                <div className="flex-shrink-0 ml-auto text-right w-24">
                                    <p className={`text-sm font-semibold ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        R$ {player.profit.toLocaleString('pt-BR')}
                                    </p>
                                    <p className="text-xs text-poker-gray">{player.winRate.toFixed(0)}% vitórias</p>
                                </div>
                            </div>
                        ))}
                        {filteredRankingData.rankedPlayers.length === 0 && (
                          <p className="text-center text-poker-gray py-8">Nenhum dado para o filtro selecionado.</p>
                        )}
                    </div>
                </div>
            </div>
            {isGraphModalOpen && (
                <RankingGraphModal
                    rankedPlayers={filteredRankingData.rankedPlayers}
                    onClose={() => setIsGraphModalOpen(false)}
                />
            )}
        </>
    );
};

export default Ranking;