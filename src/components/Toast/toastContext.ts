import { createContext, useContext } from "react";

export interface ToastApi {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
