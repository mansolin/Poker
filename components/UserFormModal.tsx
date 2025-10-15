import React, { useState } from 'react';
import type { AppUser, UserRole } from '../types';
import MailIcon from './icons/MailIcon';
import LockIcon from './icons/LockIcon';
import UserIcon from './icons/UserIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface UserFormModalProps {
    onSave: (userData: Omit<AppUser, 'uid'>, password: string) => Promise<boolean>;
    onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setIsLoading(true);

        const userData: Omit<AppUser, 'uid'> = { name, email, role };
        const success = await onSave(userData, password);

        setIsLoading(false);
        if (success) {
            onClose();
        } else {
            setError('Falha ao criar usuário. O e-mail pode já estar em uso.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Cadastrar Novo Usuário</h3>
                    <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><UserIcon /></span>
                            <input type="text" placeholder="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><MailIcon /></span>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><LockIcon /></span>
                            <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
                        </div>
                         <div>
                            <label htmlFor="role" className="text-sm font-medium text-poker-gray mb-1 block">Cargo</label>
                            <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5">
                                <option value="admin">Admin</option>
                                <option value="visitor">Visitante</option>
                            </select>
                        </div>
                         {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </div>
                    <div className="p-4 border-t border-poker-dark flex justify-end items-center space-x-2">
                       <button type="button" onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm">Cancelar</button>
                       <button type="submit" disabled={isLoading} className="w-28 h-10 flex justify-center items-center text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm">
                           {isLoading ? <SpinnerIcon /> : 'Salvar'}
                       </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
