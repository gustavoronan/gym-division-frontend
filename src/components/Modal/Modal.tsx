import { useEffect, type ReactNode } from "react";

interface Props {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export default function Modal({ titulo, onFechar, children }: Props) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [onFechar]);

  return (
    <div className="modal-overlay" onMouseDown={onFechar}>
      <div
        className="modal-sheet"
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
    </div>
  );
}
