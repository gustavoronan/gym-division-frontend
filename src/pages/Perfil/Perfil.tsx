import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/Auth/authContext";
import ConquistasModal from "../../components/Conquistas/ConquistasModal";
import ResumoMesModal from "../../components/ResumoMes/ResumoMesModal";
import ComoInstalarModal from "../../components/ComoInstalar/ComoInstalarModal";
import { useToast } from "../../components/Toast/toastContext";
import { authApi } from "../../services/api";

export default function Perfil() {
  const { usuario, sair, atualizar } = useAuth();
  const toast = useToast();

  const [nome, setNome] = useState(usuario.first_name);
  const [username, setUsername] = useState(usuario.username);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [modalConquistas, setModalConquistas] = useState(false);
  const [modalResumoMes, setModalResumoMes] = useState(false);
  const [modalComoInstalar, setModalComoInstalar] = useState(false);

  const trocandoSenha = novaSenha !== "";
  const valido =
    username.trim() !== "" &&
    (!trocandoSenha || (novaSenha.length >= 6 && senhaAtual !== ""));
  const alterado =
    nome.trim() !== usuario.first_name ||
    username.trim() !== usuario.username ||
    trocandoSenha;

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido || !alterado || salvando) return;
    setSalvando(true);
    try {
      const atualizado = await authApi.atualizarPerfil({
        username: username.trim(),
        first_name: nome.trim(),
        ...(trocandoSenha ? { senha_atual: senhaAtual, password: novaSenha } : {}),
      });
      atualizar(atualizado);
      setSenhaAtual("");
      setNovaSenha("");
      toast.sucesso("Perfil atualizado!");
    } catch (err) {
      toast.erro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Meu perfil</h1>
          <p>@{usuario.username}</p>
        </div>
      </header>

      <Link to="/historico" className="card link-historico-perfil">
        <div className="link-historico-perfil__info">
          <span className="link-historico-perfil__icone">
            <i className="bi bi-clock-history" />
          </span>
          <div>
            <strong>Histórico & Recordes</strong>
            <span>Veja sua sequência de dias e evolução de carga</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" />
      </Link>

      <button
        type="button"
        className="card link-historico-perfil"
        onClick={() => setModalConquistas(true)}
      >
        <div className="link-historico-perfil__info">
          <span className="link-historico-perfil__icone" style={{ background: "rgba(250, 204, 21, 0.15)", color: "#facc15" }}>
            🏆
          </span>
          <div>
            <strong>Conquistas & Medalhas</strong>
            <span>Desbloqueie marcos, streaks e recordes</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" />
      </button>

      <button
        type="button"
        className="card link-historico-perfil"
        onClick={() => setModalResumoMes(true)}
      >
        <div className="link-historico-perfil__info">
          <span className="link-historico-perfil__icone" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#ec4899" }}>
            📸
          </span>
          <div>
            <strong>Compartilhar Resumo</strong>
            <span>Gere seu card de Stories para o Instagram</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" />
      </button>

      <button
        type="button"
        className="card link-historico-perfil"
        onClick={() => setModalComoInstalar(true)}
      >
        <div className="link-historico-perfil__info">
          <span className="link-historico-perfil__icone" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            💻
          </span>
          <div>
            <strong>Como Instalar o App</strong>
            <span>Instale na Área de Trabalho do PC ou no celular</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" />
      </button>

      <form className="card perfil form" onSubmit={salvar}>
        <label className="field">
          <span>Nome</span>
          <input value={nome} maxLength={150} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label className="field">
          <span>Usuário</span>
          <input
            value={username}
            maxLength={150}
            autoCapitalize="none"
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Nova senha (deixe em branco para manter)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={novaSenha}
            placeholder="Mínimo 6 caracteres"
            onChange={(e) => setNovaSenha(e.target.value)}
          />
        </label>

        {trocandoSenha && (
          <label className="field">
            <span>Senha atual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </label>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={!valido || !alterado || salvando}
        >
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>

      <button className="btn btn--ghost btn--block" onClick={sair}>
        <i className="bi bi-box-arrow-right" /> Sair
      </button>

      {modalConquistas && (
        <ConquistasModal
          aberto={modalConquistas}
          onFechar={() => setModalConquistas(false)}
        />
      )}

      {modalResumoMes && (
        <ResumoMesModal
          aberto={modalResumoMes}
          onFechar={() => setModalResumoMes(false)}
        />
      )}

      {modalComoInstalar && (
        <ComoInstalarModal
          aberto={modalComoInstalar}
          onFechar={() => setModalComoInstalar(false)}
        />
      )}
    </>
  );
}
