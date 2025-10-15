import React, { useState, useMemo } from 'react';
import type { Session } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';


interface SessionHistoryProps {
  sessions: Session[];
  onIncludeGame: () => void;
  onEditGame: (sessionId: string) => void;
  onDeleteGame: (sessionId: string) => void;
  onTogglePayment: (sessionId: string, playerId: string) => void;
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

const PaymentToggle: React.FC<{ paid: boolean; onToggle: () => void }> = ({ paid, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-20 transition-colors duration-300 focus:outline-none`}
    >
      <span className={`absolute left-0 w-1/2 h-full rounded-full transition-transform duration-300 ${paid ? 'transform translate-x-full bg-green-500' : 'bg-poker-gray'}`}></span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-white">{paid ? '' : 'Pendente'}</span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-white">{paid ? 'Pago' : ''}</span>
    </button>
  );
};


const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, onIncludeGame, onEditGame, onDeleteGame, onTogglePayment }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleSession = (sessionId: string) => {
    setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };

  const handleExportWhatsApp = (session: Session) => {
    const rankedPlayers = [...session.players]
      .map(p => ({
        name: p.name.split(' ')[0], // Get first name for brevity
        profit: p.finalChips - p.totalInvested,
      }))
      .sort((a, b) => b.profit - a.profit);
  
    let report = `*📊 Resultado - Poker Night  Poker 📊*\n\n`;
    report += `*Jogo do dia: ${session.name}*\n\n`;
    report += `*Classificação:*\n`;
  
    rankedPlayers.forEach((p, index) => {
      const icon = p.profit >= 0 ? '🟢' : '🔴';
      const sign = p.profit > 0 ? '+' : '';
      report += `${index + 1}º: ${p.name} (${icon} R$ ${sign}${p.profit.toLocaleString('pt-BR')})\n`;
    });
  
    const totalPot = session.players.reduce((sum, p) => sum + p.totalInvested, 0);
    report += `\n*💰 Montante Total: R$ ${totalPot.toLocaleString('pt-BR')}*`;
  
    const encodedReport = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encodedReport}`, '_blank');
  };


  if (sessions.length === 0) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Nenhum Histórico de Sessões</h2>
        <p className="text-poker-gray">Nenhuma sessão de jogo foi concluída ainda. Adicione jogos antigos ou encerre um jogo ao vivo.</p>
         <button
          onClick={onIncludeGame}
          className="mt-6 flex items-center mx-auto px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-poker-green text-white shadow-md hover:bg-poker-green/80"
        >
          <span className="mr-2 h-5 w-5"><PlusIcon /></span>
          Incluir Jogo Antigo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-poker-light p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Histórico de Jogos</h2>
        <button
          onClick={onIncludeGame}
          className="flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-poker-green text-white shadow-md hover:bg-poker-green/80"
        >
          <span className="mr-2 h-5 w-5"><PlusIcon /></span>
          Incluir Jogo
        </button>
      </div>
      <div className="space-y-4">
        {sessions.map(session => {
          const rankedPlayers = [...session.players]
              .map(p => ({
                ...p,
                profit: p.finalChips - p.totalInvested,
              }))
              .sort((a, b) => b.profit - a.profit);

          return (
            <div key={session.id} className="bg-poker-dark rounded-lg overflow-hidden transition-all duration-300">
               <div className="w-full flex justify-between items-center p-4">
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="flex-grow flex items-center text-left hover:opacity-80 focus:outline-none"
                    aria-expanded={expandedSessionId === session.id}
                  >
                    <span className="text-lg font-semibold text-white">Jogo: {session.name}</span>
                    <span className={`ml-3 transform transition-transform duration-300 ${expandedSessionId === session.id ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-poker-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onEditGame(session.id); }} className="p-2 text-poker-gray hover:text-white rounded-full transition-colors duration-200">
                        <EditIcon />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteGame(session.id); }} className="p-2 text-poker-gray hover:text-red-500 rounded-full transition-colors duration-200">
                        <TrashIcon />
                    </button>
                  </div>
               </div>
              {expandedSessionId === session.id && (
                <div className="p-4 border-t border-poker-light/50 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Coluna Esquerda: Tabela */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-poker-light/50">
                      <thead className="bg-poker-light/20">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Jogador</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Fichas Finais</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Resultado (R$)</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Pago?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-poker-light/50">
                        {rankedPlayers.map(player => {
                          const profitColor = player.profit >= 0 ? 'text-green-400' : 'text-red-400';
                          return (
                            <tr key={player.id} className="hover:bg-poker-dark/50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{player.name}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{player.finalChips.toLocaleString('pt-BR')}</td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${profitColor}`}>R$ {player.profit.toLocaleString('pt-BR')}</td>
                               <td className="px-4 py-4 whitespace-nowrap">
                                {player.profit !== 0 && (
                                  <PaymentToggle 
                                    paid={!!player.paid}
                                    onToggle={() => onTogglePayment(session.id, player.id)}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Coluna Direita: Gráfico */}
                  <div className="w-full h-96">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankedPlayers} margin={{ top: 25, right: 20, left: -20, bottom: 70 }}>
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
                          <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 128, 150, 0.1)' }} />
                          <Bar dataKey="profit" name="Resultado">
                            <LabelList 
                              dataKey="profit" 
                              position="top" 
                              formatter={(value: number) => value.toLocaleString('pt-BR')}
                              fontSize={12}
                              className="fill-poker-gray"
                            />
                            {rankedPlayers.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                       <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => handleExportWhatsApp(session)}
                            className="flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-green-600 text-white shadow-md hover:bg-green-700"
                          >
                            <span className="mr-2 h-5 w-5"><WhatsAppIcon /></span>
                            Exportar via WhatsApp
                          </button>
                        </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionHistory;
