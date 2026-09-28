export interface Exercicio {
  id: number;
  nome: string;
  series: number;
  repeticoes: string;
  concluido: boolean;
  data: string;
}

export type ExercicioInput = Pick<Exercicio, "nome" | "series" | "repeticoes">;
