import React, { useState, useEffect, useCallback, useRef } from 'react';

const blindsStructure = [
    { level: 1, small: 25, big: 50, duration: 900 }, // 15 min
    { level: 2, small: 50, big: 100, duration: 900 },
    { level: 3, small: 75, big: 150, duration: 900 },
    { level: 4, small: 100, big: 200, duration: 900 },
    { level: 5, small: 150, big: 300, duration: 1200 }, // 20 min
    { level: 6, small: 200, big: 400, duration: 1200 },
    { level: 7, small: 300, big: 600, duration: 1200 },
    { level: 8, small: 400, big: 800, duration: 1200 },
    { level: 9, small: 600, big: 1200, duration: 1500 }, // 25 min
    { level: 10, small: 800, big: 1600, duration: 1500 },
    { level: 11, small: 1000, big: 2000, duration: 1500 },
    { level: 12, small: 1500, big: 3000, duration: 1500 },
];

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const BlindsTimer: React.FC = () => {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(blindsStructure[0].duration);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = document.getElementById('timer-beep') as HTMLAudioElement;
    }, []);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        }
    };

    const handleNextLevel = useCallback(() => {
        playSound();
        const nextIndex = currentLevelIndex + 1;
        if (nextIndex < blindsStructure.length) {
            setCurrentLevelIndex(nextIndex);
            setTimeRemaining(blindsStructure[nextIndex].duration);
        } else {
            setIsRunning(false); // Stop if it's the last level
        }
    }, [currentLevelIndex]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleNextLevel();
                        return 0; // It will be updated by handleNextLevel's state change
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, handleNextLevel]);

    const handlePlayPause = () => setIsRunning(prev => !prev);

    const handleReset = () => {
        setIsRunning(false);
        setCurrentLevelIndex(0);
        setTimeRemaining(blindsStructure[0].duration);
    };
    
    const handleSkip = () => {
        if(window.confirm('Tem certeza que deseja pular para o próximo nível?')) {
            handleNextLevel();
        }
    }

    const currentLevel = blindsStructure[currentLevelIndex];
    const nextLevel = blindsStructure[currentLevelIndex + 1];

    return (
        <div className="bg-poker-light p-4 rounded-lg shadow-xl text-center w-full">
            <h3 className="text-base font-semibold text-poker-gray uppercase tracking-wider mb-2">Timer de Blinds</h3>
            <div className="text-5xl font-bold text-white tabular-nums">{formatTime(timeRemaining)}</div>
            <div className="my-3">
                <p className="text-lg text-white">Nível {currentLevel.level}: <span className="font-bold text-poker-gold">{currentLevel.small} / {currentLevel.big}</span></p>
                {nextLevel && <p className="text-sm text-poker-gray">Próximo: {nextLevel.small} / {nextLevel.big}</p>}
            </div>
            <div className="flex justify-center items-center space-x-3 mt-4">
                <button onClick={handlePlayPause} className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${isRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-poker-green hover:bg-poker-green/80'}`}>
                    {isRunning ? 'Pausar' : 'Iniciar'}
                </button>
                <button onClick={handleSkip} disabled={!nextLevel} className="px-5 py-2 text-sm font-semibold text-white bg-poker-dark hover:bg-poker-dark/70 rounded-lg transition-colors disabled:bg-poker-gray/50 disabled:cursor-not-allowed">
                    Pular
                </button>
                <button onClick={handleReset} className="px-5 py-2 text-sm font-semibold text-white bg-red-800 hover:bg-red-700 rounded-lg transition-colors">
                    Resetar
                </button>
            </div>
        </div>
    );
};

export default BlindsTimer;
