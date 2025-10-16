import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import EditIcon from './icons/EditIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import PlusIcon from './icons/PlusIcon';

interface HomepageImageManagerProps {
    isUserOwner: boolean;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const HomepageImageManager: React.FC<HomepageImageManagerProps> = ({ isUserOwner, showToast }) => {
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
        if (!isUserOwner) return;
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isUserOwner) return;
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
        }
    };
    
    if (isLoading && !imageUrl) {
        return (
            <div className="flex items-center justify-center w-full h-48 bg-poker-light rounded-lg shadow-xl">
                 <SpinnerIcon />
            </div>
        );
    }

    // Don't render anything for non-owners if no image is set
    if (!imageUrl && !isUserOwner) {
        return null;
    }

    return (
        <div className="relative w-full">
            {isUserOwner && (
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                />
            )}

            {imageUrl ? (
                <div
                    className={`relative group rounded-lg shadow-xl overflow-hidden ${isUserOwner ? 'cursor-pointer' : ''}`}
                    onClick={handleFileSelect}
                    role={isUserOwner ? 'button' : undefined}
                    tabIndex={isUserOwner ? 0 : -1}
                    aria-label={isUserOwner ? 'Clique para alterar a imagem' : 'Imagem da página inicial'}
                >
                    <img src={imageUrl} alt="Destaque do Clube" className="w-full h-auto object-cover max-h-80" />
                    {isUserOwner && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             {isLoading ? <SpinnerIcon /> : <EditIcon />}
                             <span className="ml-2 text-white font-bold">{isLoading ? 'Enviando...' : 'Alterar Imagem'}</span>
                        </div>
                    )}
                </div>
            ) : (
                isUserOwner && (
                    <div
                        onClick={handleFileSelect}
                        role="button"
                        tabIndex={0}
                        aria-label="Clique para carregar uma imagem"
                        className="flex flex-col items-center justify-center w-full h-48 bg-poker-light border-2 border-dashed border-poker-gray rounded-lg shadow-xl cursor-pointer hover:bg-poker-dark transition-colors"
                    >
                         {isLoading ? <SpinnerIcon /> : (
                            <>
                                <div className="w-12 h-12 text-poker-gray"><PlusIcon/></div>
                                <p className="text-poker-gray font-semibold">Carregar Imagem de Destaque</p>
                                <p className="text-xs text-poker-gray/70">Clique aqui para selecionar um arquivo</p>
                            </>
                         )}
                    </div>
                )
            )}
        </div>
    );
};

export default HomepageImageManager;