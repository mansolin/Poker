import React, { useState, useEffect } from 'react';
import { generateAndUploadMockData } from '../mock-data';
import type { AppUser, UserRole, GameDefaults } from '../types';

interface SettingsProps {
    isUserOwner: boolean;
    appUsers: AppUser[];
    onUpdateUserRole: (uid: string, role: UserRole) => void;
    onSaveDefaults: (defaults: GameDefaults) => void;
    gameDefaults: GameDefaults;
}

const Settings: React.FC<SettingsProps> = ({ isUserOwner, appUsers, onUpdateUserRole, onSaveDefaults, gameDefaults }) => {
    const [isGeneratingData, setIsGeneratingData] = useState(false);
    const [buyIn, setBuyIn] = useState(gameDefaults.buyIn);
    const [rebuy, setRebuy] = useState(gameDefaults.rebuy);

    useEffect(() => {
        setBuyIn(gameDefaults.buyIn);
        setRebuy(gameDefaults.rebuy);
    }, [gameDefaults]);

    const handleGenerateData = async () => {
        if (isGeneratingData) return;
        const confirmation = window.confirm("Adicionar 10 jogadores e 36 jogos de teste?");
        if (confirmation) {
            setIsGeneratingData(true);
            const success = await generateAndUploadMockData();
            alert(success ? 'Dados de teste gerados com sucesso!' : 'Ocorreu um erro ao gerar os dados.');
            setIsGeneratingData(false);
        }
    };

    const handleSaveDefaults = () => {
        onSaveDefaults({ buyIn, rebuy });
    };

    const getRoleDisplayName = (role: UserRole) => {
        const names = { owner: 'Dono', admin: 'Admin', pending: 'Pendente', visitor: 'Visitante' };
        return names[role] || role;
    };
    
    return (
        <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Configurações</h2>
            
            <div className="space-y-8">
                <div className="bg-poker-dark p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-white mb-2">Valores Padrão</h3>
                    <p className="text-sm text-poker-gray mb-4">Defina valores padrão para buy-in e rebuys.</p>
                    <div className="flex items-center space-x-4 mb-4">
                        <div>
                            <label className="text-xs text-poker-gray">Buy-in Padrão (R$)</label>
                            <input type="number" value={buyIn} onChange={e => setBuyIn(Number(e.target.value))} className="w-28 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
                        </div>
                         <div>
                            <label className="text-xs text-poker-gray">Rebuy Padrão (R$)</label>
                            <input type="number" value={rebuy} onChange={e => setRebuy(Number(e.target.value))} className="w-28 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
                        </div>
                    </div>
                    <button onClick={handleSaveDefaults} className="px-4 py-2 text-sm font-semibold text-white bg-poker-green hover:bg-poker-green/80 rounded-md">
                        Salvar Padrões
                    </button>
                </div>

                {isUserOwner && (
                    <div className="bg-poker-dark p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Usuários</h3>
                        <p className="text-sm text-poker-gray mb-4">Aprove ou altere os cargos dos usuários cadastrados.</p>
                        <div className="space-y-2">
                            {appUsers.map(user => (
                                <div key={user.uid} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-poker-light p-3 rounded-md">
                                    <div>
                                        <p className="font-semibold text-white">{user.name}</p>
                                        <p className="text-xs text-poker-gray">{user.email}</p>
                                    </div>
                                    <div className="mt-2 sm:mt-0">
                                        <select
                                            value={user.role}
                                            onChange={e => onUpdateUserRole(user.uid, e.target.value as UserRole)}
                                            className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2"
                                            disabled={user.role === 'owner'}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="visitor">Visitante</option>
                                            <option value="pending">Pendente</option>
                                            {user.role === 'owner' && <option value="owner">Dono</option>}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-poker-dark p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Dados de Teste</h3>
                    <p className="text-sm text-poker-gray mb-4">Popule o aplicativo com dados de exemplo (10 jogadores e 36 jogos).</p>
                    <button
                        onClick={handleGenerateData}
                        disabled={isGeneratingData}
                        className="px-4 py-2 text-sm font-semibold text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 rounded-md disabled:opacity-50"
                    >
                        {isGeneratingData ? 'Gerando...' : 'Gerar Dados de Teste'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
