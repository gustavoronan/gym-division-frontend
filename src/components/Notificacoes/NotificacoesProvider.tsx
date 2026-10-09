import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { notificacoesApi } from "../../services/api";
import { nomeDe } from "../../pages/Amigos/nomeDe";
import { useToast } from "../Toast/toastContext";
import { NotificacoesContext } from "./notificacoesContext";

const INTERVALO_MS = 30_000;

// Consulta o servidor de tempos em tempos (e ao voltar para a aba) e avisa de pedidos novos.
export default function NotificacoesProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [pedidosAmizade, setPedidos] = useState(0);
  // Pedidos já anunciados, para só avisar uma vez por pedido.
  const vistos = useRef<Set<number> | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const { pedidos_amizade } = await notificacoesApi.resumo();
      setPedidos(pedidos_amizade.length);

      const anteriores = vistos.current;
      vistos.current = new Set(pedidos_amizade.map((p) => p.id));
      const novos = pedidos_amizade.filter((p) => !anteriores?.has(p.id));
      if (novos.length === 1) {
        toast.sucesso(`${nomeDe(novos[0].usuario)} quer ser seu amigo!`);
      } else if (novos.length > 1) {
        toast.sucesso(`Você tem ${novos.length} pedidos de amizade.`);
      }
    } catch {
      /* sem rede ou sessão expirada: tentamos de novo no próximo ciclo */
    }
  }, [toast]);

  useEffect(() => {
    const primeira = setTimeout(recarregar, 0);
    const timer = setInterval(recarregar, INTERVALO_MS);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") recarregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearTimeout(primeira);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [recarregar]);

  const api = useMemo(() => ({ pedidosAmizade, recarregar }), [pedidosAmizade, recarregar]);

  return <NotificacoesContext.Provider value={api}>{children}</NotificacoesContext.Provider>;
}
