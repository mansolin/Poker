
import React, { useState, useMemo, useEffect } from 'react';
import type { Player, DinnerSession, DinnerParticipant } from '../types';
import PlayerAvatar from './PlayerAvatar';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import SpinnerIcon from './icons/SpinnerIcon';

const DeleteDinnerConfirmationModal: React.FC<{
    dinner: DinnerSession;
    onClose: () => void;
    onConfirm: (dinnerId: string) => Promise<boolean>;
}> = ({ dinner, onClose, onConfirm }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        const success = await onConfirm(dinner.id);
        setIsDeleting(false);
        if (success) {
            onClose(); // Only close the modal on successful deletion
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-800/50 mb-4">
                       <TrashIcon />
                    </div>
                    <h4 className="text-lg font-bold text-white">Excluir Jantar?</h4>
                    <p className="text-sm text-poker-gray my-2">
                        Você está prestes a excluir permanentemente o jantar de:
                        <br />
                        <strong className="text-white">{dinner.name}</strong>
                    </p>
                    <p className="text-xs text-red-400 font-semibold">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="p-4 border-t border-poker-dark flex justify-center gap-4">
                    <button onClick={onClose} disabled={isDeleting} className="w-full px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm font-semibold">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} disabled={isDeleting} className="w-full h-10 flex justify-center items-center text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm disabled:bg-poker-gray/50">
                        {isDeleting ? <SpinnerIcon /> : 'Confirmar Exclusão'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DinnerProps {
    isUserAdmin: boolean;
    isUserOwner: boolean;
    allPlayers: Player[];
    liveDinner: DinnerSession | null;
    dinnerHistory: DinnerSession[];
    onStartDinner: (playerIds: string[]) => void;
    onUpdateDinner: (updatedDinnerData: Partial<DinnerSession>) => void;
    onFinalizeDinner: () => void;
    onCancelDinner: () => void;
    onDeleteDinnerSession: (dinnerSessionId: string) => Promise<boolean>;
}

const Dinner: React.FC<DinnerProps> = ({ isUserAdmin, allPlayers, liveDinner, dinnerHistory, onStartDinner, onUpdateDinner, onFinalizeDinner, onCancelDinner, onDeleteDinnerSession }) => {
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [dinnerToDelete, setDinnerToDelete] = useState<DinnerSession | null>(null);

    const [foodCost, setFoodCost] = useState(liveDinner?.totalFoodCost || 0);
    const [drinkCost, setDrinkCost] = useState(liveDinner?.totalDrinkCost || 0);

    useEffect(() => {
        setFoodCost(liveDinner?.totalFoodCost || 0);
        setDrinkCost(liveDinner?.totalDrinkCost || 0);
    }, [liveDinner]);

    const handleStartDinner = () => {
        if (selectedPlayerIds.length > 0) {
            onStartDinner(selectedPlayerIds);
            setIsSelectionModalOpen(false);
            setSelectedPlayerIds([]);
        } else {
            alert('Selecione pelo menos um participante.');
        }
    };
    
    const handleToggleSelectPlayer = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };
    
    const handleParticipantToggle = (participantId: string, type: 'isEating' | 'isDrinking') => {
        if (!liveDinner) return;
        const updatedParticipants = liveDinner.participants.map(p =>
            p.id === participantId ? { ...p, [type]: !p[type] } : p
        );
        onUpdateDinner({ participants: updatedParticipants });
    };
    
    const handleCostChange = (type: 'food' | 'drink', value: number) => {
        const numericValue = isNaN(value) || value < 0 ? 0 : value;
        if (type === 'food') {
            setFoodCost(numericValue);
        } else {
            setDrinkCost(numericValue);
        }
    };

    const handleCostsBlur = () => {
        if (!liveDinner) return;
        if (liveDinner.totalFoodCost !== foodCost || liveDinner.totalDrinkCost !== drinkCost) {
            onUpdateDinner({ totalFoodCost: foodCost, totalDrinkCost: drinkCost });
        }
    };

    const calculation = useMemo(() => {
        if (!liveDinner) return null;

        const eatingCount = liveDinner.participants.filter(p => p.isEating).length;
        const drinkingCount = liveDinner.participants.filter(p => p.isDrinking).length;

        const foodPerPerson = eatingCount > 0 ? liveDinner.totalFoodCost / eatingCount : 0;
        const drinkPerPerson = drinkingCount > 0 ? liveDinner.totalDrinkCost / drinkingCount : 0;
        
        const participantsWithOwed = liveDinner.participants.map(p => {
            let amountOwed = 0;
            if (p.isEating) amountOwed += foodPerPerson;
            if (p.isDrinking) amountOwed += drinkPerPerson;
            return {...p, amountOwed };
        });

        const totalCost = liveDinner.totalFoodCost + liveDinner.totalDrinkCost;

        return { eatingCount, drinkingCount, foodPerPerson, drinkPerPerson, totalCost, participantsWithOwed };
    }, [liveDinner]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-poker-light p-4 rounded-lg shadow-xl gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Controle de Despesas do Jantar</h2>
                         {liveDinner && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg text-poker-gold font-semibold">{liveDinner.name}</span>
                                <div className="relative inline-block px-3 py-1 text-xs font-semibold leading-tight text-white rounded-full bg-poker-green overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-poker-green via-green-400 to-poker-green animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                    <span className="relative">Em Andamento</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {isUserAdmin && (
                        <button 
                            onClick={() => setIsSelectionModalOpen(true)} 
                            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white shadow-md hover:bg-poker-green/80 disabled:bg-poker-gray/50 disabled:cursor-not-allowed"
                            disabled={!!liveDinner}
                            title={liveDinner ? "Um jantar já está em andamento" : "Iniciar um novo jantar"}
                        >
                            <span className="mr-2 h-5 w-5"><PlusIcon /></span>Novo Jantar
                        </button>
                    )}
                </div>

                {liveDinner && calculation ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
                                <h3 className="text-lg font-semibold text-white mb-4">Custos Totais</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="food-cost" className="text-sm font-medium text-poker-gray mb-1 block">Custo da Comida (R$)</label>
                                        <input id="food-cost" type="number" value={foodCost} onChange={e => handleCostChange('food', parseFloat(e.target.value))} onBlur={handleCostsBlur} disabled={!isUserAdmin} className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg w-full p-2.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="drink-cost" className="text-sm font-medium text-poker-gray mb-1 block">Custo da Bebida (R$)</label>
                                        <input id="drink-cost" type="number" value={drinkCost} onChange={e => handleCostChange('drink', parseFloat(e.target.value))} onBlur={handleCostsBlur} disabled={!isUserAdmin} className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg w-full p-2.5" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl text-center">
                                <h3 className="text-lg font-semibold text-white mb-4">Resumo</h3>
                                <div className="space-y-3">
                                    <div className="bg-poker-dark p-3 rounded-lg"><p className="text-sm text-poker-gray">Custo Comida p/ Pessoa</p><p className="font-bold text-lg text-white">R$ {calculation.foodPerPerson.toFixed(2)}</p></div>
                                    <div className="bg-poker-dark p-3 rounded-lg"><p className="text-sm text-poker-gray">Custo Bebida p/ Pessoa</p><p className="font-bold text-lg text-white">R$ {calculation.drinkPerPerson.toFixed(2)}</p></div>
                                    <div className="bg-poker-dark p-3 rounded-lg"><p className="text-sm text-poker-gray">Custo Total do Jantar</p><p className="font-bold text-2xl text-poker-gold">R$ {calculation.totalCost.toFixed(2)}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Participantes ({liveDinner.participants.length})</h3>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {calculation.participantsWithOwed?.map(p => (
                                    <div key={p.id} className="grid grid-cols-3 items-center p-2 rounded-lg bg-poker-dark gap-2">
                                        <div className="flex items-center col-span-1">
                                            <PlayerAvatar name={p.name} size="sm"/>
                                            <span className="ml-3 font-semibold text-white truncate">{p.name}</span>
                                        </div>
                                        <div className="flex items-center justify-center space-x-4 col-span-1">
                                            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={p.isEating} onChange={() => handleParticipantToggle(p.id, 'isEating')} disabled={!isUserAdmin} className="w-5 h-5 rounded bg-poker-light border-poker-gray text-poker-green focus:ring-poker-green"/> <span className="text-sm text-poker-gray">Comeu?</span></label>
                                            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={p.isDrinking} onChange={() => handleParticipantToggle(p.id, 'isDrinking')} disabled={!isUserAdmin} className="w-5 h-5 rounded bg-poker-light border-poker-gray text-poker-green focus:ring-poker-green"/> <span className="text-sm text-poker-gray">Bebeu?</span></label>
                                        </div>
                                        <div className="text-right col-span-1">
                                            <p className="text-sm text-poker-gray">Valor a Pagar</p>
                                            <p className="font-bold text-poker-gold text-lg">R$ {p.amountOwed.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isUserAdmin && (
                            <div className="flex justify-end items-center space-x-4">
                                <button onClick={onCancelDinner} className="px-4 py-2 text-poker-gray bg-poker-dark hover:bg-poker-dark/50 font-medium rounded-lg text-sm">Cancelar Jantar</button>
                                <button onClick={onFinalizeDinner} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm shadow-lg">Encerrar e Salvar</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Histórico de Jantares</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {dinnerHistory.length > 0 ? (
                                dinnerHistory.map(dinner => {
                                    const totalCost = dinner.totalFoodCost + dinner.totalDrinkCost;
                                    return (
                                        <div key={dinner.id} className="bg-poker-dark rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div className="w-full grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-x-4 gap-y-2 items-center flex-grow">
                                                <div className="col-span-2 md:col-span-1">
                                                    <h4 className="font-bold text-lg text-white truncate" title={dinner.name}>{dinner.name}</h4>
                                                    <p className="text-sm text-poker-gray">{dinner.date.toDate().toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className="text-left md:text-center">
                                                    <p className="text-xs uppercase text-poker-gray">Participantes</p>
                                                    <p className="text-lg font-semibold text-white">{dinner.participants.length}</p>
                                                </div>
                                                <div className="text-left md:text-right">
                                                    <p className="text-xs uppercase text-poker-gray">Custo Total</p>
                                                    <p className="text-xl font-bold text-poker-gold">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                            {isUserAdmin && (
                                                <button 
                                                    onClick={() => setDinnerToDelete(dinner)}
                                                    className="flex-shrink-0 self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md flex items-center gap-1"
                                                    title="Excluir Jantar do Histórico"
                                                >
                                                    <TrashIcon />
                                                    <span className="hidden sm:inline">Excluir</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center p-10">
                                    <p className="text-poker-gray">Nenhum jantar foi salvo no histórico ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isSelectionModalOpen && isUserAdmin && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                        <header className="p-4 border-b border-poker-dark flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Selecionar Participantes do Jantar</h3>
                            <button onClick={() => setIsSelectionModalOpen(false)} className="text-poker-gray hover:text-white text-3xl">&times;</button>
                        </header>
                        <main className="p-4 flex-grow overflow-y-auto space-y-2">
                            {allPlayers.filter(p => p.isActive).map(player => (
                                <div key={player.id} className={`flex items-center p-2 rounded-lg transition-colors ${selectedPlayerIds.includes(player.id) ? 'bg-poker-green/20' : 'bg-poker-dark'}`}>
                                    <input type="checkbox" checked={selectedPlayerIds.includes(player.id)} onChange={() => handleToggleSelectPlayer(player.id)} className="w-5 h-5 mr-3 rounded bg-poker-light border-poker-gray text-poker-green focus:ring-poker-green" />
                                    <PlayerAvatar name={player.name} />
                                    <p className="ml-3 font-semibold text-white">{player.name}</p>
                                </div>
                            ))}
                        </main>
                        <footer className="p-4 border-t border-poker-dark flex justify-end gap-2">
                            <button onClick={() => setIsSelectionModalOpen(false)} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                            <button onClick={handleStartDinner} disabled={selectedPlayerIds.length === 0} className="px-4 py-2 text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm disabled:bg-poker-gray/50">
                                Iniciar Jantar ({selectedPlayerIds.length})
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {dinnerToDelete && isUserAdmin && (
                <DeleteDinnerConfirmationModal
                    dinner={dinnerToDelete}
                    onClose={() => setDinnerToDelete(null)}
                    onConfirm={onDeleteDinnerSession}
                />
            )}
        </>
    );
};

export default Dinner;