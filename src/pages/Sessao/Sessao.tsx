import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GifExercicio from "../../components/GifExercicio/GifExercicio";
import Modal from "../../components/Modal/Modal";
import ProgressRing from "../../components/ProgressRing/ProgressRing";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { useExercicios } from "../../hooks/useExercicios";
import { sessoesApi, treinosApi } from "../../services/api";
import type { Exercicio, ResumoCarga } from "../../types/exercicio";
import type { Treino } from "../../types/treino";
import { calcularIntervaloMinutos, dataDeHoje, formatarHora } from "../../utils/data";

interface SerieItem {
  numero: number;
  carga: string;
  repeticoes: string;
  concluida: boolean;
}

interface ExercicioSeriesState {
  [exercicioId: number]: {
    series: SerieItem[];
    expandido: boolean;
  };
}

function construirSeriesIniciais(
  ex: Exercicio,
  resumo?: ResumoCarga,
): SerieItem[] {
  const cargaInicial =
    ex.carga !== null && ex.carga !== undefined
      ? String(ex.carga)
      : resumo?.ultima_carga !== null && resumo?.ultima_carga !== undefined
      ? String(resumo.ultima_carga)
      : "";

  const series: SerieItem[] = [];
  for (let i = 1; i <= ex.series; i++) {
    series.push({
      numero: i,
      carga: cargaInicial,
      repeticoes: ex.repeticoes || "10",
      concluida: ex.concluido,
    });
  }
  return series;
}

