import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Player, GamePlayer, Session } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AddHistoricGameProps {
    players: Player[];
    onSave: (session: Omit<Session, 'id'>) => void;
    onClose: () => void;
    sessionToEdit?: Session | null;
}

interface HistoricPlayer extends Player {
    isPlaying: boolean;
    totalInvested: number;
    finalChips: number;
    paid?: boolean;
}

const AddHistoricGame: React.FC<AddHistoricGameProps> = ({ players, onSave, onClose, sessionToEdit }) => {
    const [gameName, setGameName] = useState('');
    const [participants, setParticipants] = useState<HistoricPlayer[]>([]);
    const initialStateRef = useRef<string | null>(null);
    const isEditMode = !!sessionToEdit;

    useEffect(() => {
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            return a.name.localeCompare(b.name);
        });

        let initialName = '';
        let initialParticipants: HistoricPlayer[] = [];

        if (isEditMode && sessionToEdit) {
            initialName = sessionToEdit.date.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            initialParticipants = sortedPlayers.map(p => {
                const sessionPlayer = sessionToEdit.players.find(sp => sp.id === p.id);
                if (sessionPlayer) {
                    return { ...p, isPlaying: true, totalInvested: sessionPlayer.totalInvested, finalChips: sessionPlayer.finalChips, paid: sessionPlayer.paid };
                }
                return { ...p, isPlaying: false, totalInvested: 0, finalChips: 0, paid: false };
            });
        } else {
            initialParticipants = sortedPlayers.map(p => ({ ...p, isPlaying: false, totalInvested: 0, finalChips: 0, paid: false }));
        }
        
        setGameName(initialName);
        setParticipants(initialParticipants);
        initialStateRef.current = JSON.stringify({ gameName: initialName, participants: initialParticipants });

    }, [sessionToEdit, players, isEditMode]);


    const { totalInvested, totalFinalChips, chipsMatch } = useMemo(() => {
        const playing = participants.filter(p => p.isPlaying);
        const invested = playing.reduce((sum, p) => sum + p.totalInvested, 0);
        const finalChips = playing.reduce((sum, p) => sum + p.finalChips, 0);
        return {
            totalInvested: invested,
            totalFinalChips: finalChips,
            chipsMatch: invested === finalChips && invested > 0
        };
    }, [participants]);

    const hasUnsavedChanges = useMemo(() => {
        if (!initialStateRef.current) return false;
        const currentStateJSON = JSON.stringify({ gameName, participants });
        return initialStateRef.current !== currentStateJSON;
    }, [gameName, participants]);

    const handleAttemptClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm("Você tem alterações não salvas. Deseja realmente fechar?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 6) value = value.slice(0, 6);
      if (value.length > 4) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
      } else if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
      setGameName(value);
    };
    
    const handlePlayerChange = (playerId: string, field: 'isPlaying' | 'totalInvested' | 'finalChips', value: string | boolean) => {
        setParticipants(prev => prev.map(p => {
            if (p.id === playerId) {
                if (typeof value === 'boolean') {
                    // Reset values if player is deselected
                    return { ...p, isPlaying: value, totalInvested: value ? p.totalInvested : 0, finalChips: value ? p.finalChips : 0 };
                }
                return { ...p, [field]: Math.max(0, parseInt(value, 10) || 0) };
            }
            return p;
        }));
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();
    
    const handleSave = () => {
        if (!/^\d{2}\/\d{2}\/\d{2}$/.test(gameName)) {
            alert("Por favor, preencha uma data válida no formato DD/MM/AA.");
            return;
        }

        const dateParts = gameName.split('/');
        const year = 2000 + parseInt(dateParts[2], 10);
        const gameDate = new Date(year, Number(dateParts[1]) - 1, Number(dateParts[0]));
        
        if (isNaN(gameDate.getTime()) || dateParts[2].length !== 2) {
          alert("A data inserida é inválida.");
          return;
        }

        if (!chipsMatch) {
            alert("O total investido deve ser maior que zero e igual ao total de fichas finais.");
            return;
        }


        const gamePlayers: GamePlayer[] = participants
            .filter(p => p.isPlaying)
            .map(({ isPlaying, ...rest }) => ({
                ...rest,
                buyIn: 0, // Not tracked for historic games
                rebuys: 0, // Not tracked for historic games
                paid: isEditMode ? rest.paid : (rest.finalChips - rest.totalInvested) >= 0,
            }));

        const newSession: Omit<Session, 'id'> = {
            name: gameName,
            date: Timestamp.fromDate(gameDate),
            players: gamePlayers,
        };

        onSave(newSession);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={handleAttemptClose} aria-modal="true" role="dialog">
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-poker-dark flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{isEditMode ? 'Editar Jogo' : 'Incluir Jogo Antigo'}</h2>
                     <button onClick={handleAttemptClose} className="text-poker-gray hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    {/* Top Section: Date and Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="md:col-span-1">
                            <label htmlFor="gameName" className="block text-sm font-medium text-poker-gray mb-1">Data do Jogo</label>
                            <input
                                type="text"
                                id="gameName"
                                value={gameName}
                                onChange={handleDateChange}
                                className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5"
                                placeholder="DD/MM/AA"
                                required
                            />
                        </div>
                        <div className="bg-poker-dark p-4 rounded-lg text-center">
                            <h3 className="text-sm font-semibold text-poker-gray uppercase tracking-wider">Total Investido</h3>
                            <p className="text-2xl font-bold text-poker-gold">R$ {totalInvested.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className={`bg-poker-dark p-4 rounded-lg text-center border-2 ${!chipsMatch && totalInvested > 0 ? 'border-red-500' : 'border-transparent'}`}>
                            <h3 className="text-sm font-semibold text-poker-gray uppercase tracking-wider">Total Fichas Finais</h3>
                            <p className={`text-2xl font-bold ${!chipsMatch && totalInvested > 0 ? 'text-red-500' : 'text-white'}`}>{totalFinalChips.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                    
                    {/* Players Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-poker-dark">
                                <tr>
                                    <th className="py-2 px-2 text-left text-xs font-medium text-poker-gray uppercase">Part.</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-poker-gray uppercase">Jogador</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-poker-gray uppercase">Total Investido (R$)</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-poker-gray uppercase">Saldo Final (Fichas)</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-poker-gray uppercase">Saldo Real (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map(p => {
                                  const profit = p.finalChips - p.totalInvested;
                                  const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400';
                                  return (
                                    <tr key={p.id} className={`border-b border-poker-dark hover:bg-poker-dark/50 ${!p.isActive ? 'opacity-60' : ''}`}>
                                        <td className="py-2 px-2">
                                            <input type="checkbox" checked={p.isPlaying} onChange={e => handlePlayerChange(p.id, 'isPlaying', e.target.checked)} className="w-5 h-5 text-poker-green bg-gray-700 border-gray-600 rounded focus:ring-poker-green disabled:cursor-not-allowed" disabled={!p.isActive}/>
                                        </td>
                                        <td className="py-2 px-4 text-white">{p.name}</td>
                                        <td className="py-2 px-4">
                                            <input type="number" min="0" step="50" onFocus={handleFocus} disabled={!p.isPlaying} value={p.totalInvested} onChange={e => handlePlayerChange(p.id, 'totalInvested', e.target.value)} className="w-28 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 disabled:bg-poker-dark/50 disabled:cursor-not-allowed"/>
                                        </td>
                                        <td className="py-2 px-4">
                                            <input type="number" min="0" step="50" onFocus={handleFocus} disabled={!p.isPlaying} value={p.finalChips} onChange={e => handlePlayerChange(p.id, 'finalChips', e.target.value)} className="w-28 bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2 disabled:bg-poker-dark/50 disabled:cursor-not-allowed"/>
                                        </td>
                                        <td className={`py-2 px-4 text-sm font-bold ${p.isPlaying ? profitColor : 'text-poker-gray/50'}`}>
                                          {p.isPlaying ? `R$ ${profit.toLocaleString('pt-BR')}` : 'R$ 0'}
                                        </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-poker-dark mt-auto bg-poker-dark/50">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-left">
                            {!chipsMatch && totalInvested > 0 && (
                                <p className="text-sm text-yellow-400 animate-pulse">
                                    Diferença de R$ {(totalInvested - totalFinalChips).toLocaleString('pt-BR')}. Os totais devem ser iguais para salvar.
                                </p>
                            )}
                        </div>
                        <div className="flex space-x-4">
                            <button onClick={handleAttemptClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                            <button onClick={handleSave} disabled={!chipsMatch} className="px-6 py-2 text-white bg-poker-green hover:bg-poker-green/80 disabled:bg-poker-gray/50 disabled:cursor-not-allowed font-medium rounded-lg text-sm">Salvar Jogo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddHistoricGame;