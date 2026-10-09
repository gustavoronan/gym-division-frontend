import { createContext, useContext } from "react";

export interface NotificacoesApi {
  // Quantos pedidos de amizade aguardam resposta.
  pedidosAmizade: number;
  // Consulta o servidor agora (use depois de aceitar/recusar um pedido).
  recarregar: () => void;
}

export const NotificacoesContext = createContext<NotificacoesApi | null>(null);

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error("useNotificacoes precisa estar dentro de <NotificacoesProvider>");
  return ctx;
}
