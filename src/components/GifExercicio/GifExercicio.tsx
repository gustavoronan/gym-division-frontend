import { useState } from "react";
import { useItemCatalogo } from "../../hooks/useCatalogo";
import { CREDITO_GIFS, urlDoGif } from "../../utils/catalogo";
import Modal from "../Modal/Modal";

interface Props {
  exercicioRef?: string;
  nome: string;
}

// Miniatura que abre o GIF de execução. Sem exercicioRef (ou fora do catálogo) não renderiza nada.
export default function GifExercicio({ exercicioRef, nome }: Props) {
  const item = useItemCatalogo(exercicioRef);
  const [aberto, setAberto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  if (!item || falhou) return null;

  return (
    <>
      <button
        type="button"
        className="gif-thumb"
        onClick={(e) => {
          e.stopPropagation();
          setAberto(true);
        }}
        aria-label={`Ver execução de ${nome}`}
      >
        <img
          src={urlDoGif(item)}
          alt=""
          loading="lazy"
          width={56}
          height={56}
          onError={() => setFalhou(true)}
        />
        <i className="bi bi-play-fill gif-thumb__play" />
      </button>

      {aberto && (
        <Modal titulo={item.nome} centralizado onFechar={() => setAberto(false)}>
          <div className="gif-demo">
            <img src={urlDoGif(item)} alt={`Execução de ${item.nome}`} width={180} height={180} />
            <p>
              {item.alvo} · {item.equip}
            </p>
            <small>{CREDITO_GIFS}</small>
          </div>
        </Modal>
      )}
    </>
  );
}
