import type { Exercicio, ExercicioInput } from "../types/exercicio";
import type { Treino, TreinoInput } from "../types/treino";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao falar com o servidor.`);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export const exerciciosApi = {
  // A API devolve os mais novos primeiro; o treino é exibido na ordem de criação.
  // Aceita tanto lista simples quanto resposta paginada do DRF ({ results }).
  async listar(): Promise<Exercicio[]> {
    const data = await request<Exercicio[] | { results: Exercicio[] }>(
      "/exercicios/",
    );
    const lista = Array.isArray(data) ? data : data.results;
    return [...lista].sort((a, b) => a.id - b.id);
  },

  criar(dados: ExercicioInput) {
    return request<Exercicio>("/exercicios/", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  atualizar(id: number, dados: Partial<Omit<Exercicio, "id" | "data">>) {
    return request<Exercicio>(`/exercicios/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
  },

  excluir(id: number) {
    return request<void>(`/exercicios/${id}/`, { method: "DELETE" });
  },
};

export const treinosApi = {
  listar() {
    return request<Treino[]>("/treinos/");
  },

  criar(dados: TreinoInput) {
    return request<Treino>("/treinos/", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  atualizar(id: number, dados: TreinoInput) {
    return request<Treino>(`/treinos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(dados),
    });
  },

  excluir(id: number) {
    return request<void>(`/treinos/${id}/`, { method: "DELETE" });
  },

  // Cria os exercícios do treino na lista atual (opcionalmente apagando os antigos).
  iniciar(id: number, substituir: boolean) {
    return request<Exercicio[]>(`/treinos/${id}/iniciar/`, {
      method: "POST",
      body: JSON.stringify({ substituir }),
    });
  },
};
