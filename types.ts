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
  players: GamePlayer[];
}

export enum View {
  LiveGame = 'AO VIVO',
  Players = 'Jogadores',
  SessionHistory = 'Histórico',
  Ranking = 'Ranking',
}
