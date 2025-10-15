import type { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  whatsapp: string;
  pixKey: string;
  isActive: boolean;
}

export interface GamePlayer extends Player {
  buyIn: number;
  rebuys: number;
  totalInvested: number;
  finalChips: number;
  paid?: boolean;
}

export interface Session {
  id: string;
  name: string;
  date: Timestamp;
  players: GamePlayer[];
}

export enum View {
  LiveGame = 'AO VIVO',
  Players = 'Jogadores',
  SessionHistory = 'Histórico',
  Ranking = 'Ranking',
  PlayerProfile = 'Perfil do Jogador',
  Cashier = 'Caixa',
  Settings = 'Configurações',
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}
