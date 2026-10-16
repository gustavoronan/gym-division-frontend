import type { ExercicioInput } from "./exercicio";

export interface Treino {
  id: number;
  nome: string;
  itens: ExercicioInput[];
  // Dias da semana sugeridos (0=Domingo, 1=Segunda ... 6=Sábado).
  // Sugestão flexível: o usuário pode treinar qualquer treino no dia que preferir.
  dias_semana?: number[];
  codigo_compartilhamento?: string;
}

export type TreinoInput = Omit<Treino, "id">;
