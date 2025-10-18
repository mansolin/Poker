import React, { useMemo, useState, useEffect } from 'react';
import type { GamePlayer, Player, GameDefaults } from '../types';
import EditIcon from './icons/EditIcon';
import PlusIcon from './icons/PlusIcon';
import PlayerAvatar from './PlayerAvatar';
import BlindsTimer from './BlindsTimer';
import ClockIcon from './icons/ClockIcon';

interface LiveGameProps {
  isUserAdmin: boolean;
  players: GamePlayer[];
  allPlayers: Player[];
  gameName: string | null;
  onAddRebuy: (playerId: string) => void;
  onRemoveRebuy: (playerId: string) => void;
  onUpdateFinalChips: (playerId: string, chips: number) => void;
  onUpdateGameName: (name: string) => void;
  onEndGame: () => void;
  onCancelGame: () => void;
  onGoToPlayers: () => void;
  onAddPlayerToGame: (playerId: string) => void;
  onViewProfile: (playerId: string) => void;
  gameDefaults: GameDefaults;
}

const LiveGame: React.FC<LiveGameProps> = ({ isUserAdmin, players, allPlayers, gameName, onAddRebuy, onRemoveRebuy, onUpdateFinalChips, onUpdateGameName, onEndGame, onCancelGame, onGoToPlayers, onAddPlayerToGame, onViewProfile, gameDefaults }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(gameName || '');
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isTimerVisible, setIsTimerVisible] = useState(false);

  useEffect(() => { if (gameName) setEditedName(gameName); }, [gameName]);

  const totalCash = useMemo(() => players.reduce((sum, player) => sum + player.totalInvested, 0), [players]);
  const distributedChips = useMemo(() => players.reduce((sum, player) => sum + player.finalChips, 0), [players]);
  const availablePlayersToAdd = useMemo(() => {
    const currentGamePlayerIds = new Set(players.map(p => p.id));
    return allPlayers.filter(p => p.isActive && !currentGamePlayerIds.has(p.id));
  }, [players, allPlayers]);

  const chipsMatch = totalCash === distributedChips;
  const difference = distributedChips - totalCash;

  const handleSaveName = () => {
    if (!/^\d{2}\/\d{2}\/\d{2}$/.test(editedName.trim())) {
        alert("O nome do jogo deve estar no formato DD/MM/AA.");
        return;
    }
    onUpdateGameName(editedName.trim());
    setIsEditingName(false);
  };

  const handleGameNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setEditedName(value);
  };
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  if (players.length === 0) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Nenhum Jogo Ativo</h2>
        <p className="text-poker-gray mb-6">Vá para 'Jogadores' para iniciar um novo jogo.</p>
        {isUserAdmin && <button onClick={onGoToPlayers} className="px-6 py-3 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm">Novo Jogo</button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-poker-light p-4 rounded-lg shadow-xl gap-4">
          {isEditingName && isUserAdmin ? (
            <div className="flex items-center gap-2 w-full">
                <input type="text" value={editedName} onChange={handleGameNameChange} placeholder="DD/MM/AA" className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg w-full p-2" autoFocus />
                <button onClick={handleSaveName} className="px-4 py-2 text-white bg-poker-green hover:bg-poker-green/80 rounded-lg text-sm font-semibold">Salvar</button>
                <button onClick={() => setIsEditingName(false)} className="px-4 py-2 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 rounded-lg text-sm">Cancelar</button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Jogo: <span className="text-poker-gold">{gameName}</span></h2>
                <div className="relative inline-block px-3 py-1 text-xs font-semibold leading-tight text-white rounded-full bg-poker-green overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-poker-green via-green-400 to-poker-green animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }}
                  ></div>
                  <span className="relative">Em Andamento</span>
                </div>
                {isUserAdmin && <button onClick={() => setIsEditingName(true)} className="text-poker-gray hover:text-poker-gold"><EditIcon /></button>}
            </div>
          )}
          {isUserAdmin && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button onClick={() => setIsTimerVisible(prev => !prev)} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-dark text-white shadow-md hover:bg-poker-dark/70">
                <span className="mr-2 h-5 w-5"><ClockIcon /></span>{isTimerVisible ? 'Ocultar Timer' : 'Mostrar Timer'}
              </button>
              <button onClick={() => setIsAddPlayerModalOpen(true)} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white shadow-md hover:bg-poker-green/80">
                <span className="mr-2 h-5 w-5"><PlusIcon /></span>Incluir Jogador
              </button>
            </div>
          )}
      </div>

      <div className="bg-poker-light rounded-lg shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-poker-dark">
            <thead className="bg-poker-dark"><tr><th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Nome</th><th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Rebuys (R${gameDefaults.rebuy})</th><th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Investido (R$)</th><th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Fichas Finais</th><th className="px-4 py-2 text-left text-xs font-medium text-poker-gray uppercase">Resultado (R$)</th></tr></thead>
            <tbody className="bg-poker-light divide-y divide-poker-dark">
                {players.map(player => {
                  const profit = player.finalChips - player.totalInvested;
                  return (
                    <tr key={player.id} className="hover:bg-poker-dark/50">
                        <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center space-x-3"><PlayerAvatar name={player.name} size="sm" /><button onClick={() => onViewProfile(player.id)} className="text-sm font-medium text-white hover:text-poker-gold">{player.name}</button></div></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-poker-gray"><div className="flex items-center space-x-2"><button onClick={() => onRemoveRebuy(player.id)} disabled={player.rebuys === 0 || !isUserAdmin} className="bg-red-600 hover:bg-red-700 text-white h-6 w-6 rounded-full flex items-center justify-center text-lg disabled:bg-poker-gray/50 disabled:cursor-not-allowed">-</button><span className="font-semibold text-white w-5 text-center">{player.rebuys}</span><button onClick={() => onAddRebuy(player.id)} disabled={!isUserAdmin} className="bg-poker-green hover:bg-poker-green/80 text-white h-6 w-6 rounded-full flex items-center justify-center text-lg disabled:bg-poker-gray/50 disabled:cursor-not-allowed">+</button></div></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-poker-gold">R$ {player.totalInvested.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><input type="number" min="0" value={player.finalChips} disabled={!isUserAdmin} onChange={(e) => onUpdateFinalChips(player.id, Math.max(0, parseInt(e.target.value, 10) || 0))} onFocus={handleFocus} className="w-24 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 disabled:bg-poker-dark/50 disabled:cursor-not-allowed" placeholder="0"/></td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {profit.toLocaleString('pt-BR')}</td>
                    </tr>);
                })}
            </tbody></table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl text-center"><h3 className="text-base md:text-lg font-semibold text-poker-gray uppercase">Montante (R$)</h3><p className="text-3xl md:text-4xl font-bold text-poker-gold">R$ {totalCash.toLocaleString('pt-BR')}</p></div>
          <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl text-center"><h3 className="text-base md:text-lg font-semibold text-poker-gray uppercase">Total em Fichas</h3><p className="text-3xl md:text-4xl font-bold text-white">{totalCash.toLocaleString('pt-BR')}</p></div>
          <div className={`bg-poker-light p-4 md:p-6 rounded-lg shadow-xl text-center border-2 ${chipsMatch ? 'border-transparent' : 'border-red-500'}`}>
              <h3 className="text-base md:text-lg font-semibold text-poker-gray uppercase">Fichas Distribuídas</h3><p className={`text-3xl md:text-4xl font-bold ${chipsMatch ? 'text-white' : 'text-red-500'}`}>{distributedChips.toLocaleString('pt-BR')}</p>
              {!chipsMatch && (<div className="mt-1"><p className="text-xs text-red-400">Diferença: {difference > 0 ? '+' : ''}{difference.toLocaleString('pt-BR')}</p></div>)}
          </div>
      </div>

      {isTimerVisible && isUserAdmin && (
        <div className="flex justify-center">
            <BlindsTimer />
        </div>
      )}

      {isUserAdmin && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left w-full sm:w-auto">{!chipsMatch && totalCash > 0 && <p className="text-sm text-yellow-400 animate-pulse">Ajuste as fichas para poder salvar.</p>}</div>
            <div className="flex items-center space-x-4 w-full sm:w-auto"><button onClick={onCancelGame} className="w-full sm:w-auto px-4 py-2 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 font-medium rounded-lg text-sm">Cancelar Jogo</button><button onClick={onEndGame} disabled={!chipsMatch || totalCash === 0} title={!chipsMatch ? "O total de fichas deve ser igual ao montante" : "Salvar no histórico"} className="w-full sm:w-auto px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm shadow-lg disabled:bg-poker-gray/50 disabled:cursor-not-allowed">Encerrar e Salvar</button></div>
        </div>
      )}
       {isAddPlayerModalOpen && isUserAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-poker-dark flex justify-between items-center"><h3 className="text-lg font-bold text-white">Incluir Jogador</h3><button onClick={() => setIsAddPlayerModalOpen(false)} className="text-poker-gray hover:text-white text-3xl">&times;</button></div>
            <div className="p-4 flex-grow overflow-y-auto">{availablePlayersToAdd.length > 0 ? (<div className="space-y-2">{availablePlayersToAdd.map(player => (<div key={player.id} className="flex justify-between items-center bg-poker-dark p-3 rounded-lg"><span className="text-white">{player.name}</span><button onClick={() => { onAddPlayerToGame(player.id); setIsAddPlayerModalOpen(false); }} className="px-3 py-1 text-sm text-white bg-poker-green hover:bg-poker-green/80 rounded-md">Adicionar</button></div>))}</div>) : (<p className="text-poker-gray text-center">Todos os jogadores ativos já estão na partida.</p>)}</div>
            <div className="p-3 border-t border-poker-dark text-right"><button onClick={() => setIsAddPlayerModalOpen(false)} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;