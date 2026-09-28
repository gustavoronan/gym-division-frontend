import type { ReactNode } from "react";

export function ListaSkeleton({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="lista" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function ErroEstado({
  mensagem,
  onTentar,
}: {
  mensagem: string;
  onTentar: () => void;
}) {
  return (
    <div className="estado">
      <div className="estado__icone estado__icone--erro">
        <i className="bi bi-wifi-off" />
      </div>
      <h3>Ops, algo deu errado</h3>
      <p>{mensagem}</p>
      <button className="btn btn--primary" onClick={onTentar}>
        <i className="bi bi-arrow-clockwise" /> Tentar novamente
      </button>
    </div>
  );
}

export function VazioEstado({
  icone,
  titulo,
  texto,
  children,
}: {
  icone: string;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <div className="estado">
      <div className="estado__icone">
        <i className={`bi ${icone}`} />
      </div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </div>
  );
}
