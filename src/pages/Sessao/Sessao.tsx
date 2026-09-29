import { useState } from "react";
import { Link } from "react-router-dom";
import GifExercicio from "../../components/GifExercicio/GifExercicio";
import ProgressRing from "../../components/ProgressRing/ProgressRing";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { useExercicios } from "../../hooks/useExercicios";
import { dataDeHoje } from "../../utils/data";

export default function Sessao() {
  const { exercicios, carregando, erro, recarregar, definirConcluido, reiniciar } =
    useExercicios();
  const toast = useToast();
  const [reiniciando, setReiniciando] = useState(false);

  const total = exercicios.length;
  const feitos = exercicios.filter((e) => e.concluido).length;
  const terminou = total > 0 && feitos === total;

  const alternar = async (id: number, concluido: boolean) => {
    try {
      await definirConcluido(id, concluido);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const recomecar = async () => {
    setReiniciando(true);
    try {
      await reiniciar();
      toast.sucesso("Treino reiniciado. Bom treino!");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setReiniciando(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Treino de hoje</h1>
          <p>{dataDeHoje()}</p>
        </div>
      </header>

      {carregando ? (
        <ListaSkeleton />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : total === 0 ? (
        <VazioEstado
          icone="bi-clipboard2-plus"
          titulo="Seu treino está vazio"
          texto="Adicione exercícios para começar a marcar o que já foi feito."
        >
          <Link to="/" className="btn btn--primary">
            <i className="bi bi-plus-lg" /> Cadastrar exercícios
          </Link>
        </VazioEstado>
      ) : (
        <>
          <section className={`card resumo ${terminou ? "resumo--completo" : ""}`}>
            <ProgressRing feitos={feitos} total={total} />
            <div className="resumo__texto">
              {terminou ? (
                <>
                  <strong>
                    <i className="bi bi-trophy-fill" /> Treino concluído!
                  </strong>
                  <span>Missão cumprida. Descanse e hidrate-se.</span>
                </>
              ) : (
                <>
                  <strong>
                    {feitos} de {total} concluídos
                  </strong>
                  <span>
                    {feitos === 0
                      ? "Toque em um exercício para marcá-lo."
                      : `Faltam ${total - feitos} — continue assim!`}
                  </span>
                </>
              )}
            </div>
          </section>

          <ul className="lista">
            {exercicios.map((e) => (
              <li key={e.id} className="sessao-item">
                <button
                  className={`card check ${e.concluido ? "check--feito" : ""} ${e.exercicio_ref ? "check--com-gif" : ""}`}
                  onClick={() => alternar(e.id, !e.concluido)}
                  aria-pressed={e.concluido}
                >
                  <span className="check__caixa">
                    <i className="bi bi-check-lg" />
                  </span>
                  <span className="check__info">
                    <strong>{e.nome}</strong>
                    <span>
                      {e.series} {e.series === 1 ? "série" : "séries"} ×{" "}
                      {e.repeticoes}
                    </span>
                  </span>
                </button>
                {e.exercicio_ref && (
                  <div className="sessao-item__gif">
                    <GifExercicio exercicioRef={e.exercicio_ref} nome={e.nome} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {feitos > 0 && (
            <button
              className="btn btn--ghost btn--block"
              onClick={recomecar}
              disabled={reiniciando}
            >
              <i className="bi bi-arrow-counterclockwise" />{" "}
              {reiniciando ? "Reiniciando…" : "Reiniciar treino"}
            </button>
          )}
        </>
      )}
    </>
  );
}
