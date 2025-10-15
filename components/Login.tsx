import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import PokerClubLogo from './PokerClubLogo';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

interface LoginProps {
    onEnterAsVisitor: () => void;
}

const Login: React.FC<LoginProps> = ({ onEnterAsVisitor }) => {
    const [view, setView] = useState<'login' | 'forgotPassword'>('login');
    
    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Forgot Password State
    const [resetEmail, setResetEmail] = useState('');
    const [message, setMessage] = useState('');
    
    // Common State
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
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
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setMessage('E-mail de redefinição enviado! Verifique sua caixa de entrada e pasta de spam.');
        } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setError('E-mail não encontrado em nossa base de dados.');
            } else {
                setError('Ocorreu um erro. Tente novamente mais tarde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoginView = () => (
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
            <div className="relative">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-poker-gray">Senha</label>
                <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5"
                    placeholder="••••••••"
                    required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5 text-poker-gray hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
            <div className="flex items-center justify-between !mt-4">
                <div className="flex items-start">
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
                <button type="button" onClick={() => setView('forgotPassword')} className="text-sm text-poker-gold hover:underline">Esqueci a senha</button>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-poker-green hover:bg-poker-green/80 focus:ring-4 focus:outline-none focus:ring-poker-green/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 disabled:bg-poker-gray/50 disabled:cursor-wait"
            >
                {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
    );
    
    const renderForgotPasswordView = () => (
      <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
              <label htmlFor="reset-email" className="block mb-2 text-sm font-medium text-poker-gray">Email</label>
              <input
                  type="email"
                  id="reset-email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg focus:ring-poker-gold focus:border-poker-gold block w-full p-2.5"
                  placeholder="Seu e-mail de admin"
                  required
              />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && <p className="text-sm text-green-400 text-center">{message}</p>}
          <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-poker-gold hover:bg-poker-gold/80 focus:ring-4 focus:outline-none focus:ring-poker-gold/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 disabled:bg-poker-gray/50 disabled:cursor-wait"
          >
              {isLoading ? 'Enviando...' : 'Enviar E-mail de Redefinição'}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-sm text-poker-gray hover:underline">Voltar para o Login</button>
          </div>
      </form>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <PokerClubLogo />
                </div>
                <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-white mb-2">
                      {view === 'login' ? 'Acesso Restrito' : 'Redefinir Senha'}
                    </h1>
                    <p className="text-center text-poker-gray mb-6">
                      {view === 'login' 
                        ? 'Área exclusiva para administradores.' 
                        : 'Insira seu e-mail para receber o link de redefinição.'
                      }
                    </p>
                    
                    {view === 'login' ? renderLoginView() : renderForgotPasswordView()}

                    {view === 'login' && (
                        <>
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
                        </>
                    )}
                </div>
                 <p className="text-center text-xs text-poker-gray/50 mt-8">
                    Apenas administradores podem modificar dados. Visitantes têm acesso somente para visualização.
                </p>
            </div>
        </div>
    );
};

export default Login;
