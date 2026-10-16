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

export interface FeedItemExercicio {
  nome: string;
  exercicio_ref: string;
  series_count: number;
  max_carga: number | null;
}

export interface FeedItem {
  id: number;
  usuario: Pessoa;
  e_voce: boolean;
  nome: string;
  data: string;
  duracao_min: number | null;
  criada_em: string;
  total_exercicios: number;
  exercicios: FeedItemExercicio[];
  reacoes: Record<string, number>;
  minhas_reacoes: string[];
  reacoes_detalhes: Array<{ emoji: string; usuario: Pessoa }>;
}

export interface RankingItem {
  posicao: number;
  usuario: Pessoa;
  e_voce: boolean;
  dias_treinados: number;
  volume_total: number;
  total_sessoes: number;
  tempo_total_min: number;
}

export interface RankingSemanal {
  inicio_semana: string;
  fim_semana: string;
  criterio: "dias" | "volume";
  ranking: RankingItem[];
}

export interface DesafioProgresso {
  data_inicio: string;
  data_limite: string;
  treinos_concluidos: number;
  meta_treinos: number;
  dias_restantes: number;
  percentual: number;
  concluido: boolean;
}

export interface DesafioParticipanteResumo {
  usuario: Pessoa;
  e_voce: boolean;
  e_amigo: boolean;
  treinos_concluidos: number;
  percentual: number;
  concluido: boolean;
  dias_restantes: number;
}

export interface Desafio {
  id: number;
  titulo: string;
  descricao: string;
  meta_treinos: number;
  dias_duracao: number;
  icone: string;
  criador: Pessoa | null;
  total_participantes: number;
  participando: boolean;
  meu_progresso: DesafioProgresso | null;
  participantes: DesafioParticipanteResumo[];
}

export interface TreinoCompartilhadoItem {
  nome: string;
  series: number;
  repeticoes: string;
  carga: number | null;
  exercicio_ref: string;
  ordem?: number;
}

export interface TreinoCompartilhado {
  codigo: string;
  nome: string;
  dias_semana: number[];
  autor: Pessoa | null;
  total_exercicios: number;
  itens: TreinoCompartilhadoItem[];
}
