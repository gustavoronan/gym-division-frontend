// Guarda o token de login no navegador. A validade (120 dias) é imposta pelo servidor.
const CHAVE = "division.token";

export const sessao = {
  token(): string | null {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  },
  salvar(token: string) {
    try {
      localStorage.setItem(CHAVE, token);
    } catch {
      /* armazenamento indisponível: o login vale só até recarregar a página */
    }
  },
  limpar() {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* nada a limpar */
    }
  },
};

// Disparado quando o servidor recusa o token (expirado, revogado, usuário desativado).
export const EVENTO_SESSAO_EXPIRADA = "division:sessao-expirada";
