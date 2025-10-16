import React, { useState, useEffect, useRef } from 'react';
import { generateAndUploadMockData } from '../mock-data';
import type { AppUser, UserRole, GameDefaults } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import UserFormModal from './UserFormModal';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import SpinnerIcon from './icons/SpinnerIcon';

interface SettingsProps {
    isUserOwner: boolean;
    appUsers: AppUser[];
    onUpdateUserRole: (uid: string, role: UserRole) => void;
    onSaveDefaults: (defaults: GameDefaults) => void;
    gameDefaults: GameDefaults;
    onAddUser: (userData: Omit<AppUser, 'uid'>, password: string) => Promise<boolean>;
    onDeleteUser: (uid: string) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const BannerImageManager: React.FC<{ showToast: SettingsProps['showToast'] }> = ({ showToast }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const imageConfigRef = doc(db, 'config', 'homepageImage');
        const unsubscribe = onSnapshot(imageConfigRef, (docSnap) => {
            if (docSnap.exists()) {
                setImageUrl(docSnap.data().url);
            } else {
                setImageUrl(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const storageRef = ref(storage, 'homepage/main-image');
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            await setDoc(doc(db, 'config', 'homepageImage'), { url: downloadURL });

            showToast('Imagem atualizada com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            showToast('Falha ao atualizar a imagem.', 'error');
        } finally {
            setIsLoading(false);
            // Clear the file input value to allow re-uploading the same file
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-poker-dark p-4 rounded-lg">
             <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
            />
            <h3 className="text-lg font-semibold text-white mb-2">Imagem da Tela de Login</h3>
            <p className="text-sm text-poker-gray mb-4">Altere a imagem de destaque exibida na tela de login.</p>
            <div className="flex items-center space-x-4">
                <div className="w-48 h-28 bg-poker-light rounded flex items-center justify-center overflow-hidden">
                    {isLoading ? <SpinnerIcon /> : (
                        imageUrl ? 
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" /> : 
                        <span className="text-poker-gray text-sm">Sem imagem</span>
                    )}
                </div>
                <button 
                    onClick={handleFileSelect} 
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-poker-green hover:bg-poker-green/80 rounded-md disabled:opacity-50"
                >
                    {isLoading ? 'Enviando...' : 'Alterar Imagem'}
                </button>
            </div>
        </div>
    );
};


const Settings: React.FC<SettingsProps> = ({ isUserOwner, appUsers, onUpdateUserRole, onSaveDefaults, gameDefaults, onAddUser, onDeleteUser, showToast }) => {
    const [isGeneratingData, setIsGeneratingData] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
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
    
    const handleCreateTestAdmin = async () => {
        const testAdminEmail = 'admin@poker.com';
        const userExists = appUsers.some(user => user.email === testAdminEmail);
        
        if (userExists) {
            alert(`Usuário de teste (${testAdminEmail}) já existe.`);
            return;
        }

        const userData = {
            name: 'Admin de Teste',
            email: testAdminEmail,
            role: 'admin' as UserRole
        };
        const password = 'admin123'; // Min 6 chars required by Firebase

        const success = await onAddUser(userData, password);
        if (success) {
            alert(`Admin de teste criado!\nEmail: ${testAdminEmail}\nSenha: ${password}`);
        }
    };

    const handleSaveDefaults = () => {
        onSaveDefaults({ buyIn, rebuy });
    };
    
    return (
        <>
            <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Configurações</h2>
                
                <div className="space-y-8">
                    {isUserOwner && <BannerImageManager showToast={showToast} />}

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
                                                disabled={user.role === 'owner'}
                                            >
                                                <option value="owner">Dono</option>
                                                <option value="admin">Admin</option>
                                                <option value="visitor">Visitante</option>
                                                <option value="pending">Pendente</option>
                                            </select>
                                            {user.role !== 'owner' && (
                                                <button onClick={() => onDeleteUser(user.uid)} className="p-2 text-poker-gray hover:text-red-500" title="Excluir Usuário">
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
                             {isUserOwner && (
                                <button onClick={handleCreateTestAdmin} className="px-4 py-2 text-sm font-semibold text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 rounded-md">
                                    Criar Admin de Teste
                                </button>
                            )}
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
        </>
    );
};

export default Settings;