import React, { useState, useEffect } from 'react';
import { generateAndUploadMockData } from '../mock-data';
import type { AppUser, UserRole, GameDefaults } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import UserFormModal from './UserFormModal';
import SpinnerIcon from './icons/SpinnerIcon';

interface DeleteUserConfirmationModalProps {
    user: AppUser;
    onClose: () => void;
    onConfirm: (uid: string) => Promise<void>;
}

const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({ user, onClose, onConfirm }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError('');
        try {
            await onConfirm(user.uid);
            onClose();
        } catch (e: any) {
            setError(e.message || 'Falha ao excluir usuário.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-800/50 mb-4">
                        <TrashIcon />
                    </div>
                    <h4 className="text-lg font-bold text-white">Excluir Usuário?</h4>
                    <p className="text-sm text-poker-gray my-2">
                        Você está prestes a remover permanentemente o registro do usuário:
                        <br />
                        <strong className="text-white">{user.name} ({user.email})</strong>
                    </p>
                    <p className="text-xs text-red-400 font-semibold">Esta ação não pode ser desfeita.</p>
                     {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
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

interface SettingsProps {
    isUserOwner: boolean;
    appUsers: AppUser[];
    onUpdateUserRole: (uid: string, role: UserRole) => void;
    onSaveDefaults: (defaults: GameDefaults) => void;
    gameDefaults: GameDefaults;
    onAddUser: (userData: Omit<AppUser, 'uid'>, password: string) => Promise<boolean>;
    onDeleteUser: (uid: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ isUserOwner, appUsers, onUpdateUserRole, onSaveDefaults, gameDefaults, onAddUser, onDeleteUser }) => {
    const [isGeneratingData, setIsGeneratingData] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
    const [buyIn, setBuyIn] = useState(gameDefaults.buyIn);
    const [rebuy, setRebuy] = useState(gameDefaults.rebuy);
    const [clubPixKey, setClubPixKey] = useState(gameDefaults.clubPixKey || '');

    useEffect(() => {
        setBuyIn(gameDefaults.buyIn);
        setRebuy(gameDefaults.rebuy);
        setClubPixKey(gameDefaults.clubPixKey || '');
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
        onSaveDefaults({ buyIn, rebuy, clubPixKey });
    };
    
    return (
        <>
            <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Configurações</h2>
                
                <div className="space-y-8">

                    <div className="bg-poker-dark p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Valores Padrão e PIX</h3>
                        <p className="text-sm text-poker-gray mb-4">Defina valores padrão para o jogo e a chave PIX do clube.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-poker-gray">Buy-in Padrão (R$)</label>
                                <input type="number" value={buyIn} onChange={e => setBuyIn(Number(e.target.value))} className="w-full bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="text-xs text-poker-gray">Rebuy Padrão (R$)</label>
                                <input type="number" value={rebuy} onChange={e => setRebuy(Number(e.target.value))} className="w-full bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
                            </div>
                             <div className="sm:col-span-2">
                                <label className="text-xs text-poker-gray">Chave PIX do Clube</label>
                                <input type="text" value={clubPixKey} placeholder="E-mail, CPF/CNPJ, Telefone, etc." onChange={e => setClubPixKey(e.target.value)} className="w-full bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2" />
                            </div>
                        </div>
                        <button onClick={handleSaveDefaults} className="px-4 py-2 text-sm font-semibold text-white bg-poker-green hover:bg-poker-green/80 rounded-md">
                            Salvar Padrões
                        </button>
                    </div>

                    {isUserOwner && (
                        <div className="bg-poker-dark p-4 rounded-lg">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Gerenciar Usuários</h3>
                                    <p className="text-sm text-poker-gray">Aprove ou altere os cargos dos usuários.</p>
                                </div>
                                <button onClick={() => setIsUserModalOpen(true)} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md bg-poker-green text-white shadow-md hover:bg-poker-green/80">
                                    <span className="h-5 w-5 mr-2"><PlusIcon/></span>Cadastrar Usuário
                                </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {appUsers.map(user => (
                                    <div key={user.uid} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-poker-light p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold text-white">{user.name}</p>
                                            <p className="text-xs text-poker-gray">{user.email}</p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                                            <select
                                                value={user.role}
                                                onChange={e => onUpdateUserRole(user.uid, e.target.value as UserRole)}
                                                className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg p-2"
                                                disabled={user.email === 'marcioansolin@gmail.com'}
                                            >
                                                <option value="owner">Dono</option>
                                                <option value="admin">Admin</option>
                                                <option value="visitor">Visitante</option>
                                                <option value="pending">Pendente</option>
                                            </select>
                                            {user.email !== 'marcioansolin@gmail.com' && (
                                                <button onClick={() => setUserToDelete(user)} className="p-2 text-poker-gray hover:text-red-500" title="Excluir Usuário">
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-poker-dark p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Ferramentas de Teste</h3>
                        <p className="text-sm text-poker-gray mb-4">Popule o app com dados ou crie um admin para testes.</p>
                        <div className="flex items-center space-x-4">
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
            </div>
            {isUserModalOpen && isUserOwner && (
                <UserFormModal
                    onSave={onAddUser}
                    onClose={() => setIsUserModalOpen(false)}
                />
            )}
            {userToDelete && isUserOwner && (
                <DeleteUserConfirmationModal
                    user={userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={onDeleteUser}
                />
            )}
        </>
    );
};

export default Settings;