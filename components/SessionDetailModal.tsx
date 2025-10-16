import React from 'react';
import type { Session, Player } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
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
        <p className={`text-sm ${value >= 0 ? 'text-poker-gold' : 'text-poker-gray'}`}>R$ {value.toLocaleString('pt-BR')}</p>
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


const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, isUserAdmin, onClose, onEditGame, onDeleteGame, onTogglePayment, onViewProfile }) => {
    const rankedPlayers = [...session.players].map(p => ({ ...p, profit: p.finalChips - p.totalInvested })).sort((a, b) => b.profit - a.profit);
    const totalPot = session.players.reduce((sum, p) => sum + p.totalInvested, 0);

    const handleExportWhatsApp = () => {
        let report = `*📊 Resultado - Poker Club 📊*\n\n*Jogo: ${session.name}*\n\n*Classificação:*\n`;
        rankedPlayers.forEach((p, i) => {
          report += `${i + 1}º: ${p.name.split(' ')[0]} (${p.profit >= 0 ? '🟢' : '🔴'} R$ ${p.profit > 0 ? '+' : ''}${p.profit.toLocaleString('pt-BR')})\n`;
        });
        report += `\n*💰 Montante: R$ ${totalPot.toLocaleString('pt-BR')}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Detalhes do Jogo: {session.name}</h3>
                        <p className="text-sm text-poker-gold">Montante: R$ {totalPot.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isUserAdmin && <button onClick={() => onEditGame(session.id)} className="p-2 text-poker-gray hover:text-white"><EditIcon /></button>}
                        {isUserAdmin && <button onClick={() => onDeleteGame(session.id)} className="p-2 text-poker-gray hover:text-red-500"><TrashIcon /></button>}
                        <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl">&times;</button>
                    </div>
                </div>

                <div className="p-4 flex-grow overflow-y-auto space-y-8">
                    <div className="overflow-x-auto">
                        <h4 className="text-lg font-semibold text-white mb-3">Classificação</h4>
                        <table className="min-w-full divide-y divide-poker-dark">
                        <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Resultado</th><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Pago?</th></tr></thead>
                        <tbody className="divide-y divide-poker-dark">
                            {rankedPlayers.map(player => (
                                <tr key={player.id}><td className="px-4 py-4 whitespace-nowrap"><div className="flex items-center space-x-3"><PlayerAvatar name={player.name} size="sm" /><button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{player.name}</button></div></td><td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${player.profit >= 0 ? 'text-poker-gold' : 'text-red-400'}`}>R$ {player.profit.toLocaleString('pt-BR')}</td><td className="px-4 py-4 whitespace-nowrap">{player.profit !== 0 && <PaymentToggle paid={!!player.paid} onToggle={() => onTogglePayment(session.id, player.id)} disabled={!isUserAdmin} />}</td></tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    <div className="w-full h-96">
                        <h4 className="text-lg font-semibold text-white mb-3">Gráfico de Desempenho</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={rankedPlayers} margin={{ top: 25, right: 10, left: -25, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} />
                            <XAxis dataKey="name" stroke="#A0AEC0" fontSize={10} interval={0} angle={-40} textAnchor="end" />
                            <YAxis stroke="#A0AEC0" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="profit">
                              <LabelList dataKey="profit" position="top" formatter={(v: number) => v.toLocaleString('pt-BR')} fontSize={10} className="fill-poker-gray" />
                              {rankedPlayers.map((entry, i) => (<Cell key={`c-${i}`} fill={entry.profit >= 0 ? '#d69e2e' : '#a0aec0'} />))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="p-3 border-t border-poker-dark text-right flex justify-end items-center gap-4">
                    <button onClick={handleExportWhatsApp} className="flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-green-600 text-white shadow-md hover:bg-green-700"><WhatsAppIcon /> Exportar</button>
                    <button onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailModal;