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

export type UserRole = 'owner' | 'admin' | 'pending' | 'visitor';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
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

export interface GameDefaults {
  buyIn: number;
  rebuy: number;
}

export interface Notification {
  id: string;
  message: string;
  subMessage?: string;
  timestamp: Timestamp;
  icon?: 'user' | 'game' | 'role';
}
