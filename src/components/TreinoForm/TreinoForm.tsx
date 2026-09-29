import { useState, type FormEvent } from "react";
import BuscaExercicio from "../BuscaExercicio/BuscaExercicio";
import type { ExercicioInput } from "../../types/exercicio";
import type { TreinoInput } from "../../types/treino";

interface Props {
  inicial?: TreinoInput;
  // Exercícios atuais que podem ser importados para dentro do treino.
  importaveis?: ExercicioInput[];
  textoSalvar: string;
  onSalvar: (dados: TreinoInput) => Promise<void>;
  onCancelar: () => void;
}

interface Linha {
  chave: number;
  nome: string;
  series: string;
  repeticoes: string;
  exercicioRef: string;
}

let proximaChave = 0;

const novaLinha = (item?: ExercicioInput): Linha => ({
  chave: proximaChave++,
  nome: item?.nome ?? "",
  series: String(item?.series ?? 3),
  repeticoes: item?.repeticoes ?? "",
  exercicioRef: item?.exercicio_ref ?? "",
});

const seriesValidas = (texto: string) => {
  const n = Number(texto);
  return Number.isInteger(n) && n >= 1 && n <= 20;
};

export default function TreinoForm({
  inicial,
  importaveis = [],
  textoSalvar,
  onSalvar,
  onCancelar,
}: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    inicial?.itens.length ? inicial.itens.map((i) => novaLinha(i)) : [novaLinha()],
  );
  const [salvando, setSalvando] = useState(false);

  const atualizar = (chave: number, campo: keyof Linha, valor: string) =>
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));

  const remover = (chave: number) =>
    setLinhas((ls) => ls.filter((l) => l.chave !== chave));

  const importar = () =>
    setLinhas((ls) => [
      ...ls.filter((l) => l.nome.trim() !== "" || l.repeticoes.trim() !== ""),
      ...importaveis.map((i) => novaLinha(i)),
    ]);

  const valido =
    nome.trim() !== "" &&
    linhas.length > 0 &&
    linhas.every(
      (l) => l.nome.trim() !== "" && l.repeticoes.trim() !== "" && seriesValidas(l.series),
    );

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        nome: nome.trim(),
        itens: linhas.map((l) => ({
          nome: l.nome.trim(),
          series: Number(l.series),
          repeticoes: l.repeticoes.trim(),
          exercicio_ref: l.exercicioRef,
        })),
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="form" onSubmit={enviar}>
      <label className="field">
        <span>Nome do treino</span>
        <input
          autoFocus
          value={nome}
          maxLength={60}
          placeholder="Ex.: Perna A"
          onChange={(e) => setNome(e.target.value)}
        />
      </label>

      <div className="field">
        <span>Exercícios ({linhas.length})</span>
        <ul className="linhas">
          {linhas.map((l, i) => (
            <li key={l.chave} className="linha">
              <BuscaExercicio
                valor={l.nome}
                exercicioRef={l.exercicioRef}
                placeholder={`Exercício ${i + 1}`}
                ariaLabel={`Nome do exercício ${i + 1}`}
                onDigitar={(nome) => atualizar(l.chave, "nome", nome)}
                onEscolher={(item) =>
                  setLinhas((ls) =>
                    ls.map((x) =>
                      x.chave === l.chave ? { ...x, nome: item.nome, exercicioRef: item.id } : x,
                    ),
                  )
                }
                onLimparRef={() => atualizar(l.chave, "exercicioRef", "")}
              />
              <div className="linha__detalhes">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  value={l.series}
                  aria-label={`Séries do exercício ${i + 1}`}
                  onChange={(e) => atualizar(l.chave, "series", e.target.value)}
                />
                <span className="linha__x">×</span>
                <input
                  value={l.repeticoes}
                  maxLength={50}
                  placeholder="8-12"
                  aria-label={`Repetições do exercício ${i + 1}`}
                  onChange={(e) => atualizar(l.chave, "repeticoes", e.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={() => remover(l.chave)}
                  aria-label={`Remover exercício ${i + 1}`}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="form__extras">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setLinhas((ls) => [...ls, novaLinha()])}
          >
            <i className="bi bi-plus-lg" /> Adicionar exercício
          </button>
          {importaveis.length > 0 && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={importar}>
              <i className="bi bi-box-arrow-in-down" /> Importar atuais ({importaveis.length})
            </button>
          )}
        </div>
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valido || salvando}>
          {salvando ? "Salvando…" : textoSalvar}
        </button>
      </div>
    </form>
  );
}
