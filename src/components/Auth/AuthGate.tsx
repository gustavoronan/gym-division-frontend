import { useCallback, useEffect, useState, type ReactNode } from "react";
import Login from "../../pages/Login/Login";
import { authApi } from "../../services/api";
import { EVENTO_SESSAO_EXPIRADA, sessao } from "../../services/sessao";
import type { Usuario } from "../../types/usuario";
import { AuthContext } from "./authContext";

// Só renderiza o app depois de confirmar o login; senão mostra a tela de login.
export default function AuthGate({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(() => sessao.token() !== null);

  useEffect(() => {
    if (!sessao.token()) return;
    let ativo = true;
    authApi
      .eu()
      .then((u) => ativo && setUsuario(u))
      // 401 já limpa o token; em falha de rede cai na tela de login.
      .catch(() => {})
      .finally(() => ativo && setVerificando(false));
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const entrar = useCallback((token: string, u: Usuario) => {
    sessao.salvar(token);
    setUsuario(u);
  }, []);

  const sair = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* sem rede ou token já inválido: encerramos localmente do mesmo jeito */
    }
    sessao.limpar();
    setUsuario(null);
  }, []);

  if (verificando) {
    return (
      <div className="login">
        <p className="login__carregando" aria-busy="true">
          Carregando…
        </p>
      </div>
    );
  }

  if (!usuario) return <Login onEntrar={entrar} />;

  return <AuthContext.Provider value={{ usuario, sair }}>{children}</AuthContext.Provider>;
}
