import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../firebase';
import PokerClubLogo from './PokerClubLogo';

interface LoginProps {
    onEnterAsVisitor: () => void;
}

const Login: React.FC<LoginProps> = ({ onEnterAsVisitor }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setError('Credenciais inválidas. Verifique seu e-mail e senha.');
            } else {
                setError('Ocorreu um erro ao fazer login. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <PokerClubLogo />
                </div>
                <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h1>
                    <p className="text-center text-poker-gray mb-6">Área exclusiva para administradores.</p>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-poker-gray">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5"
                                placeholder="admin@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-poker-gray">Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center h-5">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 border border-gray-600 rounded bg-poker-dark text-poker-gold focus:ring-poker-gold"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="remember" className="text-poker-gray cursor-pointer">Manter conectado</label>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 text-center !mt-4">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white bg-poker-green hover:bg-poker-green/80 focus:ring-4 focus:outline-none focus:ring-poker-green/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 disabled:bg-poker-gray/50 disabled:cursor-wait"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-poker-gray/20"></div>
                        <span className="flex-shrink mx-4 text-poker-gray text-xs">OU</span>
                        <div className="flex-grow border-t border-poker-gray/20"></div>
                    </div>
                    <button
                        type="button"
                        onClick={onEnterAsVisitor}
                        className="w-full text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300"
                    >
                        Entrar como Visitante
                    </button>
                </div>
                 <p className="text-center text-xs text-poker-gray/50 mt-8">
                    Apenas administradores podem modificar dados. Visitantes têm acesso somente para visualização.
                </p>
            </div>
        </div>
    );
};

export default Login;