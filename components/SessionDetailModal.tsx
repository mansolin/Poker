import React, { useState, useEffect, useMemo } from 'react';
import type { Session, Player, GamePlayer } from '../types';
import PlayerAvatar from './PlayerAvatar';
import BarChartIcon from './icons/BarChartIcon';
import SessionGraphModal from './SessionGraphModal';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import SpinnerIcon from './icons/SpinnerIcon';


interface SessionDetailModalProps {
  isUserAdmin: boolean;
  session: Session;
  allPlayers: Player[];
  onClose: () => void;
  onSave: (session: Session) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onViewProfile: (playerId: string) => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isUserAdmin,
  session,
  allPlayers,
  onClose,
  onSave,
  onDelete,
  onViewProfile,
}) => {
  const [editedSession, setEditedSession] = useState<Session>(session);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  
  useEffect(() => {
    setEditedSession(session);
  }, [session]);

  const { totalCash, distributedChips, chipsMatch, difference } = useMemo(() => {
    const totalCash = editedSession.players.reduce((sum, p) => sum + p.totalInvested, 0);
    const distributedChips = editedSession.players.reduce((sum, p) => sum + p.finalChips, 0);
    const chipsMatch = totalCash === distributedChips;
    const difference = distributedChips - totalCash;
    return { totalCash, distributedChips, chipsMatch, difference };
  }, [editedSession.players]);

  const handlePlayerChange = (playerId: string, field: keyof GamePlayer, value: any) => {
    const updatedPlayers = editedSession.players.map(p => {
      if (p.id === playerId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setEditedSession(prev => ({ ...prev, players: updatedPlayers }));
  };

  const handleCancelEdit = () => {
    setEditedSession(session);
    setIsEditing(false);
  };
  
  const handleSave = () => {
    if (isUserAdmin && editedSession.name.trim() === '') {
        alert("O nome do jogo não pode estar vazio.");
        return;
    }
    if (isUserAdmin && !chipsMatch) {
      alert('O total de fichas distribuídas deve ser igual ao montante total investido.');
      return;
    }
    onSave(editedSession);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationInput !== session.name) return;
    
    setIsDeleting(true);
    try {
        await onDelete(session.id);
        // Success: close all modals
        setDeleteConfirmationInput('');
        setIsDeleteConfirmOpen(false);
        onClose();
    } catch (error) {
        // Error is handled by App.tsx, which shows a toast.
        // We keep the modal open for the user to see the context.
        console.error("Deletion failed, modal will stay open.", error);
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleGameNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSession(prev => ({ ...prev, name: e.target.value }));
  };
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();
  
  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-poker-dark flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Detalhes do Jogo:</h3>
                 {isEditing && isUserAdmin ? (
                    <input type="text" value={editedSession.name} autoFocus onFocus={handleFocus} onChange={handleGameNameChange} placeholder="Nome do Jogo" className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg p-2" />
                 ) : (
                    <span className="text-xl font-bold text-poker-gold">{editedSession.name}</span>
                 )}
            </div>
            <div className="flex items-center gap-2">
                {isUserAdmin && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                        <span className="h-5 w-5 mr-2"><EditIcon /></span>Editar
                    </button>
                )}
                <button onClick={() => setIsGraphModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                    <span className="h-5 w-5 mr-2"><BarChartIcon/></span>Gráfico
                </button>
                {isUserAdmin && (
                    <button 
                        onClick={handleDeleteClick}
                        disabled={isDeleting || isEditing}
                        className="flex items-center justify-center w-28 h-[38px] text-sm font-semibold rounded-md bg-red-800/50 text-red-400 hover:bg-red-800 hover:text-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir Jogo do Histórico"
                    >
                        <span className="h-5 w-5 mr-2"><TrashIcon /></span>
                        <span>Excluir</span>
                    </button>
                )}
                <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
            </div>
        </header>
        <main className="p-4 flex-grow overflow-y-auto">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-poker-dark">
                    <thead className="bg-poker-dark">
                        <tr>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">
                                <span className="sm:hidden">Invest.</span>
                                <span className="hidden sm:inline">Investido (R$)</span>
                            </th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Fichas Finais</th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">
                                <span className="sm:hidden">Resul.</span>
                                <span className="hidden sm:inline">Resultado (R$)</span>
                            </th>
                            <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Pago</th>
                        </tr>
                    </thead>
                    <tbody className="bg-poker-light divide-y divide-poker-dark">
                        {editedSession.players.map(player => {
                            const profit = player.finalChips - player.totalInvested;
                            return (
                            <tr key={player.id} className="hover:bg-poker-dark/50">
                                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <PlayerAvatar name={player.name} size="sm" />
                                        <button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold truncate" title={player.name}>
                                            <span className="sm:hidden">{player.name.split(' ')[0]}</span>
                                            <span className="hidden sm:inline">{player.name}</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm font-bold text-poker-gold">R$ {player.totalInvested.toLocaleString('pt-BR')}</td>
                                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={player.finalChips} 
                                        disabled={!isEditing}
                                        onChange={(e) => handlePlayerChange(player.id, 'finalChips', Math.max(0, parseInt(e.target.value, 10) || 0))} 
                                        onFocus={handleFocus}
                                        className="w-20 sm:w-24 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 disabled:bg-poker-dark/50 disabled:cursor-not-allowed" 
                                    />
                                </td>
                                <td className={`px-2 sm:px-4 py-3 whitespace-nowrap text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    R$ {profit.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center">
                                    <input 
                                        type="checkbox"
                                        checked={!!player.paid}
                                        disabled={!isEditing}
                                        onChange={(e) => handlePlayerChange(player.id, 'paid', e.target.checked)}
                                        className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                    />
                                </td>
                            </tr>);
                        })}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-poker-dark p-3 rounded-lg text-center"><h3 className="text-sm font-semibold text-poker-gray uppercase">Montante (R$)</h3><p className="text-2xl font-bold text-poker-gold">R$ {totalCash.toLocaleString('pt-BR')}</p></div>
                <div className={`bg-poker-dark p-3 rounded-lg text-center border-2 ${chipsMatch ? 'border-transparent' : 'border-red-500'}`}>
                    <h3 className="text-sm font-semibold text-poker-gray uppercase">Fichas Distribuídas</h3><p className={`text-2xl font-bold ${chipsMatch ? 'text-white' : 'text-red-500'}`}>{distributedChips.toLocaleString('pt-BR')}</p>
                    {!chipsMatch && (<div className="mt-1"><p className="text-xs text-red-400">Diferença: {difference > 0 ? '+' : ''}{difference.toLocaleString('pt-BR')}</p></div>)}
                </div>
                <div className="bg-poker-dark p-3 rounded-lg text-center"><h3 className="text-sm font-semibold text-poker-gray uppercase">Data do Jogo</h3><p className="text-2xl font-bold text-white">{editedSession.date.toDate().toLocaleDateString('pt-BR')}</p></div>
            </div>
        </main>
        {isEditing && isUserAdmin && (
            <footer className="p-4 border-t border-poker-dark flex justify-between items-center flex-shrink-0">
                <div className="text-left">
                    {!chipsMatch && <p className="text-sm text-yellow-400">Ajuste as fichas para poder salvar.</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCancelEdit} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                    <button onClick={handleSave} disabled={!chipsMatch} className="px-4 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm disabled:bg-poker-gray/50">Salvar Alterações</button>
                </div>
            </footer>
        )}
      </div>
    </div>
    {isGraphModalOpen && (
        <SessionGraphModal session={editedSession} onClose={() => setIsGraphModalOpen(false)} />
    )}
    {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4">
                    <h4 className="text-lg font-bold text-white">Confirmar Exclusão</h4>
                    <p className="text-sm text-poker-gray my-2">Esta ação não pode ser desfeita. Para confirmar, digite o nome do jogo: <strong className="text-white">{session.name}</strong></p>
                    <input
                        type="text"
                        value={deleteConfirmationInput}
                        onChange={e => setDeleteConfirmationInput(e.target.value)}
                        className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5"
                    />
                </div>
                <div className="p-4 border-t border-poker-dark flex justify-end gap-2">
                    <button onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleteConfirmationInput !== session.name || isDeleting}
                        className="w-32 h-10 flex justify-center items-center text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm disabled:bg-poker-gray/50"
                    >
                        {isDeleting ? <SpinnerIcon /> : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default SessionDetailModal;
