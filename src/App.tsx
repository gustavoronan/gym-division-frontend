import { BrowserRouter, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav/BottomNav";
import ToastProvider from "./components/Toast/ToastProvider";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sessao from "./pages/Sessao/Sessao";
import Treinos from "./pages/Treinos/Treinos";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app">
          <main className="app__conteudo">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/treinos" element={<Treinos />} />
              <Route path="/sessao" element={<Sessao />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
