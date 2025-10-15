import React, { useMemo, useState, useEffect } from 'react';
import type { GamePlayer, Player } from '../types';
import EditIcon from './icons/EditIcon';
import PlusIcon from './icons/PlusIcon';

interface LiveGameProps {
  isLoggedIn: boolean;
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
}

const LiveGame: React.FC<LiveGameProps> = ({ isLoggedIn, players, allPlayers, gameName, onAddRebuy, onRemoveRebuy, onUpdateFinalChips, onUpdateGameName, onEndGame, onCancelGame, onGoToPlayers, onAddPlayerToGame }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(gameName || '');
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  useEffect(() => {
    if (gameName) {
      setEditedName(gameName);
    }
  }, [gameName]);

  const totalCash = useMemo(() => {
    return players.reduce((sum, player) => sum + player.totalInvested, 0);
  }, [players]);

  const totalChips = totalCash;

  const distributedChips = useMemo(() => {
    return players.reduce((sum, player) => sum + player.finalChips, 0);
  }, [players]);

  const availablePlayersToAdd = useMemo(() => {
    const currentGamePlayerIds = new Set(players.map(p => p.id));
    return allPlayers.filter(p => p.isActive && !currentGamePlayerIds.has(p.id));
  }, [players, allPlayers]);

  const chipsMatch = totalChips === distributedChips;
  const difference = distributedChips - totalChips;

  const handleSaveName = () => {
    if (editedName.trim()) {
        onUpdateGameName(editedName.trim());
        setIsEditingName(false);
    }
  };
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  if (players.length === 0) {
    return (
      <div className="text-center p-10 bg-poker-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Nenhum Jogo Ativo</h2>
        <p className="text-poker-gray mb-6">Vá para a seção 'Jogadores' para selecionar jogadores e iniciar um novo jogo.</p>
        {isLoggedIn && (
          <button
            onClick={onGoToPlayers}
            className="px-6 py-3 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm transition-all duration-300 shadow-lg"
          >
            Novo Jogo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-poker-light p-4 rounded-lg shadow-xl">
          {isEditingName && isLoggedIn ? (
            <div className="flex items-center gap-2 w-full">
                <input 
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2"
                    autoFocus
                />
                <button onClick={handleSaveName} className="px-4 py-2 text-white bg-poker-green hover:bg-poker-green/80 rounded-lg text-sm font-semibold">Salvar</button>
                <button onClick={() => setIsEditingName(false)} className="px-4 py-2 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 rounded-lg text-sm">Cancelar</button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-white">Jogo: <span className="text-poker-gold">{gameName}</span></h2>
                {isLoggedIn && (
                    <button onClick={() => setIsEditingName(true)} className="text-poker-gray hover:text-poker-gold transition-colors duration-200">
                        <EditIcon />
                    </button>
                )}
            </div>
          )}
          {isLoggedIn && (
            <button
              onClick={() => setIsAddPlayerModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-poker-dark text-white shadow-md hover:bg-poker-dark/80 ml-4"
            >
              <span className="mr-2 h-5 w-5"><PlusIcon /></span>
              Incluir Jogador
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-poker-light p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-lg font-semibold text-poker-gray uppercase tracking-wider">Montante Total (R$)</h3>
          <p className="text-4xl font-bold text-poker-gold">R$ {totalCash.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-poker-light p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-lg font-semibold text-poker-gray uppercase tracking-wider">Total em Fichas</h3>
          <p className="text-4xl font-bold text-white">{totalChips.toLocaleString('pt-BR')}</p>
        </div>
         <div className={`bg-poker-light p-6 rounded-lg shadow-xl text-center border-2 ${chipsMatch ? 'border-transparent' : 'border-red-500'}`}>
          <h3 className="text-lg font-semibold text-poker-gray uppercase tracking-wider">Fichas Distribuídas</h3>
          <p className={`text-4xl font-bold ${chipsMatch ? 'text-white' : 'text-red-500'}`}>{distributedChips.toLocaleString('pt-BR')}</p>
          {!chipsMatch && (
            <div className="mt-1">
              <p className="text-xs text-red-400">O total deve ser {totalChips.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-red-400 font-bold">Diferença: {difference > 0 ? '+' : ''}{difference.toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-poker-light rounded-lg shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-poker-dark">
            <thead className="bg-poker-dark">
                <tr>
                <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Rebuys</th>
                <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Total Investido (R$)</th>
                <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Saldo Final (Fichas)</th>
                <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-poker-gray uppercase tracking-wider">Saldo Real (R$)</th>
                </tr>
            </thead>
            <tbody className="bg-poker-light divide-y divide-poker-dark">
                {players.map(player => {
                  const profit = player.finalChips - player.totalInvested;
                  const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400';
                  return (
                    <tr key={player.id} className="hover:bg-poker-dark/50 transition-colors duration-200">
                        <td className="px-6 py-3 whitespace-nowrap text-base font-medium text-white">{player.name}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-poker-gray">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => onRemoveRebuy(player.id)}
                              disabled={player.rebuys === 0 || !isLoggedIn}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold h-7 w-7 rounded-full flex items-center justify-center text-lg transition-all duration-200 disabled:bg-poker-gray/50 disabled:cursor-not-allowed"
                              aria-label="Remover rebuy"
                            >
                              -
                            </button>
                            <span className="font-semibold text-white w-5 text-center">{player.rebuys}</span>
                            <button
                              onClick={() => onAddRebuy(player.id)}
                              disabled={!isLoggedIn}
                              className="bg-poker-green hover:bg-poker-green/80 text-white font-bold h-7 w-7 rounded-full flex items-center justify-center text-lg transition-all duration-200 disabled:bg-poker-gray/50 disabled:cursor-not-allowed"
                              aria-label="Adicionar rebuy"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-base font-bold text-poker-gold">R$ {player.totalInvested.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                        <input
                            type="number"
                            min="0"
                            value={player.finalChips}
                            disabled={!isLoggedIn}
                            onChange={(e) => onUpdateFinalChips(player.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                            onFocus={handleFocus}
                            className="w-28 bg-poker-dark border border-poker-gray/20 text-white text-base rounded-lg focus:ring-poker-gold focus:border-poker-gold block p-2.5 disabled:bg-poker-dark/50 disabled:cursor-not-allowed"
                            placeholder="0"
                        />
                        </td>
                        <td className={`px-6 py-3 whitespace-nowrap text-base font-bold ${profitColor}`}>
                          R$ {profit.toLocaleString('pt-BR')}
                        </td>
                    </tr>
                  );
                })}
            </tbody>
            </table>
        </div>
      </div>
      {isLoggedIn && (
        <div className="flex justify-between items-center">
            <div className="text-left">
                {!chipsMatch && totalChips > 0 && (
                    <p className="text-sm text-yellow-400 animate-pulse">
                        Diferença de R$ {(totalChips - distributedChips).toLocaleString('pt-BR')}. Os totais de fichas devem ser iguais.
                    </p>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <button
                onClick={onCancelGame}
                className="px-6 py-3 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 font-medium rounded-lg text-sm transition-all duration-300"
                >
                Cancelar Jogo
                </button>
                <button
                onClick={onEndGame}
                disabled={!chipsMatch}
                title={!chipsMatch ? "O total de fichas distribuídas deve ser igual ao montante total em dinheiro" : "Salvar esta sessão no histórico"}
                className="px-6 py-3 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm transition-all duration-300 shadow-lg disabled:bg-poker-gray/50 disabled:cursor-not-allowed"
                >
                Encerrar e Salvar Jogo
                </button>
            </div>
        </div>
      )}
       {isAddPlayerModalOpen && isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-poker-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Incluir Jogador na Partida</h3>
              <button onClick={() => setIsAddPlayerModalOpen(false)} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
              {availablePlayersToAdd.length > 0 ? (
                <div className="space-y-2">
                  {availablePlayersToAdd.map(player => (
                    <div key={player.id} className="flex justify-between items-center bg-poker-dark p-3 rounded-lg">
                      <span className="text-white">{player.name}</span>
                      <button
                        onClick={() => {
                          onAddPlayerToGame(player.id);
                          setIsAddPlayerModalOpen(false);
                        }}
                        className="px-3 py-1 text-sm text-white bg-poker-green hover:bg-poker-green/80 rounded-md"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-poker-gray text-center">Todos os jogadores ativos já estão na partida.</p>
              )}
            </div>
            <div className="p-3 border-t border-poker-dark text-right">
              <button onClick={() => setIsAddPlayerModalOpen(false)} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;