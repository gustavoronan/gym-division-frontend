import QRCode from "qrcode";
import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import { useToast } from "../Toast/toastContext";

interface QRCodeModalProps {
  aberto: boolean;
  aoFechar: () => void;
  treinoNome: string;
  codigo: string;
}

export default function QRCodeModal({
  aberto,
  aoFechar,
  treinoNome,
  codigo,
}: QRCodeModalProps) {
  const toast = useToast();
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/compartilhar/${codigo}`
    : `https://division.app/compartilhar/${codigo}`;

  useEffect(() => {
    if (!codigo) return;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((uri) => setDataUrl(uri))
      .catch((err) => console.error("Erro ao gerar QR Code", err));
  }, [codigo, url]);

  const copiarLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiado(true);
      toast.sucesso("Link copiado para a área de transferência!");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.erro("Não foi possível copiar o link automaticamente.");
    }
  };

  const compartilharNativo = async () => {
    const texto = `Confira meu treino "${treinoNome}" no Division!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: treinoNome,
          text: texto,
          url,
        });
      } catch {
        /* usuário cancelou o compartilhamento */
      }
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${texto} Acesse: ${url}`,
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!aberto) return null;

  return (
    <Modal titulo="Compartilhar Treino" onFechar={aoFechar} centralizado>
      <div className="compartilhar-modal">
        <p className="compartilhar-modal__subtitulo">
          Qualquer pessoa pode escanear o QR Code ou acessar o link para importar
          o treino <strong>{treinoNome}</strong>, mesmo sem ter você adicionado como amigo.
        </p>

        <div className="compartilhar-modal__qr-container">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code para o treino ${treinoNome}`}
              className="compartilhar-modal__qr"
            />
          ) : (
            <div className="compartilhar-modal__qr-placeholder">
              <i className="bi bi-qr-code" />
              <span>Gerando QR Code…</span>
            </div>
          )}
        </div>

        <div className="compartilhar-modal__codigo-box">
          <span className="compartilhar-modal__label">Código público</span>
          <strong className="compartilhar-modal__codigo">{codigo}</strong>
        </div>

        <div className="compartilhar-modal__link-box">
          <input
            type="text"
            readOnly
            value={url}
            className="input compartilhar-modal__input"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            className={`btn ${copiado ? "btn--sucesso" : "btn--primary"} btn--icon-text`}
            onClick={copiarLink}
          >
            <i className={`bi ${copiado ? "bi-check-lg" : "bi-clipboard"}`} />
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="compartilhar-modal__acoes">
          <button
            type="button"
            className="btn btn--secondary btn--icon-text"
            onClick={compartilharNativo}
          >
            <i className="bi bi-share-fill" /> Compartilhar…
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={aoFechar}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