export default function Sessao() {
  const {
    exercicios,
    carregando,
    erro,
    recarregar,
    definirConcluido,
    reiniciar,
  } = useExercicios();
  const toast = useToast();
  const navigate = useNavigate();

  // Estado de séries locais (cargas e reps por série)
  const [seriesState, setSeriesState] = useState<ExercicioSeriesState>({});
  // Mapa de últimas cargas do usuário
  const [ultimasCargas, setUltimasCargas] = useState<Record<string, ResumoCarga>>({});
  // Sugestão de treino para hoje se a lista estiver vazia
  const [sugestaoHoje, setSugestaoHoje] = useState<{
    sugerido: Treino | null;
    nome_dia: string;
  } | null>(null);

  // Momento em que o usuário clicou em "Iniciar treino"
  const [iniciadoEm, setIniciadoEm] = useState<string | null>(() =>
    localStorage.getItem("treino_iniciado_em"),
  );
  const [finalizando, setFinalizando] = useState(false);
  const [modalConcluir, setModalConcluir] = useState(false);
  const [limparAoConcluir, setLimparAoConcluir] = useState(true);
  const [reiniciando, setReiniciando] = useState(false);
  const [iniciandoSugerido, setIniciandoSugerido] = useState(false);

  // Carrega últimas cargas e sugestão do dia
  useEffect(() => {
    sessoesApi
      .ultimasCargas()
      .then(setUltimasCargas)
      .catch(() => {});

    treinosApi
      .sugestaoHoje()
      .then(setSugestaoHoje)
      .catch(() => {});
  }, []);

  const obterSeries = useCallback(
    (ex: Exercicio): SerieItem[] => {
      const custom = seriesState[ex.id]?.series;
      if (custom) return custom;
      const chave = ex.exercicio_ref
        ? `ref:${ex.exercicio_ref}`
        : `nome:${ex.nome.toLowerCase()}`;
      return construirSeriesIniciais(ex, ultimasCargas[chave]);
    },
    [seriesState, ultimasCargas],
  );

  const total = exercicios.length;
  const feitos = exercicios.filter((e) => e.concluido).length;
  const terminou = total > 0 && feitos === total;

  const alternarExercicio = async (id: number, concluido: boolean) => {
    try {
      await definirConcluido(id, concluido);
      const ex = exercicios.find((e) => e.id === id);
      if (!ex) return;
      const base = obterSeries(ex);
      setSeriesState((prev) => ({
        ...prev,
        [id]: {
          expandido: prev[id]?.expandido ?? false,
          series: base.map((s) => ({ ...s, concluida: concluido })),
        },
      }));
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const alternarSerie = async (exId: number, numSerie: number) => {
    const ex = exercicios.find((e) => e.id === exId);
    if (!ex) return;
    const base = obterSeries(ex);
    const novasSeries = base.map((s) =>
      s.numero === numSerie ? { ...s, concluida: !s.concluida } : s,
    );

    const todasFeitas = novasSeries.every((s) => s.concluida);

    setSeriesState((prev) => ({
      ...prev,
      [exId]: {
        expandido: prev[exId]?.expandido ?? true,
        series: novasSeries,
      },
    }));

    if (ex.concluido !== todasFeitas) {
      try {
        await definirConcluido(exId, todasFeitas);
      } catch (e) {
        toast.erro((e as Error).message);
      }
    }

    const serieFoiMarcada = novasSeries.find((s) => s.numero === numSerie)?.concluida;
    if (serieFoiMarcada && !iniciadoEm) {
      const agoraIso = new Date().toISOString();
      localStorage.setItem("treino_iniciado_em", agoraIso);
      setIniciadoEm(agoraIso);
    }
  };

  const atualizarCargaSerie = (exId: number, numSerie: number, carga: string) => {
    const ex = exercicios.find((e) => e.id === exId);
    if (!ex) return;
    const base = obterSeries(ex);
    setSeriesState((prev) => ({
      ...prev,
      [exId]: {
        expandido: prev[exId]?.expandido ?? true,
        series: base.map((s) => (s.numero === numSerie ? { ...s, carga } : s)),
      },
    }));
  };

  const atualizarRepsSerie = (exId: number, numSerie: number, repeticoes: string) => {
    const ex = exercicios.find((e) => e.id === exId);
    if (!ex) return;
    const base = obterSeries(ex);
    setSeriesState((prev) => ({
      ...prev,
      [exId]: {
        expandido: prev[exId]?.expandido ?? true,
        series: base.map((s) => (s.numero === numSerie ? { ...s, repeticoes } : s)),
      },
    }));
  };

  const alternarExpandido = (exId: number) => {
    const ex = exercicios.find((e) => e.id === exId);
    if (!ex) return;
    setSeriesState((prev) => ({
      ...prev,
      [exId]: {
        series: prev[exId]?.series ?? obterSeries(ex),
        expandido: !(prev[exId]?.expandido ?? false),
      },
    }));
  };

  const carregarSugerido = async () => {
    if (!sugestaoHoje?.sugerido) return;
    setIniciandoSugerido(true);
    try {
      await treinosApi.iniciar(sugestaoHoje.sugerido.id, true);
      const agoraIso = new Date().toISOString();
      localStorage.setItem("treino_iniciado_em", agoraIso);
      setIniciadoEm(agoraIso);
      toast.sucesso(`Treino ${sugestaoHoje.sugerido.nome} iniciado!`);
      recarregar();
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setIniciandoSugerido(false);
    }
  };

  const iniciarTreino = () => {
    const agoraIso = new Date().toISOString();
    localStorage.setItem("treino_iniciado_em", agoraIso);
    setIniciadoEm(agoraIso);
    toast.sucesso("Treino iniciado! Registre ao concluir. 💪");
  };

  const recomecar = async () => {
    setReiniciando(true);
    try {
      await reiniciar();
      localStorage.removeItem("treino_iniciado_em");
      setIniciadoEm(null);
      setSeriesState({});
      toast.sucesso("Treino reiniciado. Clique em 'Iniciar treino' quando começar!");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setReiniciando(false);
    }
  };

  const salvarNoHistorico = async () => {
    setFinalizando(true);
    try {
      const hojeIso = new Date().toISOString().split("T")[0];
      const fim = new Date();
      const duracaoMin = iniciadoEm ? calcularIntervaloMinutos(iniciadoEm, fim) : 1;

      const payload = {
        nome: "Treino do dia",
        data: hojeIso,
        duracao_min: duracaoMin,
        iniciado_em: iniciadoEm,
        finalizado_em: fim.toISOString(),
        limpar_exercicios_atuais: limparAoConcluir,
        exercicios: exercicios.map((ex, ordem) => {
          const series = obterSeries(ex).map((s: SerieItem) => ({
            numero: s.numero,
            carga: s.carga.trim() !== "" ? Number(s.carga) : null,
            repeticoes: s.repeticoes.trim() !== "" ? Number(s.repeticoes) : null,
            concluida: s.concluida,
          }));

          return {
            nome: ex.nome,
            exercicio_ref: ex.exercicio_ref,
            series_planejadas: ex.series,
            repeticoes: ex.repeticoes,
            carga: ex.carga,
            concluido: ex.concluido,
            ordem,
            series,
          };
        }),
      };

      await sessoesApi.concluir(payload);
      localStorage.removeItem("treino_iniciado_em");
      setIniciadoEm(null);
      toast.sucesso("Treino registrado no histórico! Sequência mantida! 🔥");
      setModalConcluir(false);
      navigate("/historico");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Treino de hoje</h1>
          <p>{dataDeHoje()}</p>
        </div>
        <div className="header-acoes">
          {iniciadoEm && (
            <span className="treino-em-andamento-badge" title="Horário em que o treino foi iniciado">
              <i className="bi bi-play-circle-fill" /> Iniciado às {formatarHora(iniciadoEm)}
            </span>
          )}
          <Link
            to="/historico"
            className="icon-btn"
            aria-label="Histórico de treinos"
            title="Ver histórico"
          >
            <i className="bi bi-clock-history" />
          </Link>
        </div>
      </header>

      {carregando ? (
        <ListaSkeleton />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : total === 0 ? (
        <div className="sessao-vazia-container">
          {sugestaoHoje?.sugerido ? (
            <section className="card banner-sugestao">
              <div className="banner-sugestao__icone">
                <i className="bi bi-calendar-check" />
              </div>
              <div className="banner-sugestao__conteudo">
                <span className="banner-sugestao__tag">
                  💡 Sugestão para hoje ({sugestaoHoje.nome_dia})
                </span>
                <strong>{sugestaoHoje.sugerido.nome}</strong>
                <p>
                  {sugestaoHoje.sugerido.itens.length} exercícios planejados. Ocorreu imprevisto?
                  Você pode escolher outro treino quando quiser!
                </p>
                <div className="banner-sugestao__acoes">
                  <button
                    className="btn btn--primary"
                    onClick={carregarSugerido}
                    disabled={iniciandoSugerido}
                  >
                    <i className="bi bi-play-fill" /> Iniciar treino sugerido
                  </button>
                  <Link to="/treinos" className="btn btn--ghost">
                    Ver todos os treinos
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <VazioEstado
              icone="bi-clipboard2-plus"
              titulo="Seu treino está vazio"
              texto="Carregue um dos seus treinos salvos ou cadastre exercícios para treinar hoje."
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/treinos" className="btn btn--primary">
                  <i className="bi bi-collection-fill" /> Escolher treino salvo
                </Link>
                <Link to="/" className="btn btn--ghost">
                  <i className="bi bi-plus-lg" /> Cadastrar exercícios
                </Link>
              </div>
            </VazioEstado>
          )}
        </div>
      ) : (
        <>
          {/* Card Resumo do Treino */}
          <section className={`card resumo ${terminou ? "resumo--completo" : ""}`}>
            <ProgressRing feitos={feitos} total={total} />
            <div className="resumo__texto">
              {terminou ? (
                <>
                  <strong>
                    <i className="bi bi-trophy-fill" /> Treino concluído!
                  </strong>
                  <span>Excelente trabalho! Salve no histórico para contar o streak.</span>
                </>
              ) : (
                <>
                  <strong>
                    {feitos} de {total} concluídos
                  </strong>
                  <span>
                    {feitos === 0
                      ? "Marque as séries ou exercícios à medida que treinar."
                      : `Faltam ${total - feitos} exercícios — mantenha o foco!`}
                  </span>
                </>
              )}
            </div>
          </section>

          {/* Botão de Iniciar ou Registrar Treino */}
          {!iniciadoEm ? (
            <button
              type="button"
              className="btn btn--primary btn--block btn--iniciar-treino"
              onClick={iniciarTreino}
            >
              <i className="bi bi-play-fill" /> Iniciar treino
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block btn--finalizar"
              onClick={() => setModalConcluir(true)}
            >
              <i className="bi bi-check2-all" /> Registrar treino
            </button>
          )}

          {/* Lista de Exercícios Ativos com Carga e Séries */}
          <ul className="lista">
            {exercicios.map((e) => {
              const chave = e.exercicio_ref
                ? `ref:${e.exercicio_ref}`
                : `nome:${e.nome.toLowerCase()}`;
              const historico = ultimasCargas[chave];
              const st = seriesState[e.id];
              const expandido = st?.expandido ?? false;
              const series = obterSeries(e);

              return (
                <li key={e.id} className="card exercicio-sessao">
                  <div className="exercicio-sessao__topo">
                    <button
                      type="button"
                      className={`check-botao ${e.concluido ? "check-botao--feito" : ""}`}
                      onClick={() => alternarExercicio(e.id, !e.concluido)}
                      aria-pressed={e.concluido}
                      aria-label={`Marcar ${e.nome} como concluído`}
                    >
                      <span className="check__caixa">
                        <i className="bi bi-check-lg" />
                      </span>
                    </button>

                    <div
                      className="exercicio-sessao__info"
                      onClick={() => alternarExpandido(e.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <strong className={e.concluido ? "texto--riscado" : ""}>
                        {e.nome}
                      </strong>
                      <div className="exercicio-sessao__metas">
                        <span>
                          {e.series} {e.series === 1 ? "série" : "séries"} × {e.repeticoes}
                        </span>
                        {e.carga ? <span className="tag-carga">{e.carga} kg</span> : null}
                        {historico?.ultima_carga ? (
                          <span className="tag-historico" title="Última carga registrada">
                            Última: {historico.ultima_carga} kg
                          </span>
                        ) : null}
                        {historico?.recorde_carga ? (
                          <span className="tag-recorde" title="Recorde pessoal">
                            🏆 PR: {historico.recorde_carga} kg
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="exercicio-sessao__acoes-lado">
                      {e.exercicio_ref && (
                        <GifExercicio exercicioRef={e.exercicio_ref} nome={e.nome} />
                      )}
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        onClick={() => alternarExpandido(e.id)}
                        aria-label="Ver séries e cargas"
                        title="Ver séries"
                      >
                        <i className={`bi ${expandido ? "bi-chevron-up" : "bi-chevron-down"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Painel de Séries Detalhadas (Carga e Repetições) */}
                  {expandido && (
                    <div className="exercicio-sessao__series">
                      <div className="series-cabecalho">
                        <span>Série</span>
                        <span>Carga (kg)</span>
                        <span>Reps</span>
                        <span>Feito</span>
                      </div>
                      <ul className="series-lista">
                        {series.map((s) => (
                          <li
                            key={s.numero}
                            className={`serie-linha ${s.concluida ? "serie-linha--feita" : ""}`}
                          >
                            <span className="serie-num">#{s.numero}</span>
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={999}
                              value={s.carga}
                              placeholder="kg"
                              aria-label={`Carga da série ${s.numero}`}
                              onChange={(ev) =>
                                atualizarCargaSerie(e.id, s.numero, ev.target.value)
                              }
                            />
                            <input
                              type="text"
                              value={s.repeticoes}
                              placeholder="reps"
                              aria-label={`Repetições da série ${s.numero}`}
                              onChange={(ev) =>
                                atualizarRepsSerie(e.id, s.numero, ev.target.value)
                              }
                            />
                            <button
                              type="button"
                              className={`serie-check ${s.concluida ? "serie-check--feita" : ""}`}
                              onClick={() => alternarSerie(e.id, s.numero)}
                              aria-label={`Concluir série ${s.numero}`}
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="sessao-rodape-acoes">
            <Link to="/treinos" className="btn btn--ghost btn--sm">
              <i className="bi bi-arrow-left-right" /> Trocar treino
            </Link>
            {feitos > 0 && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={recomecar}
                disabled={reiniciando}
              >
                <i className="bi bi-arrow-counterclockwise" />{" "}
                {reiniciando ? "Reiniciando…" : "Reiniciar checks"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal de Finalizar e Registrar Treino no Histórico */}
      {modalConcluir && (
        <Modal titulo="Registrar treino 🎉" onFechar={() => setModalConcluir(false)}>
          <div className="modal-finalizar">
            <p className="modal-finalizar__msg">
              Ótimo treino! Deseja registrar este treino no seu histórico para manter sua ofensiva ativa?
            </p>

            <div className="modal-finalizar__resumo-box">
              <div className="resumo-box__item">
                <i className="bi bi-clock-history" />
                <div>
                  <strong>{iniciadoEm ? calcularIntervaloMinutos(iniciadoEm) : 1} min</strong>
                  <span>
                    {iniciadoEm
                      ? `Intervalo (${formatarHora(iniciadoEm)} às ${formatarHora(new Date())})`
                      : "Duração calculada"}
                  </span>
                </div>
              </div>
              <div className="resumo-box__item">
                <i className="bi bi-check-circle" />
                <div>
                  <strong>{feitos} de {total}</strong>
                  <span>Exercícios concluídos</span>
                </div>
              </div>
            </div>

            <label className="check" style={{ margin: "14px 0" }}>
              <input
                type="checkbox"
                checked={limparAoConcluir}
                onChange={(ev) => setLimparAoConcluir(ev.target.checked)}
              />
              <span>Limpar lista de exercícios para o próximo treino</span>
            </label>

            <div className="form__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setModalConcluir(false)}
                disabled={finalizando}
              >
                Continuar treinando
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={salvarNoHistorico}
                disabled={finalizando}
              >
                {finalizando ? "Registrando…" : "Registrar treino"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
