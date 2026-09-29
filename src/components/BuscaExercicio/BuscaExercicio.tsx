import { useMemo, useState } from "react";
import { useCatalogo } from "../../hooks/useCatalogo";
import { buscarNoCatalogo, urlDoGif, type ItemCatalogo } from "../../utils/catalogo";

interface Props {
  valor: string;
  exercicioRef: string;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  onDigitar: (nome: string) => void;
  onEscolher: (item: ItemCatalogo) => void;
  onLimparRef: () => void;
}

// Campo de nome com sugestões do catálogo. Digitar livremente continua permitido:
// o vínculo com o GIF só existe se a pessoa escolher uma sugestão.
export default function BuscaExercicio({
  valor,
  exercicioRef,
  placeholder,
  ariaLabel,
  autoFocus,
  onDigitar,
  onEscolher,
  onLimparRef,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const catalogo = useCatalogo();
  const sugestoes = useMemo(
    () => (aberto ? buscarNoCatalogo(catalogo, valor) : []),
    [aberto, catalogo, valor],
  );

  return (
    <div className="busca-ex">
      <input
        autoFocus={autoFocus}
        value={valor}
        maxLength={100}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onChange={(e) => {
          onDigitar(e.target.value);
          setAberto(true);
        }}
      />
      {exercicioRef && (
        <span className="busca-ex__vinculo">
          <i className="bi bi-film" /> GIF vinculado
          <button
            type="button"
            className="busca-ex__desfazer"
            onClick={onLimparRef}
            aria-label="Remover GIF vinculado"
          >
            <i className="bi bi-x" />
          </button>
        </span>
      )}
      {sugestoes.length > 0 && (
        <ul className="busca-ex__lista" role="listbox">
          {sugestoes.map((s) => (
            <li key={s.id} role="option" aria-selected={s.id === exercicioRef}>
              {/* onMouseDown evita o blur do input antes do clique registrar */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onEscolher(s);
                  setAberto(false);
                }}
              >
                <img src={urlDoGif(s)} alt="" loading="lazy" width={40} height={40} />
                <span>
                  <strong>{s.nome}</strong>
                  <small>
                    {s.alvo} · {s.equip}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
