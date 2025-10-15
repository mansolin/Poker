import React, { useState, useMemo } from 'react';
import type { Session, Player } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import PlayerAvatar from './PlayerAvatar';

interface SessionHistoryProps {
  isUserAdmin: boolean;
  sessions: Session[];
  players: Player[];
  onIncludeGame: () => void;
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
        <p className={`text-sm ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {value.toLocaleString('pt-BR')}</p>
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

const SessionHistory: React.FC<SessionHistoryProps> = ({ isUserAdmin, sessions, players, onIncludeGame, onEditGame, onDeleteGame, onTogglePayment, onViewProfile }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlayerId, setFilterPlayerId] = useState('');

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchSearch = searchTerm === '' || session.name.includes(searchTerm);
      const matchPlayer = filterPlayerId === '' || session.players.some(p => p.id === filterPlayerId);
      return matchSearch && matchPlayer;
    });
  }, [sessions, searchTerm, filterPlayerId]);

  const toggleSession = (sessionId: string) => setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));

  const handleExportWhatsApp = (session: Session) => {
    const rankedPlayers = [...session.players].map(p => ({ name: p.name.split(' ')[0], profit: p.finalChips - p.totalInvested })).sort((a, b) => b.profit - a.profit);
    let report = `*📊 Resultado - Poker Club 📊*\n\n*Jogo: ${session.name}*\n\n*Classificação:*\n`;
    rankedPlayers.forEach((p, i) => {
      report += `${i + 1}º: ${p.name} (${p.profit >= 0 ? '🟢' : '🔴'} R$ ${p.profit > 0 ? '+' : ''}${p.profit.toLocaleString('pt-BR')})\n`;
    });
    const totalPot = session.players.reduce((sum, p) => sum + p.totalInvested, 0);
    report += `\n*💰 Montante: R$ ${totalPot.toLocaleString('pt-BR')}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (sessions.length === 0 && isUserAdmin) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Nenhum Histórico</h2>
        {isUserAdmin && (<button onClick={onIncludeGame} className="mt-6 flex items-center mx-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white"><span className="h-5 w-5 mr-2"><PlusIcon /></span> Incluir Jogo Antigo</button>)}
      </div>
    );
  }

  return (
    <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Histórico de Jogos</h2>
        {isUserAdmin && <button onClick={onIncludeGame} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white"><span className="h-5 w-5 mr-2"><PlusIcon /></span> Incluir Jogo</button>}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-poker-dark rounded-lg">
        <input type="text" placeholder="Buscar por data (dd/mm/aa)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-1/2 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
        <select value={filterPlayerId} onChange={e => setFilterPlayerId(e.target.value)} className="w-full sm:w-1/2 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2">
          <option value="">Filtrar por jogador...</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {filteredSessions.length > 0 ? filteredSessions.map(session => {
          const rankedPlayers = [...session.players].map(p => ({ ...p, profit: p.finalChips - p.totalInvested })).sort((a, b) => b.profit - a.profit);
          return (
            <div key={session.id} className="bg-poker-dark rounded-lg overflow-hidden">
               <div className="w-full flex justify-between items-center p-4">
                  <button onClick={() => toggleSession(session.id)} className="flex-grow flex items-center text-left"><span className="text-base sm:text-lg font-semibold text-white">Jogo: {session.name}</span><span className={`ml-3 transform transition-transform ${expandedSessionId === session.id ? 'rotate-180' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-poker-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></span></button>
                  {isUserAdmin && <div className="flex items-center space-x-1"><button onClick={(e) => { e.stopPropagation(); onEditGame(session.id); }} className="p-2 text-poker-gray hover:text-white"><EditIcon /></button><button onClick={(e) => { e.stopPropagation(); onDeleteGame(session.id); }} className="p-2 text-poker-gray hover:text-red-500"><TrashIcon /></button></div>}
               </div>
              {expandedSessionId === session.id && (
                <div className="p-4 border-t border-poker-light/50 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-poker-light/50">
                      <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Resultado</th><th className="px-4 py-3 text-left text-xs font-medium text-poker-gray uppercase">Pago?</th></tr></thead>
                      <tbody className="divide-y divide-poker-light/50">
                        {rankedPlayers.map(player => (
                            <tr key={player.id}><td className="px-4 py-4 whitespace-nowrap"><div className="flex items-center space-x-3"><PlayerAvatar name={player.name} size="sm" /><button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{player.name}</button></div></td><td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {player.profit.toLocaleString('pt-BR')}</td><td className="px-4 py-4 whitespace-nowrap">{player.profit !== 0 && <PaymentToggle paid={!!player.paid} onToggle={() => onTogglePayment(session.id, player.id)} disabled={!isUserAdmin} />}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="w-full h-80 sm:h-96">
                       <ResponsiveContainer width="100%" height="100%"><BarChart data={rankedPlayers} margin={{ top: 25, right: 10, left: -25, bottom: 50 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.5} /><XAxis dataKey="name" stroke="#A0AEC0" fontSize={10} interval={0} angle={-40} textAnchor="end" /><YAxis stroke="#A0AEC0" fontSize={12} tickFormatter={(v) => `R$${v}`} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="profit"><LabelList dataKey="profit" position="top" formatter={(v: number) => v.toLocaleString('pt-BR')} fontSize={10} className="fill-poker-gray" />{rankedPlayers.map((entry, i) => (<Cell key={`c-${i}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />))}</Bar></BarChart></ResponsiveContainer>
                    </div>
                    <div className="flex justify-center"><button onClick={() => handleExportWhatsApp(session)} className="flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-green-600 text-white shadow-md hover:bg-green-700"><WhatsAppIcon /> Exportar via WhatsApp</button></div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <p className="text-center text-poker-gray py-8">Nenhum jogo encontrado para os filtros selecionados.</p>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;