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
import { useFirebase } from "./useFirebase.js";

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("admin");

  // Dados e funções vindos diretamente do Firebase Firestore em tempo real
  const {
    simulados,
    turmas,
    respostasAlunos,
    loading,
    salvarSimulado,
    deletarSimulado,
    salvarTurma,
    deletarTurma,
    salvarRespostaAluno,
  } = useFirebase();

  // Ecrã de carregamento inicial enquanto busca os dados na nuvem
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Award className="w-10 h-10 text-[#4b82f6] animate-pulse mx-auto" />
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            A carregar dados do Firebase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans pb-12">
      {/* Cabeçalho no estilo institucional */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <Award className="w-7 h-7 text-[#4b82f6]" />
            <h1 className="text-xl font-bold tracking-wide uppercase text-gray-800">
              SIMULA<span className="text-red-600">TECH</span> (FIREBASE)
            </h1>
          </div>

          <nav className="flex flex-wrap gap-1.5 text-xs font-bold">
            <button
              onClick={() => setAbaAtiva("admin")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm uppercase transition cursor-pointer ${
                abaAtiva === "admin"
                  ? "bg-[#4b82f6] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Settings className="w-4 h-4" /> ADMIN
            </button>
            <button
              onClick={() => setAbaAtiva("turmas")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm uppercase transition cursor-pointer ${
                abaAtiva === "turmas"
                  ? "bg-[#4b82f6] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users className="w-4 h-4" /> TURMAS
            </button>
            <button
              onClick={() => setAbaAtiva("professor")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm uppercase transition cursor-pointer ${
                abaAtiva === "professor"
                  ? "bg-[#4b82f6] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <UserCheck className="w-4 h-4" /> PROFESSOR
            </button>
            <button
              onClick={() => setAbaAtiva("relatorios")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm uppercase transition cursor-pointer ${
                abaAtiva === "relatorios"
                  ? "bg-[#4b82f6] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> RELATÓRIOS
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo da Aba Ativa */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {abaAtiva === "admin" && (
          <Admin
            simulados={simulados}
            onSalvarSimulado={salvarSimulado}
            onDeletarSimulado={deletarSimulado}
          />
        )}

        {abaAtiva === "turmas" && (
          <Turmas
            turmas={turmas}
            onSalvarTurmas={salvarTurma}
            onDeletarTurma={deletarTurma}
          />
        )}

        {abaAtiva === "professor" && (
          <Professor
            simulados={simulados}
            turmas={turmas}
            respostasAlunos={respostasAlunos}
            onSalvarResposta={salvarRespostaAluno}
          />
        )}

        {abaAtiva === "relatorios" && (
          <Relatorios turmas={turmas} respostasAlunos={respostasAlunos} />
        )}
      </main>
    </div>
  );
}
