import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import PokerClubLogo from './PokerClubLogo';
import SpinnerIcon from './icons/SpinnerIcon';

const LoginImageDisplay: React.FC = () => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const imageConfigRef = doc(db, 'config', 'homepageImage');
        const unsubscribe = onSnapshot(imageConfigRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().url) {
                setImageUrl(docSnap.data().url);
            } else {
                setImageUrl(null); // Explicitly set to null if no image
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center mb-6 w-full h-[60px]">
                <SpinnerIcon />
            </div>
        );
    }

    return (
        <div className="flex justify-center mb-6">
            {imageUrl ? (
                <img src={imageUrl} alt="Destaque do Clube" className="w-full h-auto object-cover max-h-48 rounded-lg shadow-lg" />
            ) : (
                <PokerClubLogo />
            )}
        </div>
    );
};

export default LoginImageDisplay;