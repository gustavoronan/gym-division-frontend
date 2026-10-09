import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/Auth/authContext";
import AuthGate from "./components/Auth/AuthGate";
import BottomNav from "./components/BottomNav/BottomNav";
import NotificacoesProvider from "./components/Notificacoes/NotificacoesProvider";
import ToastProvider from "./components/Toast/ToastProvider";
import Amigos from "./pages/Amigos/Amigos";
import AmigoTreinos from "./pages/Amigos/AmigoTreinos";
import Dashboard from "./pages/Dashboard/Dashboard";
import Perfil from "./pages/Perfil/Perfil";
import Sessao from "./pages/Sessao/Sessao";
import Treinos from "./pages/Treinos/Treinos";
import Usuarios from "./pages/Usuarios/Usuarios";

function Rotas() {
  const { usuario } = useAuth();
  return (
    <NotificacoesProvider>
      <div className="app">
        <main className="app__conteudo">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/treinos" element={<Treinos />} />
            <Route path="/amigos" element={<Amigos />} />
            <Route path="/amigos/:id" element={<AmigoTreinos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/sessao" element={<Sessao />} />
            {usuario.is_staff && (
              <Route path="/usuarios" element={<Usuarios />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </NotificacoesProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthGate>
          <Rotas />
        </AuthGate>
      </ToastProvider>
    </BrowserRouter>
  );
}
