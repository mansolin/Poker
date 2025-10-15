import React, { useState, useEffect, useMemo } from 'react';
import type { Player } from '../types';
import WhatsAppIcon from './icons/WhatsAppIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface PlayersProps {
  isLoggedIn: boolean;
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'isActive'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onStartGame: (playerIds: string[]) => void;
  onTogglePlayerStatus: (playerId: string) => void;
}

const StatusToggle: React.FC<{ isActive: boolean; onToggle: () => void; disabled: boolean }> = ({ isActive, onToggle, disabled }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 rounded-full w-20 transition-colors duration-300 focus:outline-none ${isActive ? 'bg-poker-green' : 'bg-poker-gray'} ${disabled ? 'cursor-not-allowed' : ''}`}
      title={isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
    >
      <span className={`absolute left-0 w-1/2 h-full rounded-full bg-white transition-transform duration-300 ${isActive ? 'transform translate-x-full' : ''}`}></span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-gray-800">{isActive ? '' : 'Inativo'}</span>
      <span className="relative z-10 w-1/2 text-xs font-bold text-white">{isActive ? 'Ativo' : ''}</span>
    </button>
  );
};

const Players: React.FC<PlayersProps> = ({ isLoggedIn, players, onAddPlayer, onUpdatePlayer, onDeletePlayer, onStartGame, onTogglePlayerStatus }) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setWhatsapp(editingPlayer.whatsapp);
      setPixKey(editingPlayer.pixKey);
    } else {
      resetForm();
    }
  }, [editingPlayer]);

  const capitalizeName = (nameStr: string): string => {
    return nameStr
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(capitalizeName(e.target.value));
  };
  
  const resetForm = () => {
    setName('');
    setWhatsapp('');
    setPixKey('');
    setEditingPlayer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (editingPlayer) {
        onUpdatePlayer({ ...editingPlayer, name, whatsapp, pixKey });
      } else {
        onAddPlayer({ name, whatsapp, pixKey });
      }
      resetForm();
    }
  };
  
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(playerId)) {
        newSelection.delete(playerId);
      } else {
        newSelection.add(playerId);
      }
      return newSelection;
    });
  };
  
  const handleDelete = (playerId: string) => {
    onDeletePlayer(playerId);
  };

  const handleStartGameClick = () => {
    if (selectedPlayers.size > 1) {
      onStartGame(Array.from(selectedPlayers));
      setSelectedPlayers(new Set());
    } else {
      alert("Selecione pelo menos 2 jogadores para iniciar um jogo.");
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
    <div className={`grid grid-cols-1 ${isLoggedIn ? 'lg:grid-cols-3' : ''} gap-8`}>
      {isLoggedIn && (
        <div className="lg:col-span-1">
          <div className="bg-poker-light p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPlayer ? 'Editar Jogador' : 'Cadastrar Jogador'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-3">
                <label htmlFor="name" className="text-sm font-medium text-poker-gray text-right col-span-1">Nome</label>
                <input type="text" id="name" value={name} onChange={handleNameChange} className="col-span-3 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5" placeholder="Nome do Jogador" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                 <label htmlFor="whatsapp" className="flex justify-end col-span-1" aria-label="WhatsApp">
                  <WhatsAppIcon />
                </label>
                <input type="text" id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="col-span-3 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5" placeholder="(99) 99999-9999" />
              </div>
               <div className="grid grid-cols-4 items-center gap-3">
                <label htmlFor="pix" className="text-sm font-medium text-poker-gray text-right col-span-1">Pix</label>
                <input type="text" id="pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="col-span-3 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5" placeholder="Chave PIX" />
              </div>
              <div className="flex items-center space-x-2 !mt-6">
                  <button type="submit" className="w-full text-white bg-poker-green hover:bg-poker-green/80 focus:ring-4 focus:outline-none focus:ring-poker-green/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300">
                      {editingPlayer ? 'Salvar Alterações' : 'Adicionar Jogador'}
                  </button>
                  {editingPlayer && (
                      <button type="button" onClick={resetForm} className="w-full text-poker-gray bg-poker-dark hover:bg-poker-dark/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300">
                          Cancelar
                      </button>
                  )}
              </div>
            </form>
          </div>
        </div>
      )}
      <div className={isLoggedIn ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="bg-poker-light p-6 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Jogadores Cadastrados</h2>
            {isLoggedIn && (
                <button
                onClick={handleStartGameClick}
                disabled={selectedPlayers.size < 2}
                className="px-6 py-2 text-white bg-poker-gold hover:bg-poker-gold/80 disabled:bg-poker-gray/50 disabled:cursor-not-allowed font-medium rounded-lg text-sm transition-all duration-300"
                >
                Iniciar Jogo
                </button>
            )}
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {players.length > 0 ? (
              sortedPlayers.map(player => (
                <div key={player.id} className={`flex items-center justify-between bg-poker-dark p-4 rounded-lg transition-opacity duration-300 ${!player.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-center flex-grow">
                    {isLoggedIn && (
                        <input
                        id={`checkbox-${player.id}`}
                        type="checkbox"
                        checked={selectedPlayers.has(player.id)}
                        onChange={() => handlePlayerSelection(player.id)}
                        disabled={!player.isActive}
                        className="w-5 h-5 text-poker-green bg-gray-700 border-gray-600 rounded focus:ring-poker-green focus:ring-2 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    )}
                    <label htmlFor={`checkbox-${player.id}`} className={`${isLoggedIn ? 'ml-4' : 'ml-0'} flex items-center space-x-3 text-sm flex-wrap flex-grow`}>
                      <span className="text-base font-semibold text-white">{player.name}</span>
                      {player.whatsapp && (
                        <>
                          <span className="text-poker-gray/50">|</span>
                          <span className="text-poker-gray">{player.whatsapp}</span>
                        </>
                      )}
                      {player.pixKey && (
                        <>
                          <span className="text-poker-gray/50">|</span>
                          <span className="text-poker-gray"><span className="font-semibold text-poker-gray/80">PIX:</span> {player.pixKey}</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                      <StatusToggle isActive={player.isActive} onToggle={() => onTogglePlayerStatus(player.id)} disabled={!isLoggedIn} />
                      {isLoggedIn && (
                        <>
                            <button onClick={() => setEditingPlayer(player)} className="p-2 text-poker-gray hover:text-poker-gold transition-colors duration-200">
                                <EditIcon />
                            </button>
                            <button onClick={() => handleDelete(player.id)} className="p-2 text-poker-gray hover:text-red-500 transition-colors duration-200">
                                <TrashIcon />
                            </button>
                        </>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-poker-gray py-8">Nenhum jogador cadastrado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;