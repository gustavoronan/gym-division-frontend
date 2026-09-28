import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext } from "./toastContext";

interface Toast {
  id: number;
  tipo: "sucesso" | "erro";
  mensagem: string;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);

  const adicionar = useCallback((tipo: Toast["tipo"], mensagem: string) => {
    const id = proximoId.current++;
    setToasts((lista) => [...lista, { id, tipo, mensagem }]);
    setTimeout(() => setToasts((lista) => lista.filter((t) => t.id !== id)), 3500);
  }, []);

  const api = useMemo(
    () => ({
      sucesso: (m: string) => adicionar("sucesso", m),
      erro: (m: string) => adicionar("erro", m),
    }),
    [adicionar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <i
              className={`bi ${t.tipo === "sucesso" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`}
            />
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
