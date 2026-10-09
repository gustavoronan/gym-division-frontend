import type { Exercicio, ExercicioInput } from "../types/exercicio";
import type { Amigos, Amizade, TreinosDoAmigo } from "../types/social";
import type { Treino, TreinoInput } from "../types/treino";
import type { Usuario, UsuarioInput } from "../types/usuario";
import { EVENTO_SESSAO_EXPIRADA, sessao } from "./sessao";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

// Extrai a mensagem do corpo de erro do DRF ({ detail } ou { campo: ["msg"] }).
async function mensagemDeErro(response: Response): Promise<string> {
  try {
    const corpo = await response.json();
    if (typeof corpo?.detail === "string") return corpo.detail;
    const primeiro = Object.values(corpo ?? {}).flat()[0];
    if (typeof primeiro === "string") return primeiro;
  } catch {
    /* corpo vazio ou não-JSON */
  }
  return `Erro ${response.status} ao falar com o servidor.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessao.token();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  if (!response.ok) {
    // 401 com token enviado = sessão inválida; a tela de login assume.
    if (response.status === 401 && token) {
      sessao.limpar();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new Error(await mensagemDeErro(response));
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export const authApi = {
  login(username: string, password: string) {
    return request<{ token: string; usuario: Usuario }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  eu() {
    return request<Usuario>("/auth/me/");
  },

  logout() {
    return request<void>("/auth/logout/", { method: "POST" });
  },
};

export const usuariosApi = {
  listar() {
    return request<Usuario[]>("/usuarios/");
  },

  criar(dados: UsuarioInput) {
    return request<Usuario>("/usuarios/", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  atualizar(id: number, dados: Partial<UsuarioInput>) {
    return request<Usuario>(`/usuarios/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
  },

  excluir(id: number) {
    return request<void>(`/usuarios/${id}/`, { method: "DELETE" });
  },
};

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

export const amigosApi = {
  listar() {
    return request<Amigos>("/amigos/");
  },

  // Envia o pedido; se a pessoa já tinha pedido, a amizade é aceita na hora.
  adicionar(username: string) {
    return request<Amizade>("/amigos/", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  },

  aceitar(amizadeId: number) {
    return request<Amizade>(`/amizades/${amizadeId}/aceitar/`, { method: "POST" });
  },

  // Remove amigo, recusa pedido recebido ou cancela pedido enviado.
  remover(amizadeId: number) {
    return request<void>(`/amizades/${amizadeId}/`, { method: "DELETE" });
  },

  treinos(usuarioId: number) {
    return request<TreinosDoAmigo>(`/amigos/${usuarioId}/treinos/`);
  },

  // Copia os treinos escolhidos (ou todos) do amigo para os meus.
  copiar(usuarioId: number, selecao: number[] | "todos") {
    return request<Treino[]>(`/amigos/${usuarioId}/copiar/`, {
      method: "POST",
      body: JSON.stringify(
        selecao === "todos" ? { todos: true } : { treinos: selecao },
      ),
    });
  },
};
