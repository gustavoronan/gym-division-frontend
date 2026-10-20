import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import Modal from "../Modal/Modal";
import { useToast } from "../Toast/toastContext";

export interface StoryImediatoDados {
  nomeTreino: string;
  duracaoMin: number;
  volumeTotalKg: number;
  totalSeries: number;
  totalExercicios: number;
  exerciciosDestaque: Array<{
    nome: string;
    series: number;
    cargaMax?: number | null;
  }>;
  dataTreino?: string;
  nomeUsuario?: string;
  username?: string;
}

interface StoryImediatoModalProps {
  aberto: boolean;
  dados: StoryImediatoDados;
  onFechar: () => void;
  aoIrParaHistorico?: () => void;
}

export default function StoryImediatoModal({
  aberto,
  dados,
  onFechar,
  aoIrParaHistorico,
}: StoryImediatoModalProps) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exportando, setExportando] = useState(false);

  if (!aberto) return null;

  const nomeTreinoLimpo = dados.nomeTreino?.trim() || "Treino do Dia";
  const slug = nomeTreinoLimpo.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const nomeArquivo = `story-treino-division-${slug}.png`;

  const dataExibicao = dados.dataTreino
    ? new Date(dados.dataTreino + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const legendaTexto = `Treino de ${nomeTreinoLimpo} concluído! ⏱️ ${dados.duracaoMin} min • 🏋️ ${dados.volumeTotalKg.toLocaleString(
    "pt-BR",
  )} kg de volume total • 🔥 ${dados.totalSeries} séries.\n\nRegistrado com foco no #DivisionApp 💪⚡`;

  const copiarLegenda = async () => {
    try {
      await navigator.clipboard.writeText(legendaTexto);
      toast.sucesso("Legenda copiada para o Instagram Stories!");
    } catch {
      toast.erro("Não foi possível copiar a legenda automaticamente.");
    }
  };

  const baixarImagem = async () => {
    if (!cardRef.current) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = nomeArquivo;
      link.href = dataUrl;
      link.click();
      toast.sucesso("Imagem do Story (9:16) baixada com sucesso!");
    } catch {
      toast.erro("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setExportando(false);
    }
  };

  const compartilhar = async () => {
    if (!cardRef.current) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], nomeArquivo, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Treino de ${nomeTreinoLimpo} no Division`,
          text: legendaTexto,
        });
        toast.sucesso("Compartilhado com sucesso!");
      } else {
        const link = document.createElement("a");
        link.download = nomeArquivo;
        link.href = dataUrl;
        link.click();
        await copiarLegenda();
        toast.sucesso("Story baixado e legenda copiada! Abra o Instagram Stories.");
      }
    } catch {
      toast.erro("Não foi possível compartilhar automaticamente.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <Modal
      titulo="✨ Story Imediato (Instagram 9:16)"
      onFechar={onFechar}
    >
      <div className="story-imediato-wrapper">
        <p className="story-imediato-intro">
          Card exclusivo gerado em tempo real com seu volume, duração e séries.
          Pronto para postar nos <strong>Stories do Instagram</strong>!
        </p>

        {/* Story 9:16 Preview Card */}
        <div className="story-imediato-preview-area">
          <div ref={cardRef} className="story-imediato-card">
            {/* Background glowing gradients & mesh */}
            <div className="story-card-mesh story-card-mesh--top" />
            <div className="story-card-mesh story-card-mesh--bottom" />

            {/* Top Bar Branding */}
            <div className="story-card-topbar">
              <div className="story-card-badge">
                <i className="bi bi-lightning-charge-fill" />
                <span>DIVISION • WORKOUT COMPLETED</span>
              </div>
              <span className="story-card-date">{dataExibicao}</span>
            </div>

            {/* Header / Athlete & Workout Name */}
            <div className="story-card-header">
              <div className="story-card-user-info">
                <div className="story-card-avatar">
                  {(dados.nomeUsuario || dados.username || "A")[0].toUpperCase()}
                </div>
                <div>
                  <strong className="story-card-user-name">
                    {dados.nomeUsuario || dados.username || "Atleta"}
                  </strong>
                  <span className="story-card-username">
                    @{dados.username || "division.app"}
                  </span>
                </div>
              </div>

              <div className="story-card-title-box">
                <span className="story-card-concluido-tag">🔥 MISSÃO CUMPRIDA</span>
                <h1 className="story-card-title">
                  {nomeTreinoLimpo.toUpperCase()} CONCLUÍDO!
                </h1>
              </div>
            </div>

            {/* Metrics Highlights (Duration, Volume, Series) */}
            <div className="story-card-stats-grid">
              <div className="story-stat-card story-stat-card--time">
                <div className="story-stat-icon">⏱️</div>
                <div className="story-stat-valor">{dados.duracaoMin} min</div>
                <div className="story-stat-rotulo">Duração</div>
              </div>

              <div className="story-stat-card story-stat-card--volume">
                <div className="story-stat-icon">🏋️</div>
                <div className="story-stat-valor">
                  {dados.volumeTotalKg >= 1000
                    ? `${(dados.volumeTotalKg / 1000).toFixed(1)} t`
                    : `${dados.volumeTotalKg} kg`}
                </div>
                <div className="story-stat-rotulo">
                  {dados.volumeTotalKg.toLocaleString("pt-BR")} kg vol.
                </div>
              </div>

              <div className="story-stat-card story-stat-card--series">
                <div className="story-stat-icon">🔥</div>
                <div className="story-stat-valor">{dados.totalSeries}</div>
                <div className="story-stat-rotulo">Séries feitas</div>
              </div>
            </div>

            {/* Highlights: Exercises list */}
            {dados.exerciciosDestaque && dados.exerciciosDestaque.length > 0 && (
              <div className="story-card-exercicios">
                <div className="story-card-section-title">
                  <i className="bi bi-fire" /> DESTAQUES DA SESSÃO
                </div>
                <div className="story-card-exercicios-list">
                  {dados.exerciciosDestaque.slice(0, 5).map((ex, idx) => (
                    <div key={idx} className="story-card-exercicio-row">
                      <div className="story-card-ex-nome">
                        <span className="story-card-ex-num">{idx + 1}</span>
                        <span>{ex.nome}</span>
                      </div>
                      <div className="story-card-ex-cargas">
                        <span className="story-card-ex-series">
                          {ex.series} {ex.series === 1 ? "série" : "séries"}
                        </span>
                        {ex.cargaMax !== null &&
                          ex.cargaMax !== undefined &&
                          ex.cargaMax > 0 && (
                            <span className="story-card-ex-peso">
                              {ex.cargaMax} kg
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                  {dados.totalExercicios > 5 && (
                    <div className="story-card-ex-mais">
                      +{dados.totalExercicios - 5} outros exercícios completados
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivational Banner & Footer */}
            <div className="story-card-footer">
              <div className="story-card-streak-pill">
                <span>⚡ SOBRECARGA PROGRESSIVA • SEM DESCULPAS</span>
              </div>
              <div className="story-card-brand">
                <span className="story-card-logo">DIVISION</span>
                <span className="story-card-tag">#DivisionApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="story-imediato-acoes">
          <button
            type="button"
            className="btn btn--primary btn--block story-btn-destaque"
            onClick={compartilhar}
            disabled={exportando}
          >
            <i className="bi bi-instagram" />{" "}
            {exportando ? "Preparando Story…" : "Compartilhar no Instagram"}
          </button>

          <div className="story-imediato-botoes-secundarios">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={baixarImagem}
              disabled={exportando}
            >
              <i className="bi bi-download" /> Baixar PNG
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={copiarLegenda}
            >
              <i className="bi bi-clipboard" /> Copiar legenda
            </button>
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              onFechar();
              if (aoIrParaHistorico) aoIrParaHistorico();
            }}
          >
            <i className="bi bi-check2-circle" /> Concluir e ver Histórico
          </button>
        </div>
      </div>
    </Modal>
  );
}
