import { collection, writeBatch, Timestamp, doc } from 'firebase/firestore';
import type { Player, Session, GamePlayer } from './types';
import { db } from './firebase';

const firstNames = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Fábio', 'Gisele', 'Hugo', 'Isabela', 'João'];
const lastNames = ['Silva', 'Souza', 'Costa', 'Santos', 'Oliveira', 'Pereira', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima'];

// Função para gerar um número de telefone aleatório
const generatePhone = () => {
    const ddd = Math.floor(Math.random() * 80) + 11; // DDDs do Brasil
    const firstPart = Math.floor(Math.random() * 10000) + 90000;
    const secondPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `(${ddd}) 9${firstPart}-${secondPart}`;
};

// Função para gerar jogadores
const generatePlayers = (): Omit<Player, 'id'>[] => {
    const players: Omit<Player, 'id'>[] = [];
    const usedNames = new Set<string>();

    while (players.length < 10) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;

        if (!usedNames.has(fullName)) {
            usedNames.add(fullName);
            players.push({
                name: fullName,
                whatsapp: generatePhone(),
                pixKey: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
                isActive: true,
            });
        }
    }
    return players;
};

// Função para gerar sessões de jogos
const generateSessions = (createdPlayers: Player[]): Omit<Session, 'id'>[] => {
    const sessions: Omit<Session, 'id'>[] = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 2; year <= currentYear; year++) {
        for (let month = 0; month < 12; month++) {
            // Seleciona um número aleatório de jogadores (5 a 8) para a sessão
            const sessionPlayerCount = Math.floor(Math.random() * 4) + 5;
            const shuffledPlayers = [...createdPlayers].sort(() => 0.5 - Math.random());
            const sessionParticipants = shuffledPlayers.slice(0, sessionPlayerCount);

            // Calcula o pote total e distribui as fichas finais
            let totalPot = 0;
            const gamePlayers: GamePlayer[] = sessionParticipants.map(p => {
                const totalInvested = 50 + (Math.floor(Math.random() * 5) * 50); // Investimento entre 50 e 250
                totalPot += totalInvested;
                return {
                    ...p,
                    buyIn: 50,
                    rebuys: (totalInvested - 50) / 50,
                    totalInvested,
                    finalChips: 0, // Será definido abaixo
                    paid: false,
                };
            });

            let remainingPot = totalPot;
            for (let i = 0; i < gamePlayers.length - 1; i++) {
                // Distribui uma porção aleatória do pote, garantindo que não seja tudo
                const chips = Math.floor(Math.random() * (remainingPot / 2));
                gamePlayers[i].finalChips = chips;
                remainingPot -= chips;
            }
            gamePlayers[gamePlayers.length - 1].finalChips = remainingPot; // O último jogador fica com o resto

            // Define status de pagamento
            gamePlayers.forEach(p => {
                p.paid = (p.finalChips - p.totalInvested) === 0;
            });

            const day = Math.floor(Math.random() * 28) + 1;
            const sessionDate = new Date(year, month, day);

            sessions.push({
                name: sessionDate.toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit', day: '2-digit' }),
                date: Timestamp.fromDate(sessionDate),
                players: gamePlayers,
            });
        }
    }
    return sessions;
};

export const generateAndUploadMockData = async () => {
    try {
        const batch = writeBatch(db);

        // Gerar e adicionar jogadores
        const newPlayersData = generatePlayers();
        const playerRefs = newPlayersData.map(() => doc(collection(db, 'players')));
        
        playerRefs.forEach((ref, index) => {
            batch.set(ref, newPlayersData[index]);
        });

        // Criar objetos Player com os IDs gerados para usar nas sessões
        const createdPlayers: Player[] = newPlayersData.map((data, index) => ({
            ...data,
            id: playerRefs[index].id,
        }));

        // Gerar e adicionar sessões
        const newSessionsData = generateSessions(createdPlayers);
        newSessionsData.forEach(session => {
            const sessionRef = doc(collection(db, 'sessions'));
            batch.set(sessionRef, session);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Erro ao gerar dados de teste:", error);
        return false;
    }
};