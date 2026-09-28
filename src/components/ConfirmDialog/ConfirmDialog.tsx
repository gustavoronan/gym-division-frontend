import { useState } from "react";
import Modal from "../Modal/Modal";

interface Props {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  titulo,
  mensagem,
  textoConfirmar,
  onConfirmar,
  onCancelar,
}: Props) {
  const [processando, setProcessando] = useState(false);

  const confirmar = async () => {
    setProcessando(true);
    try {
      await onConfirmar();
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Modal titulo={titulo} onFechar={onCancelar}>
      <p className="confirm__msg">{mensagem}</p>
      <div className="form__actions">
        <button className="btn btn--ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn btn--danger" onClick={confirmar} disabled={processando}>
          {processando ? "Aguarde…" : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
