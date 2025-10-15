
import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    setPersistence, 
    browserSessionPersistence, 
    browserLocalPersistence, 
    sendPasswordResetEmail, 
    signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import PokerClubLogo from './PokerClubLogo';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import GoogleIcon from './icons/GoogleIcon';
import MailIcon from './icons/MailIcon';
import LockIcon from './icons/LockIcon';
import UserIcon from './icons/UserIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface AuthProps {
    onEnterAsVisitor: () => void;
}

type View = 'login' | 'register' | 'forgotPassword' | 'registerSuccess';

const Auth: React.FC<AuthProps> = ({ onEnterAsVisitor }) => {
    const [view, setView] = useState<View>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const resetState = () => {
        setError('');
        setMessage('');
        setShowPassword(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setIsLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('E-mail ou senha incorretos.');
                    break;
                case 'auth/too-many-requests':
                    setError('Acesso temporariamente bloqueado. Tente novamente mais tarde.');
                    break;
                default:
                    setError('Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        resetState();
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: user.email,
                role: 'pending'
            });

            setView('registerSuccess');
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

    const handleGoogleLogin = async () => {
        resetState();
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            setError('Falha ao autenticar com o Google. Tente novamente.');
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError('E-mail não encontrado em nossa base de dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoginView = () => (
        <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><MailIcon /></span>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
            </div>
            <div className="relative">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><LockIcon /></span>
                <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-poker-gray hover:text-white" aria-label="Toggle password visibility">
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
            <div className="flex items-center justify-between !mt-3">
                <div className="flex items-center h-5"><input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 border rounded bg-poker-dark text-poker-gold" /><div className="ml-3 text-sm"><label htmlFor="remember" className="text-poker-gray">Manter conectado</label></div></div>
                <button type="button" onClick={() => { setView('forgotPassword'); resetState(); }} className="text-sm text-poker-gold hover:underline">Esqueci a senha</button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm px-5 py-3 text-center disabled:bg-poker-gray/50">
                {isLoading ? <SpinnerIcon /> : 'Entrar'}
            </button>
        </form>
    );
    
    const renderRegisterView = () => (
         <form onSubmit={handleRegister} className="space-y-5">
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
            <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm px-5 py-3 text-center disabled:bg-poker-gray/50">
                {isLoading ? <SpinnerIcon /> : 'Criar Conta'}
            </button>
        </form>
    );

    const renderForgotPasswordView = () => (
      <form onSubmit={handlePasswordReset} className="space-y-5">
          <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-poker-gray"><MailIcon /></span>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-poker-dark border border-poker-gray/20 text-white text-sm rounded-lg w-full p-2.5 pl-10" required />
            </div>
          <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center text-white bg-poker-gold hover:bg-poker-gold/80 font-medium rounded-lg text-sm px-5 py-3 disabled:bg-poker-gray/50">
              {isLoading ? <SpinnerIcon /> : 'Enviar E-mail de Redefinição'}
          </button>
      </form>
    );

    const renderRegisterSuccessView = () => (
         <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Registro Concluído!</h1>
            <p className="text-poker-gray mb-6">Sua conta foi criada e está pendente de aprovação. Você será notificado quando sua conta for ativada.</p>
            <button onClick={() => setView('login')} className="w-full text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 font-medium rounded-lg text-sm px-5 py-3 text-center">
                Voltar para o Login
            </button>
        </div>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'login': return renderLoginView();
            case 'register': return renderRegisterView();
            case 'forgotPassword': return renderForgotPasswordView();
            case 'registerSuccess': return renderRegisterSuccessView();
            default: return renderLoginView();
        }
    }

    const getTitle = () => {
        switch(view) {
            case 'login': return { title: 'Acesso Restrito', subtitle: 'Área para administradores e membros.' };
            case 'register': return { title: 'Criar Conta', subtitle: 'Solicite seu acesso ao clube.' };
            case 'forgotPassword': return { title: 'Redefinir Senha', subtitle: 'Insira seu e-mail para o link de redefinição.' };
            default: return { title: '', subtitle: '' };
        }
    }
    
    const { title, subtitle } = getTitle();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-poker-dark p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6"><PokerClubLogo /></div>
                <div className="bg-poker-light p-8 rounded-lg shadow-2xl">
                    {view !== 'registerSuccess' && (
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                            <p className="text-poker-gray">{subtitle}</p>
                        </div>
                    )}
                    
                    {renderContent()}

                    {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
                    {message && <p className="text-sm text-green-400 text-center mt-4">{message}</p>}
                    
                    {view === 'login' && (
                        <>
                            <div className="relative flex py-5 items-center"><div className="flex-grow border-t border-poker-gray/20"></div><span className="flex-shrink mx-4 text-poker-gray text-xs">OU</span><div className="flex-grow border-t border-poker-gray/20"></div></div>
                            <button type="button" onClick={handleGoogleLogin} className="w-full flex justify-center items-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-3 text-center mb-4"><GoogleIcon /> <span className="ml-2">Entrar com Google</span></button>
                            <button type="button" onClick={onEnterAsVisitor} className="w-full text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 font-medium rounded-lg text-sm px-5 py-3 text-center">Entrar como Visitante</button>
                        </>
                    )}
                </div>
                 <div className="text-sm text-center font-medium text-poker-gray mt-6">
                    {view === 'login' && <>Não tem uma conta? <button onClick={() => { setView('register'); resetState(); }} className="text-poker-gold hover:underline">Registre-se</button></>}
                    {(view === 'register' || view === 'forgotPassword') && <>Já tem uma conta? <button onClick={() => { setView('login'); resetState(); }} className="text-poker-gold hover:underline">Faça o login</button></>}
                </div>
            </div>
        </div>
    );
};

export default Auth;
