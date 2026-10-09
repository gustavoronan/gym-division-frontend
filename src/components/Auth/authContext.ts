import { createContext, useContext } from "react";
import type { Usuario } from "../../types/usuario";

export interface AuthApi {
  usuario: Usuario;
  sair: () => Promise<void>;
  // Substitui o usuário em memória depois de editar o perfil.
  atualizar: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthApi | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthGate>");
  return ctx;
}
