import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import PokerClubLogo from './PokerClubLogo';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import GoogleIcon from './icons/GoogleIcon';

interface LoginProps {
    onEnterAsVisitor: () => void;
    onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onEnterAsVisitor, onSwitchToRegister }) => {
    const [view, setView] = useState<'login' | 'forgotPassword'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [message, setMessage] = useState('');
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
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setMessage('');
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged in App.tsx will handle the rest
        } catch (err: any) {
            setError('Falha ao autenticar com o Google. Tente novamente.');
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setMessage('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError('E-mail não encontrado em nossa base de dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoginView = () => (
        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-poker-gray">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
            </div>
            <div className="relative">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-poker-gray">Senha</label>
                <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-poker-gray hover:text-white" aria-label="Toggle password visibility">
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
            <div className="flex items-center justify-between !mt-4">
                <div className="flex items-center h-5"><input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 border rounded bg-poker-dark text-poker-gold" /><div className="ml-3 text-sm"><label htmlFor="remember" className="text-poker-gray">Manter conectado</label></div></div>
                <button type="button" onClick={() => setView('forgotPassword')} className="text-sm text-poker-gold hover:underline">Esqueci a senha</button>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm px-5 py-3 text-center disabled:bg-poker-gray/50">
                {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
    );
    
    const renderForgotPasswordView = () => (
      <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
              <label htmlFor="reset-email" className="block mb-2 text-sm font-medium text-poker-gray">Email</label>
              <input type="email" id="reset-email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5" required />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && <p className="text-sm text-green-400 text-center">{message}</p>}
          <button type="submit" disabled={isLoading} className="w-full text-white bg-poker-gold hover:bg-poker-gold/80 font-medium rounded-lg text-sm px-5 py-3 disabled:bg-poker-gray/50">
              {isLoading ? 'Enviando...' : 'Enviar E-mail de Redefinição'}
          </button>
          <div className="text-center"><button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-sm text-poker-gray hover:underline">Voltar para o Login</button></div>
      </form>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6"><PokerClubLogo /></div>
                <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-white mb-2">{view === 'login' ? 'Acesso Restrito' : 'Redefinir Senha'}</h1>
                    <p className="text-center text-poker-gray mb-6">{view === 'login' ? 'Área para administradores.' : 'Insira seu e-mail para o link de redefinição.'}</p>
                    {view === 'login' ? renderLoginView() : renderForgotPasswordView()}
                    {view === 'login' && (
                        <>
                            <div className="relative flex py-5 items-center"><div className="flex-grow border-t border-poker-gray/20"></div><span className="flex-shrink mx-4 text-poker-gray text-xs">OU</span><div className="flex-grow border-t border-poker-gray/20"></div></div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full flex justify-center items-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-3 text-center mb-4"
                            >
                               <GoogleIcon /> <span className="ml-2">Entrar com Google</span>
                            </button>
                            <button type="button" onClick={onEnterAsVisitor} className="w-full text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 font-medium rounded-lg text-sm px-5 py-3 text-center">Entrar como Visitante</button>
                        </>
                    )}
                </div>
                 <div className="text-sm text-center font-medium text-poker-gray mt-6">
                    Não tem uma conta? <button onClick={onSwitchToRegister} className="text-poker-gold hover:underline">Registre-se</button>
                </div>
            </div>
        </div>
    );
};

export default Login;