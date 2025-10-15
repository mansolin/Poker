import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PokerClubLogo from './PokerClubLogo';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore with 'pending' role
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: user.email,
                role: 'pending'
            });

            setSuccess(true);
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está cadastrado.');
            } else if (err.code === 'auth/invalid-email') {
                setError('O formato do e-mail é inválido.');
            } else {
                setError('Ocorreu um erro ao registrar. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4 text-center">
                 <div className="w-full max-w-md">
                    <div className="flex justify-center mb-6"><PokerClubLogo /></div>
                    <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                        <h1 className="text-2xl font-bold text-white mb-4">Registro Concluído!</h1>
                        <p className="text-poker-gray mb-6">Sua conta foi criada e está pendente de aprovação pelo Dono do clube. Você será notificado quando sua conta for ativada.</p>
                        <button onClick={onSwitchToLogin} className="w-full text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 font-medium rounded-lg text-sm px-5 py-3 text-center">
                            Voltar para o Login
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6"><PokerClubLogo /></div>
                <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-white mb-6">Criar Conta</h1>
                    <form onSubmit={handleRegister} className="space-y-6">
                         <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-medium text-poker-gray">Nome</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-poker-gray">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-poker-gray">Senha</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm px-5 py-3 text-center disabled:bg-poker-gray/50">
                            {isLoading ? 'Registrando...' : 'Registrar'}
                        </button>
                    </form>
                    <div className="text-sm text-center font-medium text-poker-gray mt-6">
                        Já tem uma conta? <button onClick={onSwitchToLogin} className="text-poker-gold hover:underline">Faça o login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
