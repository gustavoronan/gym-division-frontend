import { useState, type FormEvent } from "react";
import type { Usuario, UsuarioInput } from "../../types/usuario";

interface Props {
  // Ausente = novo usuário (senha obrigatória); presente = edição (senha opcional).
  inicial?: Usuario;
  onSalvar: (dados: UsuarioInput) => Promise<void>;
  onCancelar: () => void;
}

export default function UsuarioForm({ inicial, onSalvar, onCancelar }: Props) {
  const [username, setUsername] = useState(inicial?.username ?? "");
  const [nome, setNome] = useState(inicial?.first_name ?? "");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(inicial?.is_staff ?? false);
  const [ativo, setAtivo] = useState(inicial?.is_active ?? true);
  const [salvando, setSalvando] = useState(false);

  const senhaOk = inicial ? password === "" || password.length >= 6 : password.length >= 6;
  const valido = username.trim() !== "" && senhaOk;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        username: username.trim(),
        first_name: nome.trim(),
        is_staff: admin,
        is_active: ativo,
        ...(password ? { password } : {}),
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="form" onSubmit={enviar}>
      <label className="field">
        <span>Usuário</span>
        <input
          autoFocus
          value={username}
          maxLength={150}
          autoCapitalize="none"
          autoComplete="off"
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Nome (opcional)</span>
        <input value={nome} maxLength={150} onChange={(e) => setNome(e.target.value)} />
      </label>

      <label className="field">
        <span>{inicial ? "Nova senha (deixe em branco para manter)" : "Senha"}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          placeholder="Mínimo 6 caracteres"
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className="check">
        <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
        <span>Administrador (pode criar e gerenciar usuários)</span>
      </label>

      {inicial && (
        <label className="check">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          <span>Conta ativa</span>
        </label>
      )}

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valido || salvando}>
          {salvando ? "Salvando…" : inicial ? "Salvar" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
