import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import Modal from "../Modal/Modal";
import { ErroEstado, ListaSkeleton } from "../States/States";
import { useToast } from "../Toast/toastContext";
import { sessoesApi } from "../../services/api";
import type { ResumoMes } from "../../types/exercicio";

interface ResumoMesModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export default function ResumoMesModal({ aberto, onFechar }: ResumoMesModalProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [dados, setDados] = useState<ResumoMes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<{ ano?: number; mes?: number }>({});
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    sessoesApi
      .resumoMes(mesSelecionado.ano, mesSelecionado.mes)
      .then((res) => {
        if (!ativo) return;
        setDados(res);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message || "Erro ao carregar resumo do mês.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [aberto, mesSelecionado, tentativa]);

  if (!aberto) return null;

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  const baixarImagem = async () => {
    if (!cardRef.current || !dados) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x para alta definição
      });
      const link = document.createElement("a");
      link.download = `resumo-division-${dados.ano}-${String(dados.mes).padStart(2, "0")}.png`;
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
      const file = new File([blob], `resumo-division-${dados.ano}-${dados.mes}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Meu resumo de ${dados.nome_mes} no Division`,
          text: `Confira meus resultados de ${dados.nome_mes}! #DivisionApp`,
        });
        toast.sucesso("Compartilhado com sucesso!");
      } else {
        // Fallback: faz o download e copia o texto
        const link = document.createElement("a");
        link.download = `resumo-division-${dados.ano}-${dados.mes}.png`;
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
    const texto = [
      `⚡ Meu Resumo de ${dados.nome_mes} no Division:`,
      `💪 ${dados.total_treinos} treinos realizados (${dados.dias_treinados} dias)`,
      `🏋️ ${dados.volume_formatado} levantados`,
      dados.exercicio_favorito ? `⭐ Exercício favorito: ${dados.exercicio_favorito.nome}` : "",
      dados.maior_pr_mes ? `🚀 Recorde do mês: ${dados.maior_pr_mes.carga} kg no ${dados.maior_pr_mes.exercicio}` : "",
      `#Division #Fitness #Treino #Gym`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast.sucesso("Legenda copiada para a área de transferência!");
    } catch {
      /* fallback silencioso */
    }
  };

  return (
    <Modal titulo="Resumo do Mês para Instagram" onFechar={onFechar} centralizado>
      <div className="resumo-mes-modal">
        {carregando ? (
          <ListaSkeleton linhas={5} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={recarregar} />
        ) : dados ? (
          <>
            {/* Seletor de Mês */}
            {dados.meses_disponiveis && dados.meses_disponiveis.length > 1 && (
              <div className="resumo-mes-seletor">
                <label className="label" style={{ margin: 0 }}>
                  <span>Escolha o mês:</span>
                  <select
                    className="input"
                    value={`${dados.ano}-${dados.mes}`}
                    onChange={(e) => {
                      const [a, m] = e.target.value.split("-").map(Number);
                      setCarregando(true);
                      setMesSelecionado({ ano: a, mes: m });
                    }}
                  >
                    {dados.meses_disponiveis.map((opcao) => (
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
                  <span className="resumo-story__tag">RESUMO MENSAL</span>
                </header>

                {/* Usuário e Período */}
                <div className="resumo-story__periodo-box">
                  <span className="resumo-story__mes">{dados.nome_mes.toUpperCase()}</span>
                  <div className="resumo-story__user">
                    <span>@{dados.usuario.username}</span>
                  </div>
                </div>

                {/* Métricas Principais em Grade */}
                <div className="resumo-story__grid-metricas">
                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone">🔥</span>
                    <strong className="resumo-story__metrica-valor">{dados.total_treinos}</strong>
                    <span className="resumo-story__metrica-rotulo">Treinos Feitos</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone">🏋️</span>
                    <strong className="resumo-story__metrica-valor">
                      {dados.volume_formatado}
                    </strong>
                    <span className="resumo-story__metrica-rotulo">Volume Total</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone">⏱️</span>
                    <strong className="resumo-story__metrica-valor">
                      {dados.tempo_formatado}
                    </strong>
                    <span className="resumo-story__metrica-rotulo">Tempo em Ação</span>
                  </div>

                  <div className="resumo-story__metrica-card">
                    <span className="resumo-story__metrica-icone">📅</span>
                    <strong className="resumo-story__metrica-valor">{dados.dias_treinados}</strong>
                    <span className="resumo-story__metrica-rotulo">Dias Ativos</span>
                  </div>
                </div>

                {/* Destaque: Exercício Favorito */}
                {dados.exercicio_favorito && (
                  <div className="resumo-story__destaque-box">
                    <div className="resumo-story__destaque-icone">⭐</div>
                    <div className="resumo-story__destaque-texto">
                      <span className="resumo-story__destaque-sub">Exercício Favorito</span>
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
                {dados.maior_pr_mes && (
                  <div className="resumo-story__destaque-box resumo-story__destaque-box--pr">
                    <div className="resumo-story__destaque-icone">🚀</div>
                    <div className="resumo-story__destaque-texto">
                      <span className="resumo-story__destaque-sub">Maior Carga do Mês</span>
                      <strong className="resumo-story__destaque-titulo">
                        {dados.maior_pr_mes.carga} kg
                      </strong>
                      <span className="resumo-story__destaque-detalhe">
                        no {dados.maior_pr_mes.exercicio}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer do Story */}
                <footer className="resumo-story__footer">
                  <span>division.app · Treine com consistência</span>
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
