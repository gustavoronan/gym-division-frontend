export interface Exercicio {
  id: number;
  nome: string;
  series: number;
  repeticoes: string;
  concluido: boolean;
  data: string;
  exercicio_ref: string;
}

export type ExercicioInput = Pick<Exercicio, "nome" | "series" | "repeticoes"> & {
  // id do exercício no catálogo de GIFs ("" quando não vinculado).
  exercicio_ref?: string;
};
