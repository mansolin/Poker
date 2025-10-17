// FIX: Replaced corrupted file content with a valid React component to resolve compilation errors.
import React, { useMemo } from 'react';
import type { Player, Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import StatCard from './StatCard';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import TrophyIcon from './icons/TrophyIcon';
import HandIcon from './icons/HandIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Dot } from 'recharts';


interface PlayerProfileProps {
  playerId: string;
  players: Player[];
  sessionHistory: Session[];
  onBack: () => void;
}

const CustomizedDot: React.FC<any> = (props) => {
    const { cx, cy, payload } = props;
    const { profit } = payload;
  
    const fillColor = profit >= 0 ? '#d69e2e' : '#ef4444'; // poker-gold or red-500
  
    return <Dot cx={cx} cy={cy} r={5} fill={fillColor} />;
};

const PlayerProfile: React.FC<PlayerProfileProps> = ({ playerId, players, sessionHistory, onBack }) => {
  const { player, stats, playerSessions, chartData } = useMemo(() => {
    const currentPlayer = players.find(p => p.id === playerId);
    if (!currentPlayer) return { player: null, stats: null, playerSessions: [], chartData: [] };

    const sessions = sessionHistory.filter(s => s.players.some(p => p.id === playerId));

    let totalProfit = 0;
    let gamesPlayed = 0;
    let wins = 0;
    let totalInvested = 0;
    let biggestWin = 0;
    
    sessions.forEach(session => {
      const gamePlayer = session.players.find(p => p.id === playerId);
      if (gamePlayer) {
        gamesPlayed++;
        const profit = gamePlayer.finalChips - gamePlayer.totalInvested;
        totalProfit += profit;
        totalInvested += gamePlayer.totalInvested;
        if (profit > 0) wins++;
        if (profit > biggestWin) biggestWin = profit;
      }
    });

    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    const playerStats = { totalProfit, gamesPlayed, winRate, totalInvested, biggestWin };
    
    const playerSessionsSorted = sessions.sort((a, b) => b.date.toMillis() - a.date.toMillis());

    let cumulativeProfit = 0;
    const chartData = [...sessions]
        .sort((a, b) => a.date.toMillis() - b.date.toMillis())
        .map(session => {
            const gamePlayer = session.players.find(p => p.id === playerId);
            const profit = gamePlayer ? gamePlayer.finalChips - gamePlayer.totalInvested : 0;
            cumulativeProfit += profit;
            return {
                name: session.name,
                profit: profit,
                saldoAcumulado: cumulativeProfit,
            };
        });

    return { player: currentPlayer, stats: playerStats, playerSessions: playerSessionsSorted, chartData };
  }, [playerId, players, sessionHistory]);

  if (!player || !stats) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Jogador não encontrado</h2>
        <button onClick={onBack} className="px-6 py-2 text-white bg-poker-gold hover:bg-poker-gold/80 font-medium rounded-lg text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-poker-light text-poker-gray hover:text-white">
          <ArrowLeftIcon />
        </button>
        <PlayerAvatar name={player.name} size="lg" />
        <div>
          <h1 className="text-3xl font-bold text-white">{player.name}</h1>
          <p className="text-poker-gray">{player.whatsapp}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            icon={<TrophyIcon />}
            title="Lucro Total"
            value={`R$ ${stats.totalProfit.toLocaleString('pt-BR')}`}
            valueClassName={stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard 
            icon={<HandIcon />}
            title="Jogos Disputados"
            value={stats.gamesPlayed}
        />
        <StatCard 
            icon={<TrendingUpIcon />}
            title="Maior Prêmio"
            value={`R$ ${stats.biggestWin.toLocaleString('pt-BR')}`}
        />
        <StatCard 
            icon={<TrophyIcon />}
            title="Taxa de Vitória"
            value={`${stats.winRate.toFixed(1)}%`}
        />
      </div>

      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Desempenho Acumulado</h2>
        <div className="min-h-[24rem] w-full">
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} tick={{ angle: -25, textAnchor: 'end' }} />
                    <YAxis stroke="#a0aec0" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }}
                        labelStyle={{ color: '#a0aec0' }}
                        formatter={(value, name) => [`R$${Number(value).toLocaleString('pt-BR')}`, name === 'saldoAcumulado' ? 'Saldo Acumulado' : 'Resultado']}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }}/>
                    <Line 
                        type="monotone" 
                        dataKey="saldoAcumulado" 
                        name="Saldo Acumulado" 
                        stroke="#d69e2e" 
                        strokeWidth={2} 
                        dot={<CustomizedDot />}
                        activeDot={{ r: 8 }} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Histórico de Jogos</h2>
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
          {playerSessions.length > 0 ? (
            playerSessions.map(session => {
              const gameData = session.players.find(p => p.id === playerId);
              if (!gameData) return null;
              const profit = gameData.finalChips - gameData.totalInvested;
              return (
                <div key={session.id} className="flex items-center justify-between bg-poker-dark p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{session.name}</p>
                    <p className="text-xs text-poker-gray">
                      Investido: R$ {gameData.totalInvested.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className={`font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {profit.toLocaleString('pt-BR')}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-center text-poker-gray py-8">Nenhum jogo no histórico.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
