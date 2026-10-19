export interface Exercicio {
  id: number;
  nome: string;
  series: number;
  repeticoes: string;
  carga?: number | null;
  concluido: boolean;
  data: string;
  exercicio_ref: string;
}

export type ExercicioInput = Pick<Exercicio, "nome" | "series" | "repeticoes"> & {
  carga?: number | null;
  // id do exercício no catálogo de GIFs ("" quando não vinculado).
  exercicio_ref?: string;
};

export interface SerieRealizada {
  id?: number;
  numero: number;
  carga?: number | null;
  repeticoes?: number | null;
  concluida: boolean;
}

export interface SessaoExercicio {
  id?: number;
  nome: string;
  exercicio_ref?: string;
  chave?: string;
  series_planejadas: number;
  repeticoes: string;
  carga?: number | null;
  concluido: boolean;
  ordem?: number;
  series: SerieRealizada[];
}

export interface SessaoTreino {
  id: number;
  treino?: number | null;
  nome: string;
  data: string;
  duracao_min?: number | null;
  criada_em: string;
  total_exercicios: number;
  total_concluidos: number;
  exercicios: SessaoExercicio[];
}

export interface RecordePessoal {
  chave: string;
  nome: string;
  exercicio_ref: string;
  max_carga: number;
}

export interface EstatisticasHistorico {
  streak_atual: number;
  total_sessoes: number;
  dias_treinados_recentes: string[];
  recordes_pessoais: RecordePessoal[];
}

export interface ResumoCarga {
  chave: string;
  nome: string;
  exercicio_ref: string;
  ultima_data: string;
  ultima_carga: number | null;
  ultimas_series: SerieRealizada[];
  recorde_carga: number | null;
}

export interface ConcluirSessaoInput {
  treino_id?: number | null;
  nome: string;
  data: string;
  duracao_min?: number | null;
  iniciado_em?: string | null;
  finalizado_em?: string | null;
  limpar_exercicios_atuais?: boolean;
  exercicios: SessaoExercicio[];
}

export interface ConquistaItem {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  categoria: "treinos" | "streak" | "carga" | "volume" | "social";
  meta: number;
  progresso: number;
  percentual: number;
  desbloqueada: boolean;
}

export interface ConquistasResponse {
  total_conquistas: number;
  desbloqueadas: number;
  percentual_geral: number;
  conquistas: ConquistaItem[];
}

export interface ResumoMesExercicio {
  nome: string;
  exercicio_ref: string;
  total_series: number;
  max_carga: number;
}

export interface MesOpcao {
  ano: number;
  mes: number;
  rotulo: string;
}

export interface ResumoMes {
  ano: number;
  mes: number;
  nome_mes: string;
  usuario: {
    id: number;
    username: string;
    first_name: string;
  };
  total_treinos: number;
  dias_treinados: number;
  tempo_total_min: number;
  tempo_formatado: string;
  volume_total_kg: number;
  volume_formatado: string;
  exercicio_favorito: ResumoMesExercicio | null;
  maior_pr_mes: { exercicio: string; carga: number } | null;
  meses_disponiveis: MesOpcao[];
}
