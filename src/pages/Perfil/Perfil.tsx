import { useState, type FormEvent } from "react";
import { useAuth } from "../../components/Auth/authContext";
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
    </>
  );
}
