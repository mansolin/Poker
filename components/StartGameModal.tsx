import React, { useState, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface StartGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartGame: (gameName: string) => Promise<void> | void;
}

const StartGameModal: React.FC<StartGameModalProps> = ({ isOpen, onClose, onStartGame }) => {
    const [gameName, setGameName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Pre-fill with current date as a suggestion
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            setGameName(`${day}/${month}/${year}`);
            setIsLoading(false); // Reset loading state when opened
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (gameName.trim() === '') return;

        setIsLoading(true);
        try {
            await onStartGame(gameName.trim());
            // Parent component is responsible for closing the modal on success.
        } catch (error) {
            console.error("Failed to start game:", error);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-poker-light rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-poker-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Iniciar Novo Jogo</h3>
                    <button onClick={onClose} className="text-poker-gray hover:text-white text-3xl" disabled={isLoading}>&times;</button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label htmlFor="game-name" className="text-sm font-medium text-poker-gray mb-2 block">
                            Dê um nome para o jogo
                        </label>
                        <input
                            id="game-name"
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            className="bg-poker-dark border border-poker-gray/20 text-white text-lg rounded-lg w-full p-2.5"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-poker-gray mt-2">Sugestão: data ou nome descritivo (ex: "Poker de Sexta").</p>
                    </div>
                    <footer className="p-4 border-t border-poker-dark flex justify-end items-center space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-poker-gray bg-transparent hover:bg-poker-dark rounded-lg text-sm" disabled={isLoading}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || gameName.trim() === ''}
                            className="w-48 h-10 flex justify-center items-center text-white bg-poker-green hover:bg-poker-green/80 font-medium rounded-lg text-sm disabled:bg-poker-gray/50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <SpinnerIcon /> : 'Confirmar e Iniciar'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default StartGameModal;