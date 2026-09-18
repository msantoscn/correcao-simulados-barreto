import { useState } from "react";
import {
  Award,
  Settings,
  Users,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import Admin from "./components/Admin.jsx";
import Turmas from "./components/Turmas.jsx";
import Professor from "./components/Professor.jsx";
import Relatorios from "./components/Relatorios.jsx";

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("admin");

  // Estados Globais com LocalStorage
  const [simulados, setSimulados] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("simulados")) || [];
    } catch {
      return [];
    }
  });

  const [turmas, setTurmas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("turmas")) || [];
    } catch {
      return [];
    }
  });

  const [respostasAlunos, setRespostasAlunos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("respostas_alunos")) || [];
    } catch {
      return [];
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      {/* Cabeçalho */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <Award className="w-7 h-7 text-yellow-300" />
            <h1 className="text-xl font-bold tracking-wide">SimulaTech</h1>
          </div>

          <nav className="flex space-x-1 bg-indigo-800 p-1 rounded-lg text-xs md:text-sm font-medium">
            <button
              onClick={() => setAbaAtiva("admin")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                abaAtiva === "admin"
                  ? "bg-white text-indigo-900 shadow"
                  : "text-indigo-200 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" /> 1. Admin
            </button>
            <button
              onClick={() => setAbaAtiva("turmas")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                abaAtiva === "turmas"
                  ? "bg-white text-indigo-900 shadow"
                  : "text-indigo-200 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" /> 2. Turmas
            </button>
            <button
              onClick={() => setAbaAtiva("professor")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                abaAtiva === "professor"
                  ? "bg-white text-indigo-900 shadow"
                  : "text-indigo-200 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" /> 3. Professor
            </button>
            <button
              onClick={() => setAbaAtiva("relatorios")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                abaAtiva === "relatorios"
                  ? "bg-white text-indigo-900 shadow"
                  : "text-indigo-200 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> 4. Relatórios
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo da Aba Ativa */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {abaAtiva === "admin" && (
          <Admin simulados={simulados} setSimulados={setSimulados} />
        )}

        {abaAtiva === "turmas" && (
          <Turmas turmas={turmas} setTurmas={setTurmas} />
        )}

        {abaAtiva === "professor" && (
          <Professor
            simulados={simulados}
            turmas={turmas}
            respostasAlunos={respostasAlunos}
            setRespostasAlunos={setRespostasAlunos}
          />
        )}

        {abaAtiva === "relatorios" && (
          <Relatorios respostasAlunos={respostasAlunos} />
        )}
      </main>
    </div>
  );
}
