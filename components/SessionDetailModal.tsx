import React, { useMemo } from 'react';
import type { Session } from '../types';
import PlayerAvatar from './PlayerAvatar';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface SessionDetailModalProps {
  isUserAdmin: boolean;
  session: Session;
  onClose: () => void;
  onEditGame: (sessionId: string) => void;
  onDeleteGame: (sessionId: string) => void;
  onTogglePayment: (sessionId: string, playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isUserAdmin,
  session,
  onClose,
  onEditGame,
  onDeleteGame,
  onTogglePayment,
  onViewProfile,
}) => {
    const sortedPlayers = useMemo(() => {
        return [...session.players]
            .map(p => ({ ...p, profit: p.finalChips - p.totalInvested }))
            .sort((a, b) => b.profit - a.profit);
    }, [session.players]);

    const totalPot = useMemo(() => {
        return session.players.reduce((sum, p) => sum + p.totalInvested, 0);
    }, [session.players]);

    const handleViewProfileClick = (playerId: string) => {
        onViewProfile(playerId);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Detalhes do Jogo</h2>
                        <p className="text-sm text-poker-gold">{session.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isUserAdmin && (
                            <>
                                <button onClick={() => onEditGame(session.id)} className="p-2 text-poker-gray hover:text-poker-gold" title="Editar Jogo"><EditIcon /></button>
                                <button onClick={() => onDeleteGame(session.id)} className="p-2 text-poker-gray hover:text-red-500" title="Excluir Jogo"><TrashIcon /></button>
                            </>
                        )}
                        <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-grow overflow-y-auto">
                    <div className="bg-poker-dark p-4 rounded-lg text-center mb-4">
                        <h3 className="text-sm font-semibold text-poker-gray uppercase">Montante Total</h3>
                        <p className="text-2xl font-bold text-poker-gold">R$ {totalPot.toLocaleString('pt-BR')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-poker-dark">
                            <thead className="bg-poker-dark/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Investido</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Fichas Finais</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Resultado</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Pagamento</th>
                                </tr>
                            </thead>
                            <tbody className="bg-poker-light divide-y divide-poker-dark">
                                {sortedPlayers.map(player => (
                                    <tr key={player.id}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <PlayerAvatar name={player.name} size="sm" />
                                                <button onClick={() => handleViewProfileClick(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{player.name}</button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-poker-gray">R$ {player.totalInvested.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-poker-gray">{player.finalChips.toLocaleString('pt-BR')}</td>
                                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {player.profit.toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {player.profit < 0 ? (
                                                <button
                                                    onClick={() => onTogglePayment(session.id, player.id)}
                                                    disabled={!isUserAdmin}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${player.paid ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} ${!isUserAdmin ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
                                                >
                                                    {player.paid ? 'Pago' : 'Pendente'}
                                                </button>
                                            ) : (
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-poker-gray/50 text-white">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-poker-dark text-right">
                    <button onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailModal;
