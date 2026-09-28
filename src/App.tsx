import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sessao from "./pages/Sessao/Sessao";
import BottomNav from "./components/BottomNav/BottomNav";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-black min-vh-100 d-flex justify-content-center">
        <div
          className="bg-dark text-light w-100 position-relative"
          style={{ maxWidth: "480px" }}
        >
          <div className="p-3 pb-5 mb-5">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessao" element={<Sessao />} />
            </Routes>
          </div>

          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
}
