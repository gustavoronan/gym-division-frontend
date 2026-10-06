import { createContext, useContext } from "react";
import type { Usuario } from "../../types/usuario";

export interface AuthApi {
  usuario: Usuario;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<AuthApi | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthGate>");
  return ctx;
}
