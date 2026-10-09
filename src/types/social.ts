import type { Treino } from "./treino";

export interface Pessoa {
  id: number;
  username: string;
  first_name: string;
}

// `id` é o da amizade (usado para aceitar/recusar/remover); `usuario` é a outra pessoa.
export interface Amizade {
  id: number;
  usuario: Pessoa;
}

export interface Amigos {
  amigos: Amizade[];
  recebidos: Amizade[];
  enviados: Amizade[];
}

export interface TreinosDoAmigo {
  usuario: Pessoa;
  treinos: Treino[];
}
