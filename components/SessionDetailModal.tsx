import React from 'react';
import type { Session, Player } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlayerAvatar from './PlayerAvatar';

interface SessionDetailModalProps {
  isUserAdmin: boolean;
  session: Session;
  onClose: () => void;
  onEditGame: (sessionId: string) => void;
  onDeleteGame: (sessionId: string) => void;
  onTogglePayment: (sessionId: string, playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-poker-dark p-3 border border-poker-light rounded-md shadow-lg">
        <p className="text-white font-semibold">{label}</p>
        <p className={`text-sm ${value >= 0 ? 'text-poker-gold' : 'text-red-400'}`}>R$ {value.toLocaleString('pt-BR')}</p>
      </div>
    );
  }
  return null;
};

const PaymentToggle: React.FC<{ paid: boolean; onToggle: () => void; disabled: boolean }> = ({ paid, onToggle, disabled }) => (
  <button onClick={onToggle} disabled={disabled} className={`relative inline-flex items-center h-6 rounded-full w-20 ${disabled ? 'cursor-not-allowed' : ''}`}>
    <span className={`absolute left-0 w-1/2 h-full rounded-full transition-transform duration-300 ${paid ? 'transform translate-x-full bg-green-500' : 'bg-poker-gray'}`}></span>
    <span className="relative z-10 w-1/2 text-xs font-bold text-white">{paid ? '' : 'Pendente'}</span>
    <span className="relative z-10 w-1/2 text-xs font-bold text-white">{paid ? 'Pago' : ''}</span>
  </button>
);

const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    const color = value > 0 ? '#d69e2e' : '#fca5a5';
    
    return (
        <text x={x + width / 2} y={y} fill={color} textAnchor="middle" dy={-5} fontSize={10} fontWeight="bold">
            {value.toLocaleString('pt-BR')}
        </text>
    );
};


const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, isUserAdmin, onClose, onEditGame, onDeleteGame, onTogglePayment, onViewProfile }) => {
    const rankedPlayers = [...(session.players || [])]
      .map(p => ({ ...p, profit: (p.finalChips || 0) - (p.totalInvested || 0) }))
      .sort((a, b) => b.profit - a.profit);
      
    const totalPot = (session.players || []).reduce((sum, p) => sum + (p.totalInvested || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Detalhes do Jogo: {session.name}</h3>
                        <p className="text-sm text-poker-gold">Montante: R$ {totalPot.toLocaleString('pt-BR')}</p>
                    </div>
                    {isUserAdmin && (
                        <div className="flex items-center gap-2">
                           <button onClick={() => onEditGame(session.id)} className="p-2 text-poker-gray hover:text-white" title="Editar Jogo"><EditIcon /></button>
                           <button onClick={() => onDeleteGame(session.id)} className="p-2 text-poker-gray hover:text-red-500" title="Excluir Jogo"><TrashIcon /></button>
                        </div>
                    )}
                </div>

                <div className="p-4 flex-grow overflow-y-auto space-y-8">
                    <div className="overflow-x-auto">
                        <h4 className="text-lg font-semibold text-white mb-3">Classificação</h4>
                        <table className="min-w-full divide-y divide-poker-dark">
                        <thead><tr><th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th><th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Resultado</th><th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Pago?</th></tr></thead>
                        <tbody className="divide-y divide-poker-dark">
                            {rankedPlayers.map(player => (
                                <tr key={player.id}><td className="px-2 sm:px-4 py-4 whitespace-nowrap"><div className="flex items-center space-x-3"><PlayerAvatar name={player.name} size="sm" /><button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{player.name}</button></div></td><td className={`px-2 sm:px-4 py-4 whitespace-nowrap text-sm font-bold ${player.profit >= 0 ? 'text-poker-gold' : 'text-red-400'}`}>R$ {player.profit.toLocaleString('pt-BR')}</td><td className="px-2 sm:px-4 py-4 whitespace-nowrap">{player.profit !== 0 && <PaymentToggle paid={!!player.paid} onToggle={() => onTogglePayment(session.id, player.id)} disabled={!isUserAdmin} />}</td></tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    <div className="w-full h-96">
                        <h4 className="text-lg font-semibold text-white mb-3">Gráfico de Desempenho</h4>
                         {rankedPlayers && rankedPlayers.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={rankedPlayers} margin={{ top: 20, right: 10, left: -25, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} />
                                <XAxis dataKey="name" stroke="#A0AEC0" fontSize={10} interval={0} angle={-45} textAnchor="end" dy={10} />
                                <YAxis stroke="#A0AEC0" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="profit">
                                  <LabelList dataKey="profit" content={renderCustomizedLabel} />
                                  {rankedPlayers.map((entry, i) => (
                                    <Cell key={`c-${i}`} fill={entry.profit >= 0 ? '#d69e2e' : '#ef4444'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-poker-gray">Não há dados para exibir o gráfico.</p>
                            </div>
                        )}
                    </div>
                </div>

                 <div className="p-3 border-t border-poker-dark flex justify-end items-center">
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 text-sm font-semibold bg-red-800/50 text-red-400 hover:bg-red-800 hover:text-white rounded-lg transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailModal;