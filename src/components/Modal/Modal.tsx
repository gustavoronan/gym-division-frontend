import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  titulo: string;
  onFechar: () => void;
  // Abre no centro da tela (lightbox) em vez de subir da base.
  centralizado?: boolean;
  children: ReactNode;
}

export default function Modal({ titulo, onFechar, centralizado, children }: Props) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [onFechar]);

  // No body, para o overlay cobrir a tela mesmo se um ancestral tiver transform.
  return createPortal(
    <div
      className={`modal-overlay ${centralizado ? "modal-overlay--centro" : ""}`}
      onMouseDown={onFechar}
    >
      <div
        className={`modal-sheet ${centralizado ? "modal-sheet--centro" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-grip" />
        <header className="modal-header">
          <h2>{titulo}</h2>
          <button className="icon-btn" onClick={onFechar} aria-label="Fechar">
            <i className="bi bi-x-lg" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
