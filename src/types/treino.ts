import type { ExercicioInput } from "./exercicio";

export interface Treino {
  id: number;
  nome: string;
  itens: ExercicioInput[];
}

export type TreinoInput = Omit<Treino, "id">;
