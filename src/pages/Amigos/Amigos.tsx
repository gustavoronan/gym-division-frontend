import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Modal from "../../components/Modal/Modal";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useNotificacoes } from "../../components/Notificacoes/notificacoesContext";
import { useToast } from "../../components/Toast/toastContext";
import { amigosApi } from "../../services/api";
import type { Amigos as AmigosData, Amizade, Pessoa } from "../../types/social";
import { nomeDe } from "./nomeDe";

export default function Amigos() {
  const toast = useToast();
  const navigate = useNavigate();
  const { recarregar: recarregarAvisos } = useNotificacoes();

  const [dados, setDados] = useState<AmigosData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<Amizade | null>(null);

  useEffect(() => {
    let ativo = true;
    amigosApi
      .listar()
      .then((d) => ativo && setDados(d))
      .catch((e: Error) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const recarregar = useCallback(() => {
    setErro(null);
    setDados(null);
    setTentativa((t) => t + 1);
  }, []);

  // Rebusca a lista depois de uma ação (aceitar, recusar, adicionar...).
  const atualizar = async () => {
    setDados(await amigosApi.listar());
    recarregarAvisos();
  };

  const aceitar = async (a: Amizade) => {
    try {
      await amigosApi.aceitar(a.id);
      await atualizar();
      toast.sucesso(`Agora você e ${nomeDe(a.usuario)} são amigos!`);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const recusar = async (a: Amizade) => {
    try {
      await amigosApi.remover(a.id);
      await atualizar();
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const adicionar = async (username: string) => {
    try {
      const r = await amigosApi.adicionar(username);
      await atualizar();
      toast.sucesso(`Pedido enviado para ${nomeDe(r.usuario)}.`);
      setAdicionando(false);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const confirmarRemocao = async () => {
    if (!removendo) return;
    try {
      await amigosApi.remover(removendo.id);
      await atualizar();
      toast.sucesso("Amizade desfeita.");
      setRemovendo(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const vazio =
    dados &&
    dados.amigos.length === 0 &&
    dados.recebidos.length === 0 &&
    dados.enviados.length === 0;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Amigos</h1>
          <p>
            {dados
              ? `${dados.amigos.length} ${dados.amigos.length === 1 ? "amigo" : "amigos"}`
              : "Carregando…"}
          </p>
        </div>
        <button
          className="btn btn--primary btn--icon-text"
          onClick={() => setAdicionando(true)}
          disabled={!dados}
        >
          <i className="bi bi-person-plus-fill" /> Adicionar
        </button>
      </header>

      {erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : !dados ? (
        <ListaSkeleton linhas={3} />
      ) : vazio ? (
        <VazioEstado
          icone="bi-people"
          titulo="Nenhum amigo ainda"
          texto="Adicione alguém pelo nome de usuário para ver e copiar os treinos dela."
        >
          <button className="btn btn--primary" onClick={() => setAdicionando(true)}>
            <i className="bi bi-person-plus-fill" /> Adicionar amigo
          </button>
        </VazioEstado>
      ) : (
        <>
          {dados.recebidos.length > 0 && (
            <section className="secao">
              <h2>Pedidos recebidos</h2>
              <ul className="lista">
                {dados.recebidos.map((a) => (
                  <li key={a.id} className="card usuario">
                    <Info pessoa={a.usuario} />
                    <div className="exercicio__acoes">
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => aceitar(a)}
                      >
                        Aceitar
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        onClick={() => recusar(a)}
                        aria-label={`Recusar pedido de ${nomeDe(a.usuario)}`}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dados.amigos.length > 0 && (
            <section className="secao">
              <h2>Meus amigos</h2>
              <ul className="lista">
                {dados.amigos.map((a) => (
                  <li key={a.id} className="card usuario">
                    <button
                      className="usuario__abrir"
                      onClick={() => navigate(`/amigos/${a.usuario.id}`)}
                    >
                      <Info pessoa={a.usuario} />
                      <i className="bi bi-chevron-right" />
                    </button>
                    <button
                      className="icon-btn icon-btn--danger"
                      onClick={() => setRemovendo(a)}
                      aria-label={`Desfazer amizade com ${nomeDe(a.usuario)}`}
                    >
                      <i className="bi bi-person-dash" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dados.enviados.length > 0 && (
            <section className="secao">
              <h2>Pedidos enviados</h2>
              <ul className="lista">
                {dados.enviados.map((a) => (
                  <li key={a.id} className="card usuario">
                    <Info pessoa={a.usuario} />
                    <button className="btn btn--ghost btn--sm" onClick={() => recusar(a)}>
                      Cancelar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {adicionando && (
        <Modal titulo="Adicionar amigo" onFechar={() => setAdicionando(false)}>
          <AdicionarForm onEnviar={adicionar} onCancelar={() => setAdicionando(false)} />
        </Modal>
      )}

      {removendo && (
        <ConfirmDialog
          titulo="Desfazer amizade"
          mensagem={`Remover ${nomeDe(removendo.usuario)} dos seus amigos? Os treinos que você já copiou continuam com você.`}
          textoConfirmar="Remover"
          onConfirmar={confirmarRemocao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </>
  );
}

function Info({ pessoa }: { pessoa: Pessoa }) {
  return (
    <div className="usuario__info">
      <strong>{nomeDe(pessoa)}</strong>
      {pessoa.first_name && <span>@{pessoa.username}</span>}
    </div>
  );
}

function AdicionarForm({
  onEnviar,
  onCancelar,
}: {
  onEnviar: (username: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [username, setUsername] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || enviando) return;
    setEnviando(true);
    try {
      await onEnviar(username.trim());
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="form" onSubmit={enviar}>
      <label className="field">
        <span>Nome de usuário</span>
        <input
          autoFocus
          value={username}
          maxLength={150}
          autoCapitalize="none"
          autoComplete="off"
          placeholder="ex.: ana"
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!username.trim() || enviando}
        >
          {enviando ? "Enviando…" : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}
