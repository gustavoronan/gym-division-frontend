import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import Modal from "../Modal/Modal";
import { ErroEstado, ListaSkeleton } from "../States/States";
import { useToast } from "../Toast/toastContext";
import { sessoesApi } from "../../services/api";
import type { ResumoMes, ResumoSemana } from "../../types/exercicio";

interface ResumoMesModalProps {
  aberto: boolean;
  modoInicial?: "semana" | "mes";
  onFechar: () => void;
}

export default function ResumoMesModal({
  aberto,
  modoInicial = "semana",
  onFechar,
}: ResumoMesModalProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [modo, setModo] = useState<"semana" | "mes">(modoInicial);
  const [dadosMes, setDadosMes] = useState<ResumoMes | null>(null);
  const [dadosSemana, setDadosSemana] = useState<ResumoSemana | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<{ ano?: number; mes?: number }>({});
  const [semanaSelecionada, setSemanaSelecionada] = useState<string>("");
  const [tentativa, setTentativa] = useState(0);

  // Sincroniza modo se modoInicial mudar ao reabrir
  useEffect(() => {
    if (aberto && modoInicial) {
      setModo(modoInicial);
    }
  }, [aberto, modoInicial]);

  // Carrega dados conforme o modo ativo
  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);

    if (modo === "semana") {
      sessoesApi
        .resumoSemana(semanaSelecionada || undefined)
        .then((res) => {
          if (!ativo) return;
          setDadosSemana(res);
        })
        .catch((e: Error) => {
          if (!ativo) return;
          setErro(e.message || "Erro ao carregar resumo da semana.");
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
    } else {
      sessoesApi
        .resumoMes(mesSelecionado.ano, mesSelecionado.mes)
        .then((res) => {
          if (!ativo) return;
          setDadosMes(res);
        })
        .catch((e: Error) => {
          if (!ativo) return;
          setErro(e.message || "Erro ao carregar resumo do mês.");
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
    }

    return () => {
      ativo = false;
    };
  }, [aberto, modo, mesSelecionado, semanaSelecionada, tentativa]);

  if (!aberto) return null;

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  const ehSemana = modo === "semana";
  const dados = ehSemana ? dadosSemana : dadosMes;

  const nomeArquivo = ehSemana
    ? `resumo-semana-division-${dadosSemana?.inicio_semana ?? "semana"}.png`
    : `resumo-mes-division-${dadosMes?.ano}-${String(dadosMes?.mes).padStart(2, "0")}.png`;

  const tituloStory = ehSemana
    ? `Meu resumo da semana no Division`
    : `Meu resumo de ${dadosMes?.nome_mes} no Division`;

  const textoCompartilhar = ehSemana
    ? `Confira meus resultados desta semana! #DivisionApp`
    : `Confira meus resultados de ${dadosMes?.nome_mes}! #DivisionApp`;

  const baixarImagem = async () => {
    if (!cardRef.current || !dados) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x para alta definição
      });
      const link = document.createElement("a");
      link.download = nomeArquivo;
      link.href = dataUrl;
      link.click();
      toast.sucesso("Imagem do Story baixada com sucesso!");
    } catch {
      toast.erro("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setExportando(false);
    }
  };

  const compartilhar = async () => {
    if (!cardRef.current || !dados) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], nomeArquivo, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: tituloStory,
          text: textoCompartilhar,
        });
        toast.sucesso("Compartilhado com sucesso!");
      } else {
        // Fallback: faz o download e copia o texto
        const link = document.createElement("a");
        link.download = nomeArquivo;
        link.href = dataUrl;
        link.click();
        await copiarLegenda();
        toast.sucesso("Imagem baixada e legenda copiada para o Instagram Stories!");
      }
    } catch {
      toast.erro("Não foi possível compartilhar automaticamente.");
    } finally {
      setExportando(false);
    }
  };

  const copiarLegenda = async () => {
    if (!dados) return;
    let texto = "";

    if (ehSemana && dadosSemana) {
      texto = [
        `Meu Resumo da Semana no Division:`,
        `• ${dadosSemana.total_treinos} treinos realizados (${dadosSemana.dias_treinados} dias)`,
        `• ${dadosSemana.volume_formatado} levantados`,
        dadosSemana.exercicio_favorito ? `• Exercício favorito: ${dadosSemana.exercicio_favorito.nome}` : "",
        dadosSemana.maior_pr_semana ? `• Recorde da semana: ${dadosSemana.maior_pr_semana.carga} kg no ${dadosSemana.maior_pr_semana.exercicio}` : "",
        `#Division #Fitness #SemanaPaga #Treino #Gym`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (dadosMes) {
      texto = [
        `Meu Resumo de ${dadosMes.nome_mes} no Division:`,
        `• ${dadosMes.total_treinos} treinos realizados (${dadosMes.dias_treinados} dias)`,
        `• ${dadosMes.volume_formatado} levantados`,
        dadosMes.exercicio_favorito ? `• Exercício favorito: ${dadosMes.exercicio_favorito.nome}` : "",
        dadosMes.maior_pr_mes ? `• Recorde do mês: ${dadosMes.maior_pr_mes.carga} kg no ${dadosMes.maior_pr_mes.exercicio}` : "",
        `#Division #Fitness #Treino #Gym`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    try {
      await navigator.clipboard.writeText(texto);
      toast.sucesso("Legenda copiada para a área de transferência!");
    } catch {
      /* fallback silencioso */
    }
  };

  const maiorPr = ehSemana ? dadosSemana?.maior_pr_semana : dadosMes?.maior_pr_mes;
  const labelPr = ehSemana ? "Maior Carga da Semana" : "Maior Carga do Mês";
  const periodoTexto = ehSemana
    ? (dadosSemana?.nome_semana ?? "").toUpperCase()
    : (dadosMes?.nome_mes ?? "").toUpperCase();
  const tagCard = ehSemana ? "RESUMO SEMANAL" : "RESUMO MENSAL";

  return (
    <Modal
      titulo={ehSemana ? "Resumo da Semana para Story" : "Resumo do Mês para Story"}
      onFechar={onFechar}
      centralizado
    >
      <div className="resumo-mes-modal">
        {/* Seletor de Modo: Semana ou Mês */}
        <div className="resumo-story-abas" role="tablist" aria-label="Tipo de resumo para Story">
          <button
            type="button"
            role="tab"
            aria-selected={ehSemana}
            className={`resumo-story-aba ${ehSemana ? "resumo-story-aba--ativa" : ""}`}
            onClick={() => setModo("semana")}
          >
            <i className="bi bi-calendar-week" /> Semana
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!ehSemana}
            className={`resumo-story-aba ${!ehSemana ? "resumo-story-aba--ativa" : ""}`}
            onClick={() => setModo("mes")}
          >
            <i className="bi bi-calendar-month" /> Mês
          </button>
        </div>

        {carregando ? (
          <ListaSkeleton linhas={5} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={recarregar} />
        ) : dados ? (
          <>
            {/* Seletor de Período (Semana ou Mês) */}
            {ehSemana && dadosSemana?.semanas_disponiveis && dadosSemana.semanas_disponiveis.length > 1 && (
              <div className="resumo-mes-seletor">
                <label className="label" style={{ margin: 0 }}>
                  <span>Escolha a semana:</span>
                  <select
                    className="input"
                    value={dadosSemana.inicio_semana}
                    onChange={(e) => {
                      setSemanaSelecionada(e.target.value);
                    }}
                  >
                    {dadosSemana.semanas_disponiveis.map((opcao) => (
                      <option key={opcao.data_inicio} value={opcao.data_inicio}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {!ehSemana && dadosMes?.meses_disponiveis && dadosMes.meses_disponiveis.length > 1 && (
              <div className="resumo-mes-seletor">
                <label className="label" style={{ margin: 0 }}>
                  <span>Escolha o mês:</span>
                  <select
                    className="input"
                    value={`${dadosMes.ano}-${dadosMes.mes}`}
                    onChange={(e) => {
                      const [a, m] = e.target.value.split("-").map(Number);
                      setMesSelecionado({ ano: a, mes: m });
                    }}
                  >
                    {dadosMes.meses_disponiveis.map((opcao) => (
                      <option key={`${opcao.ano}-${opcao.mes}`} value={`${opcao.ano}-${opcao.mes}`}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* Preview do Story (9:16) */}
            <div className="resumo-story-moldura">
              <div ref={cardRef} className="resumo-story-card">
                {/* Header do Story */}
                <header className="resumo-story__header">
                  <div className="resumo-story__marca">
                    <i className="bi bi-lightning-charge-fill" />
                    <span>DIVISION</span>
                  </div>
                  <span className="resumo-story__tag">{tagCard}</span>
                </header>

                {/* Usuário e Período */}
                <div className="resumo-story__periodo-box">
                  <span className="resumo-story__mes">{periodoTexto}</span>
                  <div className="resumo-story__user">
                    <span>@{dados.usuario.username}</span>
                  </div>
                </div>

                {/* Métricas Principais em Grade */}
                <div className="resumo-story__grid-metricas">
                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone resumo-story__metrica-icone--fogo">
                      <i className="bi bi-fire" />
                    </span>
                    <strong className="resumo-story__metrica-valor">{dados.total_treinos}</strong>
                    <span className="resumo-story__metrica-rotulo">Treinos Feitos</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone resumo-story__metrica-icone--volume">
                      <i className="bi bi-bar-chart-fill" />
                    </span>
                    <strong className="resumo-story__metrica-valor">
                      {dados.volume_formatado}
                    </strong>
                    <span className="resumo-story__metrica-rotulo">Volume Total</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone resumo-story__metrica-icone--tempo">
                      <i className="bi bi-stopwatch-fill" />
                    </span>
                    <strong className="resumo-story__metrica-valor">
                      {dados.tempo_formatado}
                    </strong>
                    <span className="resumo-story__metrica-rotulo">Tempo em Ação</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone resumo-story__metrica-icone--dias">
                      <i className="bi bi-calendar-check-fill" />
                    </span>
                    <strong className="resumo-story__metrica-valor">{dados.dias_treinados}</strong>
                    <span className="resumo-story__metrica-rotulo">Dias Ativos</span>
                  </div>
                </div>

                {/* Destaque: Exercício Favorito */}
                {dados.exercicio_favorito && (
                  <div className="resumo-story__destaque-box">
                    <div className="resumo-story__destaque-icone resumo-story__destaque-icone--star">
                      <i className="bi bi-star-fill" />
                    </div>
                    <div className="resumo-story__destaque-texto">
                      <span className="resumo-story__destaque-sub">
                        {ehSemana ? "Destaque da Semana" : "Exercício Favorito"}
                      </span>
                      <strong className="resumo-story__destaque-titulo">
                        {dados.exercicio_favorito.nome}
                      </strong>
                      <span className="resumo-story__destaque-detalhe">
                        {dados.exercicio_favorito.total_series} séries concluídas
                        {dados.exercicio_favorito.max_carga > 0 &&
                          ` · ${dados.exercicio_favorito.max_carga} kg`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Destaque: Maior Recorde */}
                {maiorPr && (
                  <div className="resumo-story__destaque-box resumo-story__destaque-box--pr">
                    <div className="resumo-story__destaque-icone resumo-story__destaque-icone--pr">
                      <i className="bi bi-rocket-takeoff-fill" />
                    </div>
                    <div className="resumo-story__destaque-texto">
                      <span className="resumo-story__destaque-sub">{labelPr}</span>
                      <strong className="resumo-story__destaque-titulo">
                        {maiorPr.carga} kg
                      </strong>
                      <span className="resumo-story__destaque-detalhe">
                        no {maiorPr.exercicio}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer do Story com Marca Prominente */}
                <footer className="resumo-story__footer">
                  <div className="resumo-story__footer-marca">
                    <span className="resumo-story__footer-badge">
                      <i className="bi bi-lightning-charge-fill" /> division.app.br
                    </span>
                    <span className="resumo-story__footer-slogan">App de Treino & Evolução</span>
                  </div>
                </footer>
              </div>
            </div>

            {/* Ações de Compartilhamento */}
            <div className="resumo-mes-acoes">
              <button
                type="button"
                className="btn btn--primary btn--icon-text"
                onClick={compartilhar}
                disabled={exportando}
              >
                <i className="bi bi-instagram" />
                {exportando ? "Gerando…" : "Compartilhar Story"}
              </button>

              <button
                type="button"
                className="btn btn--secondary btn--icon-text"
                onClick={baixarImagem}
                disabled={exportando}
              >
                <i className="bi bi-download" /> Baixar Imagem
              </button>

              <button
                type="button"
                className="btn btn--ghost btn--icon-text"
                onClick={copiarLegenda}
              >
                <i className="bi bi-clipboard" /> Copiar Legenda
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
