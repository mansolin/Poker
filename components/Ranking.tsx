import React, { useMemo, useState, useEffect } from 'react';
import type { GamePlayer, Session, Player } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface RankingProps {
  gamePlayers: GamePlayer[];
  sessionHistory: Session[];
  players: Player[];
  gameName: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const profitColor = value >= 0 ? 'text-green-400' : 'text-red-400';
    return (
      <div className="bg-poker-dark p-3 border border-poker-light rounded-md shadow-lg">
        <p className="text-white font-semibold">{label}</p>
        <p className={`text-sm ${profitColor}`}>
          Resultado: R$ {value.toLocaleString('pt-BR')}
        </p>
      </div>
    );
  }
  return null;
};

const Ranking: React.FC<RankingProps> = ({ gamePlayers, sessionHistory, players, gameName }) => {
  const gameRankingData = useMemo(() => {
    return gamePlayers
      .map(p => ({
        name: p.name,
        profit: p.finalChips - p.totalInvested,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [gamePlayers]);

  const availableYears = useMemo(() => {
    const years = new Set(
      sessionHistory.map(s => s.date.toDate().getFullYear().toString())
    );
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [sessionHistory]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

   useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
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
          name: playerNames.get(id)!,
          profit: totalProfit
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [sessionHistory, selectedYear]);


  if (gamePlayers.length === 0 && sessionHistory.length === 0) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Ranking Indisponível</h2>
        <p className="text-poker-gray">Nenhum dado de ranking disponível. Inicie ou finalize um jogo para ver as classificações.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-poker-light p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">
          Classificação do Jogo Atual
          {gameName && <span className="text-poker-gold ml-2">| {gameName}</span>}
        </h2>
        {gamePlayers.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={gameRankingData} margin={{ top: 25, right: 20, left: -20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#A0AEC0" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          interval={0} 
                          angle={-45} 
                          textAnchor="end" 
                        />
                        <YAxis 
                          stroke="#A0AEC0" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 128, 150, 0.1)' }} />
                        <Bar dataKey="profit" name="Resultado">
                          <LabelList 
                            dataKey="profit" 
                            position="top" 
                            formatter={(value: number) => value.toLocaleString('pt-BR')}
                            fontSize={12}
                            className="fill-poker-gray"
                          />
                          {gameRankingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                          ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-poker-gray">Nenhum jogo em andamento.</p>
            </div>
        )}
      </div>
      
      <div className="bg-poker-light p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Ranking Anual Acumulado ({selectedYear})</h2>
            {availableYears.length > 0 && (
                <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block p-2"
                >
                {availableYears.map(year => (
                    <option key={year} value={year}>
                    {year}
                    </option>
                ))}
                </select>
            )}
        </div>
        {annualRankingData.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={annualRankingData} margin={{ top: 25, right: 20, left: -20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#A0AEC0" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          interval={0} 
                          angle={-45} 
                          textAnchor="end" 
                        />
                        <YAxis 
                          stroke="#A0AEC0" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 128, 150, 0.1)' }} />
                        <Bar dataKey="profit" name="Resultado">
                          <LabelList 
                            dataKey="profit" 
                            position="top" 
                            formatter={(value: number) => value.toLocaleString('pt-BR')}
                            fontSize={12}
                            className="fill-poker-gray"
                          />
                          {annualRankingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                          ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
             <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-poker-gray">Nenhum histórico de jogo encontrado para {selectedYear}.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;