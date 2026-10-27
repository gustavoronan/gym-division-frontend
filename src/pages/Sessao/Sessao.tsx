import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Auth/authContext";
import GifExercicio from "../../components/GifExercicio/GifExercicio";
import Modal from "../../components/Modal/Modal";
import ProgressRing from "../../components/ProgressRing/ProgressRing";
import StoryImediatoModal, {
  type StoryImediatoDados,
} from "../../components/StoryImediato/StoryImediatoModal";
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

export function parseCargaNumero(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const limpo = String(val).trim().replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

export function parseRepsNumero(val: string | number | null | undefined, defaultVal = 10): number {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === "number") return isNaN(val) ? defaultVal : val;
  const str = String(val).trim();
  const matches = str.match(/\d+/g);
  if (!matches || matches.length === 0) return defaultVal;
  const nums = matches.map(Number);
  if (nums.length === 1) return nums[0] > 0 ? nums[0] : defaultVal;
  if (str.includes("-") || str.includes(" a ")) {
    const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    return avg > 0 ? avg : defaultVal;
  }
  return nums[nums.length - 1] > 0 ? nums[nums.length - 1] : defaultVal;
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

  const { usuario } = useAuth();
  const [nomeTreino, setNomeTreino] = useState<string>(
    () => localStorage.getItem("treino_iniciado_nome") || "Treino do dia",
  );
  const [modalStory, setModalStory] = useState(false);
  const [storyDados, setStoryDados] = useState<StoryImediatoDados | null>(null);

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
      localStorage.setItem("treino_iniciado_nome", sugestaoHoje.sugerido.nome);
      setNomeTreino(sugestaoHoje.sugerido.nome);
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
    toast.sucesso("Treino iniciado! Registre ao concluir.");
  };

  const recomecar = async () => {
    setReiniciando(true);
    try {
      await reiniciar();
      localStorage.removeItem("treino_iniciado_em");
      localStorage.removeItem("treino_iniciado_nome");
      setNomeTreino("Treino do dia");
      setIniciadoEm(null);
      setSeriesState({});
      toast.sucesso("Treino reiniciado. Clique em 'Iniciar treino' quando começar!");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setReiniciando(false);
    }
  };

  const salvarNoHistorico = async (abrirStory = false) => {
    setFinalizando(true);
    try {
      const hojeIso = new Date().toISOString().split("T")[0];
      const fim = new Date();
      const duracaoMin = iniciadoEm ? calcularIntervaloMinutos(iniciadoEm, fim) : 1;

      // Calcula volume e séries detalhadas para a história e Story 9:16
      let volumeTotal = 0;
      let totalSeriesFeitas = 0;
      const destaques: Array<{ nome: string; series: number; cargaMax: number | null }> = [];

      exercicios.forEach((ex) => {
        const series = obterSeries(ex);
        let exSeriesFeitas = 0;
        let exCargaMax: number | null = null;

        series.forEach((s) => {
          if (s.concluida) {
            exSeriesFeitas++;
            totalSeriesFeitas++;
            const c = parseCargaNumero(s.carga) || parseCargaNumero(ex.carga);
            const r = parseRepsNumero(s.repeticoes, parseRepsNumero(ex.repeticoes, 10));
            volumeTotal += c * r;
            if (c > (exCargaMax ?? 0)) {
              exCargaMax = c;
            }
          }
        });

        if (exSeriesFeitas > 0) {
          destaques.push({
            nome: ex.nome,
            series: exSeriesFeitas,
            cargaMax: exCargaMax,
          });
        }
      });

      const nomeFinal = nomeTreino.trim() || "Treino do dia";

      const payload = {
        nome: nomeFinal,
        data: hojeIso,
        duracao_min: duracaoMin,
        iniciado_em: iniciadoEm,
        finalizado_em: fim.toISOString(),
        limpar_exercicios_atuais: limparAoConcluir,
        exercicios: exercicios.map((ex, ordem) => {
          const series = obterSeries(ex).map((s: SerieItem) => {
            const c = parseCargaNumero(s.carga) || parseCargaNumero(ex.carga);
            const r = parseRepsNumero(s.repeticoes, parseRepsNumero(ex.repeticoes, 10));
            return {
              numero: s.numero,
              carga: c > 0 ? c : null,
              repeticoes: r > 0 ? r : null,
              concluida: s.concluida,
            };
          });

          return {
            nome: ex.nome,
            exercicio_ref: ex.exercicio_ref,
            series_planejadas: ex.series,
            repeticoes: ex.repeticoes,
            carga: parseCargaNumero(ex.carga) || null,
            concluido: ex.concluido,
            ordem,
            series,
          };
        }),
      };

      await sessoesApi.concluir(payload);
      localStorage.removeItem("treino_iniciado_em");
      localStorage.removeItem("treino_iniciado_nome");
      setIniciadoEm(null);
      toast.sucesso("Treino registrado no histórico! Sequência mantida!");
      setModalConcluir(false);

      if (abrirStory && usuario.is_staff) {
        // ADMIN clicou em Compartilhar: Apresenta o Story 9:16 Imediato
        setStoryDados({
          nomeTreino: nomeFinal,
          duracaoMin,
          volumeTotalKg: Math.round(volumeTotal),
          totalSeries: totalSeriesFeitas || feitos * 3,
          totalExercicios: destaques.length || total,
          exerciciosDestaque: destaques,
          dataTreino: hojeIso,
          nomeUsuario: usuario.first_name,
          username: usuario.username,
        });
        setModalStory(true);
      } else {
        // Segue o fluxo padrão direto para o histórico
        navigate("/historico");
      }
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
                  <i className="bi bi-lightbulb-fill" style={{ color: "var(--accent)", marginRight: 6 }} />
                  Sugestão para hoje ({sugestaoHoje.nome_dia})
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
              texto="Escolha um dos seus treinos salvos para iniciar sua sessão de treino."
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/" className="btn btn--primary">
                  <i className="bi bi-collection-fill" /> Escolher treino salvo
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
                            <i className="bi bi-trophy-fill" style={{ marginRight: 3 }} /> PR: {historico.recorde_carga} kg
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
        <Modal titulo="Registrar treino" onFechar={() => setModalConcluir(false)}>
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

            <label className="field" style={{ margin: "10px 0" }}>
              <span>Nome do treino</span>
              <input
                value={nomeTreino}
                maxLength={60}
                onChange={(e) => setNomeTreino(e.target.value)}
                placeholder="Ex.: Treino de Perna, Superiores A..."
              />
            </label>

            {/* Banner simplificado: Registre no story seu treino com botão à parte de compartilhar */}
            {usuario.is_staff ? (
              <div className="story-admin-banner story-admin-banner--liberado story-banner-com-botao">
                <div className="story-banner-com-botao__info">
                  <i className="bi bi-instagram" />
                  <span>Registre no story seu treino</span>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm story-banner-com-botao__btn"
                  onClick={() => salvarNoHistorico(true)}
                  disabled={finalizando}
                >
                  <i className="bi bi-share" /> Compartilhar
                </button>
              </div>
            ) : (
              <div className="story-admin-banner story-admin-banner--bloqueado story-banner-com-botao">
                <div className="story-banner-com-botao__info">
                  <i className="bi bi-lock-fill" />
                  <span>Registre no story seu treino (Exclusivo Admin)</span>
                </div>
              </div>
            )}

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
                onClick={() => salvarNoHistorico(false)}
                disabled={finalizando}
              >
                {finalizando ? "Registrando…" : "Registrar treino"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Story Imediato (Instagram 9:16) */}
      {modalStory && storyDados && (
        <StoryImediatoModal
          aberto={modalStory}
          dados={storyDados}
          onFechar={() => {
            setModalStory(false);
            navigate("/historico");
          }}
          aoIrParaHistorico={() => {
            setModalStory(false);
            navigate("/historico");
          }}
        />
      )}
    </>
  );
}
