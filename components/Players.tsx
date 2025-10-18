import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Player } from '../types';
import WhatsAppIcon from './icons/WhatsAppIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlayerAvatar from './PlayerAvatar';
import PlusIcon from './icons/PlusIcon';

interface PlayersProps {
  isUserAdmin: boolean;
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'isActive'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onStartGame: (playerIds: string[]) => void;
  onTogglePlayerStatus: (playerId:string) => void;
  onViewProfile: (playerId: string) => void;
}

const StatusToggle: React.FC<{ isActive: boolean; onToggle: () => void; disabled: boolean }> = ({ isActive, onToggle, disabled }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex items-center h-5 rounded-full w-16 transition-colors duration-300 focus:outline-none ${isActive ? 'bg-poker-green' : 'bg-poker-gray'} ${disabled ? 'cursor-not-allowed' : ''}`}
      title={isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
    >
      <span className={`absolute left-0 w-1/2 h-full rounded-full bg-white transition-transform duration-300 ${isActive ? 'transform translate-x-full' : ''}`}></span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-gray-800">{isActive ? '' : 'Inativo'}</span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-white">{isActive ? 'Ativo' : ''}</span>
    </button>
  );
};
const MemoizedStatusToggle = React.memo(StatusToggle);

const PlayerFormModal: React.FC<{
    player: Player | null;
    onSave: (playerData: Omit<Player, 'id' | 'isActive'> | Player) => void;
    onClose: () => void;
    onDelete: (playerId: string) => void;
}> = ({ player, onSave, onClose, onDelete }) => {
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [pixKey, setPixKey] = useState('');
    
    const isEditing = !!player;

    useEffect(() => {
        setName(player?.name || '');
        setWhatsapp(player?.whatsapp || '');
        setPixKey(player?.pixKey || '');
    }, [player]);

    const capitalizeName = (nameStr: string): string => nameStr.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(capitalizeName(e.target.value));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            if (isEditing) {
                onSave({ ...player, name, whatsapp, pixKey });
            } else {
                onSave({ name, whatsapp, pixKey });
            }
        }
    };
    
    const handleDelete = () => {
        if (player) {
            onDelete(player.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{isEditing ? 'Editar Jogador' : 'Cadastrar Jogador'}</h3>
                    <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-poker-gray mb-1 block">Nome</label>
                            <input type="text" id="name" value={name} onChange={handleNameChange} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required autoFocus/>
                        </div>
                        <div>
                            <label htmlFor="whatsapp" className="flex items-center text-sm font-medium text-poker-gray mb-1"><WhatsAppIcon /> <span className="ml-2">WhatsApp</span></label>
                            <input type="text" id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" />
                        </div>
                        <div>
                            <label htmlFor="pix" className="text-sm font-medium text-poker-gray mb-1 block">Pix</label>
                            <input type="text" id="pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" />
                        </div>
                    </div>
                    <div className="p-4 border-t border-poker-dark flex justify-between items-center">
                        <div>
                            {isEditing && (
                                <button type="button" onClick={handleDelete} className="flex items-center px-3 py-2 text-sm font-medium text-red-500 bg-transparent hover:bg-red-500/10 rounded-lg">
                                    <TrashIcon />
                                    <span className="ml-2">Excluir</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                           <button type="button" onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                           <button type="submit" className="px-5 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm">{isEditing ? 'Salvar' : 'Adicionar'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PlayerListItem: React.FC<{
  player: Player;
  isSelected: boolean;
  isUserAdmin: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
  onViewProfile: (id: string) => void;
}> = ({ player, isSelected, isUserAdmin, onSelect, onToggle, onEdit, onDelete, onViewProfile }) => {
    const swipeableContentRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const lastTranslateX = useRef(0);
    const isDragging = useRef(false);
    const didSwipe = useRef(false);
    
    const SWIPE_THRESHOLD = 40; // Open if swiped more than 40px
    const DELETE_BUTTON_WIDTH = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isUserAdmin) return;
        touchStartX.current = e.touches[0].clientX;
        isDragging.current = true;
        didSwipe.current = false;
        if (swipeableContentRef.current) {
            swipeableContentRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || !isUserAdmin) return;
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX.current;
        
        // Register as a swipe if moved more than a few pixels
        if (Math.abs(deltaX) > 5) {
            didSwipe.current = true;
        }

        // Apply transform based on swipe from original position
        const newTranslateX = lastTranslateX.current + deltaX;
        
        // Clamp the swipe between 0 (closed) and DELETE_BUTTON_WIDTH (open)
        const clampedTranslateX = Math.max(0, Math.min(DELETE_BUTTON_WIDTH, newTranslateX));
        
        if (swipeableContentRef.current) {
            swipeableContentRef.current.style.transform = `translateX(${clampedTranslateX}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging.current || !isUserAdmin) return;
        isDragging.current = false;

        const finalTranslateX = swipeableContentRef.current ? 
            new DOMMatrix(getComputedStyle(swipeableContentRef.current).transform).m41 : 0;

        if (swipeableContentRef.current) {
            swipeableContentRef.current.style.transition = 'transform 0.2s ease-out';
            if (finalTranslateX > SWIPE_THRESHOLD) {
                swipeableContentRef.current.style.transform = `translateX(${DELETE_BUTTON_WIDTH}px)`;
                lastTranslateX.current = DELETE_BUTTON_WIDTH;
            } else {
                swipeableContentRef.current.style.transform = 'translateX(0px)';
                lastTranslateX.current = 0;
            }
        }
    };

    const handleDeleteClick = () => {
        onDelete(player.id);
    };

    const handleContentClick = () => {
        // If there was a swipe gesture, don't trigger the click action
        if (didSwipe.current) {
            return;
        }
        // If the item is swiped open, a tap should close it
        if (lastTranslateX.current !== 0) {
            if (swipeableContentRef.current) {
                swipeableContentRef.current.style.transform = 'translateX(0px)';
                lastTranslateX.current = 0;
            }
            return;
        }
        // Otherwise, it's a normal tap, so view the profile
        onViewProfile(player.id);
    };

    return (
        <div className="relative bg-poker-dark rounded-lg overflow-hidden">
            {isUserAdmin && (
                <div className="absolute top-0 left-0 h-full flex items-center z-0">
                    <button
                        onClick={handleDeleteClick}
                        className="bg-red-600 text-white h-full w-20 flex flex-col items-center justify-center transition-colors hover:bg-red-700"
                        aria-label={`Excluir ${player.name}`}
                    >
                        <TrashIcon />
                        <span className="text-xs mt-1">Excluir</span>
                    </button>
                </div>
            )}
            <div
                ref={swipeableContentRef}
                className="relative z-10 bg-poker-dark"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 ${!player.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center w-full sm:w-auto flex-grow mb-3 sm:mb-0" onClick={handleContentClick}>
                        {isUserAdmin && (
                            <input
                                id={`cb-${player.id}`}
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onSelect(player.id)}
                                onClick={(e) => e.stopPropagation()}
                                disabled={!player.isActive}
                                className="w-5 h-5 text-poker-green bg-gray-700 border-gray-600 rounded mr-3 sm:mr-0"
                            />
                        )}
                        <PlayerAvatar name={player.name} size="md" />
                        <div className="ml-3 flex flex-col min-w-0">
                            <span className="text-base font-semibold text-white text-left truncate">{player.name}</span>
                            <div className="flex items-center space-x-2 text-poker-gray text-xs truncate">
                                {player.whatsapp && <span>{player.whatsapp}</span>}
                                {player.whatsapp && player.pixKey && <span>|</span>}
                                {player.pixKey && <span>PIX: {player.pixKey}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 self-end sm:self-center">
                        <MemoizedStatusToggle isActive={player.isActive} onToggle={() => onToggle(player.id)} disabled={!isUserAdmin} />
                        {isUserAdmin && (
                            <button onClick={() => onEdit(player)} className="p-2 text-poker-gray hover:text-poker-gold">
                                <EditIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const Players: React.FC<PlayersProps> = ({ isUserAdmin, players, onAddPlayer, onUpdatePlayer, onDeletePlayer, onStartGame, onTogglePlayerStatus, onViewProfile }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (player: Player | null = null) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setEditingPlayer(null);
    setIsModalOpen(false);
  };

  const handleSavePlayer = (playerData: Omit<Player, 'id' | 'isActive'> | Player) => {
    if ('id' in playerData) {
      onUpdatePlayer(playerData as Player);
    } else {
      onAddPlayer(playerData as Omit<Player, 'id' | 'isActive'>);
    }
    handleCloseModal();
  };
  
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSelection = new Set(prev);
      newSelection.has(playerId) ? newSelection.delete(playerId) : newSelection.add(playerId);
      return newSelection;
    });
  };
  
  const handleStartGameClick = () => {
    if (selectedPlayers.size > 1) {
      onStartGame(Array.from(selectedPlayers));
      setSelectedPlayers(new Set());
    } else {
      alert("Selecione pelo menos 2 jogadores.");
    }
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [players]);

  return (
    <>
      <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-white">Jogadores Cadastrados</h2>
            {isUserAdmin && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button onClick={() => handleOpenModal()} className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white shadow-md hover:bg-poker-green/80">
                  <span className="h-5 w-5 mr-2"><PlusIcon/></span>Cadastrar Jogador
                </button>
                <button onClick={handleStartGameClick} disabled={selectedPlayers.size < 2} className="px-6 py-2 w-full text-white bg-poker-gold hover:bg-poker-gold/80 disabled:bg-poker-gray/50 font-medium rounded-lg text-sm">Iniciar Jogo</button>
              </div>
            )}
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {players.length > 0 ? (
            sortedPlayers.map(player => (
              <PlayerListItem
                key={player.id}
                player={player}
                isSelected={selectedPlayers.has(player.id)}
                isUserAdmin={isUserAdmin}
                onSelect={handlePlayerSelection}
                onToggle={onTogglePlayerStatus}
                onEdit={handleOpenModal}
                onDelete={onDeletePlayer}
                onViewProfile={onViewProfile}
              />
            ))
          ) : (
            <p className="text-center text-poker-gray py-8">Nenhum jogador cadastrado.</p>
          )}
        </div>
      </div>
      {isModalOpen && isUserAdmin && (
        <PlayerFormModal player={editingPlayer} onSave={handleSavePlayer} onClose={handleCloseModal} onDelete={onDeletePlayer} />
      )}
    </>
  );
};

export default Players;