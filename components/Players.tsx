import React, { useState, useMemo } from 'react';
import type { Player } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import PlayerAvatar from './PlayerAvatar';
import SpinnerIcon from './icons/SpinnerIcon';

interface PlayerFormModalProps {
    player: Player | null;
    onSave: (playerData: Omit<Player, 'id' | 'isActive'>) => void;
    onClose: () => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onSave, onClose }) => {
    const [name, setName] = useState(player?.name || '');
    const [whatsapp, setWhatsapp] = useState(player?.whatsapp || '');
    const [pixKey, setPixKey] = useState(player?.pixKey || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        setWhatsapp(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave({ name, whatsapp, pixKey });
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{player ? 'Editar Jogador' : 'Adicionar Jogador'}</h3>
                    <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl">&times;</button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-poker-gray mb-1 block">Nome Completo</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
                        </div>
                         <div>
                            <label htmlFor="whatsapp" className="text-sm font-medium text-poker-gray mb-1 block">WhatsApp</label>
                            <input id="whatsapp" type="tel" value={whatsapp} onChange={handleWhatsappChange} placeholder="(99) 99999-9999" className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" />
                        </div>
                         <div>
                            <label htmlFor="pixKey" className="text-sm font-medium text-poker-gray mb-1 block">Chave PIX</label>
                            <input id="pixKey" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" />
                        </div>
                    </div>
                    <footer className="p-4 border-t border-poker-dark flex justify-end items-center space-x-2">
                       <button type="button" onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                       <button type="submit" disabled={isLoading} className="w-28 h-10 flex justify-center items-center text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm">
                           {isLoading ? <SpinnerIcon /> : 'Salvar'}
                       </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};


interface PlayersProps {
    isUserAdmin: boolean;
    players: Player[];
    onAddPlayer: (playerData: Omit<Player, 'id' | 'isActive'>) => Promise<void>;
    onUpdatePlayer: (player: Player) => Promise<void>;
    onDeletePlayer: (playerId: string) => Promise<void>;
    onStartGame: (playerIds: string[]) => Promise<void>;
    onTogglePlayerStatus: (playerId: string) => Promise<void>;
    onViewProfile: (playerId: string) => void;
}

const Players: React.FC<PlayersProps> = ({
    isUserAdmin,
    players,
    onAddPlayer,
    onUpdatePlayer,
    onDeletePlayer,
    onStartGame,
    onTogglePlayerStatus,
    onViewProfile,
}) => {
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    const { activePlayers, inactivePlayers } = useMemo(() => {
        const active: Player[] = [];
        const inactive: Player[] = [];
        players.forEach(p => (p.isActive ? active.push(p) : inactive.push(p)));
        return { activePlayers: active, inactivePlayers: inactive };
    }, [players]);

    const handleToggleSelectPlayer = (playerId: string) => {
        setSelectedPlayers(prev => 
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const handleStartGameClick = () => {
        if (selectedPlayers.length < 2) {
            alert('Selecione pelo menos 2 jogadores para iniciar um jogo.');
        } else {
            onStartGame(selectedPlayers);
            setSelectedPlayers([]);
        }
    };

    const handleOpenAddModal = () => {
        setEditingPlayer(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (player: Player) => {
        setEditingPlayer(player);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlayer(null);
    };

    const handleSavePlayer = async (playerData: Omit<Player, 'id' | 'isActive'>) => {
        if (editingPlayer) {
            await onUpdatePlayer({ ...playerData, id: editingPlayer.id, isActive: editingPlayer.isActive });
        } else {
            await onAddPlayer(playerData);
        }
        handleCloseModal();
    };

    return (
        <>
            <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Jogadores</h2>
                    {isUserAdmin && (
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <button onClick={handleOpenAddModal} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                                <span className="mr-2 h-5 w-5"><PlusIcon /></span>Novo Jogador
                            </button>
                            <button onClick={handleStartGameClick} disabled={selectedPlayers.length < 2} className="w-full sm:w-auto px-4 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm shadow-lg disabled:bg-poker-gray/50 disabled:cursor-not-allowed">
                                Iniciar Jogo ({selectedPlayers.length})
                            </button>
                        </div>
                    )}
                </header>
                
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                    {/* Active Players */}
                    <div>
                        <h3 className="text-base font-semibold text-poker-gray uppercase tracking-wider mb-2 border-b border-poker-dark pb-1">Ativos ({activePlayers.length})</h3>
                        <div className="space-y-2">
                            {activePlayers.map(player => (
                                <div key={player.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-2 rounded-lg transition-colors ${selectedPlayers.includes(player.id) ? 'bg-poker-green/20' : 'bg-poker-dark'}`}>
                                    {isUserAdmin && <input type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={() => handleToggleSelectPlayer(player.id)} className="w-5 h-5 mr-4 rounded bg-poker-light border-poker-gray text-poker-green focus:ring-poker-green flex-shrink-0" />}
                                    <PlayerAvatar name={player.name} />
                                    <div className="flex-grow ml-3 my-2 sm:my-0">
                                        <button onClick={() => onViewProfile(player.id)} className="font-semibold text-white hover:text-poker-gold text-left">{player.name}</button>
                                        {player.whatsapp && <a href={`https://wa.me/${player.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-poker-gray hover:text-green-400 mt-1"><WhatsAppIcon /> <span className="ml-1.5">{player.whatsapp}</span></a>}
                                    </div>
                                    {isUserAdmin && (
                                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 self-end sm:self-center">
                                            <button onClick={() => onTogglePlayerStatus(player.id)} className="px-3 py-1 text-xs text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 rounded-md">Inativar</button>
                                            <button onClick={() => handleOpenEditModal(player)} className="p-2 text-poker-gray hover:text-poker-gold"><EditIcon /></button>
                                            <button onClick={() => onDeletePlayer(player.id)} className="p-2 text-poker-gray hover:text-red-500"><TrashIcon /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inactive Players */}
                    {isUserAdmin && inactivePlayers.length > 0 && (
                        <div>
                            <h3 className="text-base font-semibold text-poker-gray uppercase tracking-wider mb-2 border-b border-poker-dark pb-1 mt-6">Inativos ({inactivePlayers.length})</h3>
                            <div className="space-y-2">
                                {inactivePlayers.map(player => (
                                    <div key={player.id} className="flex items-center p-2 rounded-lg bg-poker-dark/50 opacity-60">
                                        <PlayerAvatar name={player.name} />
                                        <div className="flex-grow ml-3">
                                            <p className="font-semibold text-white">{player.name}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            <button onClick={() => onTogglePlayerStatus(player.id)} className="px-3 py-1 text-xs text-green-400 bg-green-400/10 hover:bg-green-400/20 rounded-md">Ativar</button>
                                            <button onClick={() => handleOpenEditModal(player)} className="p-2 text-poker-gray hover:text-poker-gold"><EditIcon /></button>
                                            <button onClick={() => onDeletePlayer(player.id)} className="p-2 text-poker-gray hover:text-red-500"><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && isUserAdmin && (
                <PlayerFormModal 
                    player={editingPlayer}
                    onSave={handleSavePlayer}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default Players;
