import React, { useMemo } from 'react';
import type { Player, Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PlayerProfileProps {
  playerId: string | null;
  players: Player[];
  sessionHistory: Session[];
  onBack: () => void;
}

const parseDateFromName = (name: string): Date => {
    const parts = name.split('/');
    if (parts.length !== 3) return new Date(0);
    const year = 2000 + parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
    const day = parseInt(parts[0], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month) {
        return new Date(0);
    }
    return date;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const profitColor = value >= 0 ? 'text-green-400' : 'text-red-400';
    return (
      <div className="bg-poker-dark p-3 border border-poker-light rounded-md shadow-lg">
        <p className="text-white font-semibold">{label}</p>
        <p className={`text-sm ${profitColor}`}>
          Saldo Acumulado: R$ {value.toLocaleString('pt-BR')}
        </p>
      </div>
    );
  }
  return null;
};

const PlayerProfile: React.FC<PlayerProfileProps> = ({ playerId, players, sessionHistory, onBack }) => {
  const player = useMemo(() => players.find(p => p.id === playerId), [playerId, players]);

  const stats = useMemo(() => {
    if (!player) return null;

    const playerSessions = sessionHistory
      .map(session => ({
        ...session,
        playerData: session.players.find(p => p.id === player.id)
      }))
      .filter(session => session.playerData)
      .sort((a, b) => parseDateFromName(a.name).getTime() - parseDateFromName(b.name).getTime());

    let totalProfit = 0;
    let gamesPlayed = 0;
    let positiveGames = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    let cumulativeProfit = 0;

    const chartData = playerSessions.map(session => {
      gamesPlayed++;
      const profit = session.playerData!.finalChips - session.playerData!.totalInvested;
      totalProfit += profit;
      cumulativeProfit += profit;
      if (profit > 0) positiveGames++;
      if (profit > biggestWin) biggestWin = profit;
      if (profit < biggestLoss) biggestLoss = profit;
      
      return {
        name: session.name,
        profit: profit,
        cumulativeProfit: cumulativeProfit,
      };
    });

    const winRate = gamesPlayed > 0 ? (positiveGames / gamesPlayed) * 100 : 0;

    return {
      totalProfit,
      gamesPlayed,
      winRate,
      biggestWin,
      biggestLoss,
      chartData,
    };
  }, [player, sessionHistory]);

  if (!player || !stats) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Jogador não encontrado</h2>
        <button onClick={onBack} className="mt-4 px-6 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-poker-light p-6 rounded-lg shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <PlayerAvatar name={player.name} size="lg" />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-white">{player.name}</h1>
          <p className="text-poker-gray">{player.whatsapp} | PIX: {player.pixKey}</p>
        </div>
        <button onClick={onBack} className="mt-4 sm:mt-0 sm:ml-auto px-6 py-2 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 font-medium rounded-lg text-sm">
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div className="bg-poker-light p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-poker-gray uppercase">Saldo Total</h3>
          <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {stats.totalProfit.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="bg-poker-light p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-poker-gray uppercase">Jogos</h3>
          <p className="text-2xl font-bold text-white">{stats.gamesPlayed}</p>
        </div>
        <div className="bg-poker-light p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-poker-gray uppercase">Vitórias (%)</h3>
          <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-poker-light p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-poker-gray uppercase">Maior Ganho</h3>
          <p className="text-2xl font-bold text-green-400">R$ {stats.biggestWin.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-poker-light p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-poker-gray uppercase">Maior Perda</h3>
          <p className="text-2xl font-bold text-red-400">R$ {stats.biggestLoss.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="bg-poker-light p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Desempenho Acumulado</h2>
        {stats.chartData.length > 1 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={stats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" />
                <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="cumulativeProfit" name="Saldo Acumulado" stroke="#d69e2e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <p className="text-poker-gray">Dados insuficientes para gerar o gráfico de desempenho.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;