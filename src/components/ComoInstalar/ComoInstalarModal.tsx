import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function ComoInstalarModal({ aberto, onFechar }: Props) {
  const [aba, setAba] = useState<"pc" | "celular">("pc");
  // Captura o evento nativo de instalação do PWA caso o navegador suporte
  const [promptInstalacao, setPromptInstalacao] = useState<any>(null);

  useEffect(() => {
    const aoCapturarPrompt = (e: Event) => {
      e.preventDefault();
      setPromptInstalacao(e);
    };
    window.addEventListener("beforeinstallprompt", aoCapturarPrompt);
    return () => window.removeEventListener("beforeinstallprompt", aoCapturarPrompt);
  }, []);

  if (!aberto) return null;

  const acionarInstalacaoNativa = async () => {
    if (!promptInstalacao) return;
    promptInstalacao.prompt();
    const { outcome } = await promptInstalacao.userChoice;
    if (outcome === "accepted") {
      setPromptInstalacao(null);
    }
  };

  return (
    <Modal titulo="Como Instalar o Division" onFechar={onFechar} centralizado>
      <div className="como-instalar-modal">
        {/* Seletor de Plataforma */}
        <div className="resumo-story-abas" role="tablist" aria-label="Plataforma de instalação">
          <button
            type="button"
            role="tab"
            aria-selected={aba === "pc"}
            className={`resumo-story-aba ${aba === "pc" ? "resumo-story-aba--ativa" : ""}`}
            onClick={() => setAba("pc")}
          >
            <i className="bi bi-display" /> Área de Trabalho (PC)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === "celular"}
            className={`resumo-story-aba ${aba === "celular" ? "resumo-story-aba--ativa" : ""}`}
            onClick={() => setAba("celular")}
          >
            <i className="bi bi-phone" /> Celular (Android / iOS)
          </button>
        </div>

        {/* Botão de Instalação Rápida com 1 Clique (se detectado pelo browser) */}
        {promptInstalacao && (
          <div className="instalacao-rapida-box">
            <div>
              <strong>Instalação Automática Disponível</strong>
              <p>Seu navegador permite instalar o Division diretamente com um clique.</p>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={acionarInstalacaoNativa}
            >
              <i className="bi bi-download" /> Instalar agora na Área de Trabalho
            </button>
          </div>
        )}

        {aba === "pc" ? (
          <div className="tutorial-lista">
            <div className="tutorial-card">
              <div className="tutorial-card__topo">
                <span className="tutorial-card__badge">Opção 1</span>
                <strong>Google Chrome (Windows / Mac / Linux)</strong>
              </div>
              <ol className="tutorial-passos">
                <li>
                  <span className="passo-num">1</span>
                  <span>
                    Olhe para a <strong>barra de endereço</strong> (onde fica o link do app). À direita, clique no ícone de computador com seta para baixo (<strong>“Instalar Division”</strong>).
                  </span>
                </li>
                <li>
                  <span className="passo-num">2</span>
                  <span>
                    <em>Ou pelo menu:</em> Clique nos <strong>três pontinhos (⋮)</strong> no canto superior direito &gt; <strong>“Salvar e compartilhar”</strong> &gt; <strong>“Instalar o Division...”</strong>.
                  </span>
                </li>
                <li>
                  <span className="passo-num">3</span>
                  <span>
                    Clique em <strong>“Instalar”</strong> na janela de confirmação.
                  </span>
                </li>
                <li>
                  <span className="passo-num">4</span>
                  <span>
                    Pronto! Um ícone oficial do Division será fixado na sua <strong>Área de Trabalho</strong> e na barra de tarefas, abrindo em janela própria como um app nativo!
                  </span>
                </li>
              </ol>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card__topo">
                <span className="tutorial-card__badge">Opção 2</span>
                <strong>Microsoft Edge (Windows)</strong>
              </div>
              <ol className="tutorial-passos">
                <li>
                  <span className="passo-num">1</span>
                  <span>
                    Na barra de endereço, clique no ícone de <strong>aplicativo disponível</strong> (+ dentro de três quadrados).
                  </span>
                </li>
                <li>
                  <span className="passo-num">2</span>
                  <span>
                    <em>Ou pelo menu:</em> Clique nos <strong>três pontinhos (...)</strong> &gt; <strong>“Aplicativos”</strong> &gt; <strong>“Instalar este site como aplicativo”</strong>.
                  </span>
                </li>
                <li>
                  <span className="passo-num">3</span>
                  <span>
                    Marque a opção <strong>“Criar atalho na Área de Trabalho”</strong> e confirme em <strong>“Instalar”</strong>.
                  </span>
                </li>
              </ol>
            </div>

            <div className="tutorial-dica">
              <i className="bi bi-lightbulb" />
              <span>
                <strong>Vantagem do app na Área de Trabalho:</strong> Abre em janela independente sem abas do navegador, economiza memória e permite acesso instantâneo ao seu treino diário.
              </span>
            </div>
          </div>
        ) : (
          <div className="tutorial-lista">
            <div className="tutorial-card">
              <div className="tutorial-card__topo">
                <span className="tutorial-card__badge">Android</span>
                <strong>Google Chrome</strong>
              </div>
              <ol className="tutorial-passos">
                <li>
                  <span className="passo-num">1</span>
                  <span>
                    Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </span>
                </li>
                <li>
                  <span className="passo-num">2</span>
                  <span>
                    Selecione <strong>“Instalar aplicativo”</strong> ou <strong>“Adicionar à tela inicial”</strong>.
                  </span>
                </li>
                <li>
                  <span className="passo-num">3</span>
                  <span>
                    Toque em <strong>“Instalar”</strong>. O ícone aparecerá na tela do seu celular e abrirá em tela cheia!
                  </span>
                </li>
              </ol>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card__topo">
                <span className="tutorial-card__badge">iPhone / iPad</span>
                <strong>Safari (iOS)</strong>
              </div>
              <ol className="tutorial-passos">
                <li>
                  <span className="passo-num">1</span>
                  <span>
                    No Safari, toque no botão de <strong>Compartilhar</strong> (quadrado com seta apontando para cima na barra inferior).
                  </span>
                </li>
                <li>
                  <span className="passo-num">2</span>
                  <span>
                    Role para baixo e selecione <strong>“Adicionar à Tela de Início”</strong>.
                  </span>
                </li>
                <li>
                  <span className="passo-num">3</span>
                  <span>
                    Toque em <strong>“Adicionar”</strong> no canto superior direito.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="form__actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn--ghost btn--block" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
