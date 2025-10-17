import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Session, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';
import BarChartIcon from './icons/BarChartIcon';
import SessionGraphModal from './SessionGraphModal';
import EditIcon from './icons/EditIcon';

interface SessionDetailModalProps {
  isUserAdmin: boolean;
  session: Session;
  allPlayers: Player[];
  onClose: () => void;
  onSave: (session: Session) => void;
  onViewProfile: (playerId: string) => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isUserAdmin,
  session,
  allPlayers,
  onClose,
  onSave,
  onViewProfile,
}) => {
  const [editedSession, setEditedSession] = useState<Session>(session);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedSession(session);
    setIsEditing(false); // Reset edit mode when session changes
  }, [session]);

  const handleGameNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setEditedSession(prev => ({ ...prev, name: value }));
  };

  const handleChipChange = (playerId: string, chips: number) => {
    const updatedPlayers = editedSession.players.map(p =>
      p.id === playerId ? { ...p, finalChips: chips } : p
    );
    setEditedSession({ ...editedSession, players: updatedPlayers });
  };
  
  const handlePaidChange = (playerId: string, paid: boolean) => {
    const updatedPlayers = editedSession.players.map(p =>
      p.id === playerId ? { ...p, paid } : p
    );
    setEditedSession({ ...editedSession, players: updatedPlayers });
  };

  const handleSave = () => {
    if (!/^\d{2}\/\d{2}\/\d{2}$/.test(editedSession.name.trim())) {
        alert("A data do jogo deve estar no formato DD/MM/AA.");
        return;
    }
    onSave(editedSession);
    setIsEditing(false);
  };

  const handleCancel = () => {
      setEditedSession(session);
      setIsEditing(false);
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();
  
  const totalPot = useMemo(() => editedSession.players.reduce((sum, p) => sum + p.totalInvested, 0), [editedSession]);
  const totalChips = useMemo(() => editedSession.players.reduce((sum, p) => sum + p.finalChips, 0), [editedSession]);
  const chipsMatch = totalPot === totalChips;
  const difference = totalChips - totalPot;

  const getPlayerName = useCallback((playerId: string) => {
      return allPlayers.find(p => p.id === playerId)?.name || 'Jogador Desconhecido';
  }, [allPlayers]);
  
  const parseDateToFullString = (name: string): string => {
    const parts = name.split('/');
    if (parts.length !== 3 || name.length !== 8) return "Data inválida";
    const year = 2000 + parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[0], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return "Data inválida";
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <header className="p-4 border-b border-poker-dark flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white">Detalhes do Jogo</h3>
                {isEditing ? (
                    <div>
                        <input
                            type="text"
                            value={editedSession.name}
                            onChange={handleGameNameChange}
                            placeholder="DD/MM/AA"
                            className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-1 w-28"
                        />
                        <p className="text-xs text-poker-gray mt-1 h-4">{parseDateToFullString(editedSession.name)}</p>
                    </div>
                ) : (
                    <p className="text-sm text-poker-gray">{parseDateToFullString(session.name)}</p>
                )}
            </div>
            <div className="flex items-center space-x-2">
                {isUserAdmin && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                        <span className="h-4 w-4 mr-2"><EditIcon /></span>Editar
                    </button>
                )}
                <button onClick={() => setIsGraphModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                    <span className="h-5 w-5 mr-2"><BarChartIcon/></span>Gráfico
                </button>
                <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
            </div>
          </header>

          <div className="p-4 flex-grow overflow-y-auto">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-poker-dark">
                    <thead className="bg-poker-dark">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Investido</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Fichas Finais</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Resultado</th>
                            {isUserAdmin && <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Pago</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-poker-light divide-y divide-poker-dark">
                        {editedSession.players.map(player => {
                            const profit = player.finalChips - player.totalInvested;
                            return (
                                <tr key={player.id} className="hover:bg-poker-dark/50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <PlayerAvatar name={getPlayerName(player.id)} size="sm" />
                                            <button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{getPlayerName(player.id)}</button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-poker-gold">R$ {player.totalInvested.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={player.finalChips}
                                            disabled={!isEditing}
                                            onChange={(e) => handleChipChange(player.id, parseInt(e.target.value, 10) || 0)}
                                            onFocus={handleFocus}
                                            className="w-24 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 disabled:bg-poker-dark/50 disabled:cursor-not-allowed"
                                        />
                                    </td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {profit.toLocaleString('pt-BR')}</td>
                                    {isUserAdmin && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <input type="checkbox" checked={player.paid} disabled={!isEditing} onChange={(e) => handlePaidChange(player.id, e.target.checked)} className="w-5 h-5 text-poker-green bg-gray-700 border-gray-600 rounded disabled:cursor-not-allowed" />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-poker-dark p-3 rounded-lg"><h4 className="text-xs text-poker-gray uppercase">Montante</h4><p className="font-bold text-poker-gold text-xl">R$ {totalPot.toLocaleString('pt-BR')}</p></div>
                <div className={`bg-poker-dark p-3 rounded-lg border ${chipsMatch ? 'border-transparent' : 'border-red-500'}`}><h4 className="text-xs text-poker-gray uppercase">Fichas Dist.</h4><p className={`font-bold text-xl ${chipsMatch ? 'text-white' : 'text-red-500'}`}>{totalChips.toLocaleString('pt-BR')}</p></div>
                <div className="bg-poker-dark p-3 rounded-lg"><h4 className="text-xs text-poker-gray uppercase">Jogadores</h4><p className="font-bold text-white text-xl">{editedSession.players.length}</p></div>
            </div>
          </div>
          
          {isUserAdmin && isEditing && (
            <footer className="p-3 border-t border-poker-dark flex justify-between items-center">
              <div>
                {!chipsMatch && (
                  <p className="text-xs text-yellow-400">
                    A soma das fichas não bate com o montante. (Diferença: R$ {difference.toLocaleString('pt-BR')})
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={handleCancel} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={!chipsMatch} className="px-5 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm disabled:bg-poker-gray/50 disabled:cursor-not-allowed">Salvar Alterações</button>
              </div>
            </footer>
          )}
        </div>
      </div>
      {isGraphModalOpen && (
          <SessionGraphModal session={editedSession} onClose={() => setIsGraphModalOpen(false)} />
      )}
    </>
  );
};

export default SessionDetailModal;