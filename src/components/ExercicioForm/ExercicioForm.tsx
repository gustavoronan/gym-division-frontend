import { useState, type FormEvent } from "react";
import type { Exercicio, ExercicioInput } from "../../types/exercicio";

interface Props {
  inicial?: Exercicio;
  onSalvar: (dados: ExercicioInput) => Promise<void>;
  onCancelar: () => void;
}

const MIN_SERIES = 1;
const MAX_SERIES = 20;

export default function ExercicioForm({ inicial, onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [series, setSeries] = useState(inicial?.series ?? 3);
  const [repeticoes, setRepeticoes] = useState(inicial?.repeticoes ?? "");
  const [salvando, setSalvando] = useState(false);

  const ajustarSeries = (delta: number) =>
    setSeries((s) => Math.min(MAX_SERIES, Math.max(MIN_SERIES, s + delta)));

  const valido = nome.trim() !== "" && repeticoes.trim() !== "";

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        nome: nome.trim(),
        series,
        repeticoes: repeticoes.trim(),
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="form" onSubmit={enviar}>
      <label className="field">
        <span>Nome do exercício</span>
        <input
          autoFocus
          value={nome}
          maxLength={100}
          placeholder="Ex.: Supino reto"
          onChange={(e) => setNome(e.target.value)}
        />
      </label>

      <div className="form__row">
        <div className="field">
          <span>Séries</span>
          <div className="stepper">
            <button
              type="button"
              onClick={() => ajustarSeries(-1)}
              disabled={series <= MIN_SERIES}
              aria-label="Diminuir séries"
            >
              <i className="bi bi-dash-lg" />
            </button>
            <output aria-live="polite">{series}</output>
            <button
              type="button"
              onClick={() => ajustarSeries(1)}
              disabled={series >= MAX_SERIES}
              aria-label="Aumentar séries"
            >
              <i className="bi bi-plus-lg" />
            </button>
          </div>
        </div>

        <label className="field">
          <span>Repetições</span>
          <input
            value={repeticoes}
            maxLength={50}
            placeholder="Ex.: 8-12"
            onChange={(e) => setRepeticoes(e.target.value)}
          />
        </label>
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valido || salvando}>
          {salvando ? "Salvando…" : inicial ? "Salvar alterações" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
