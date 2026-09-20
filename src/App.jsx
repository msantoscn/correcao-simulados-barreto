import { useState } from "react";
import {
  Award,
  Settings,
  Users,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  Loader2,
} from "lucide-react";
import Admin from "./components/Admin.jsx";
import Turmas from "./components/Turmas.jsx";
import Professor from "./components/Professor.jsx";
import Relatorios from "./components/Relatorios.jsx";
import Login from "./components/Login.jsx";
import { useFirebase } from "./useFirebase.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function MainContent() {
  const { user, logout, isProfessor, isGestao, loadingAuth } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState(() =>
    isProfessor ? "professor" : "admin",
  );
  const abaExibida = isProfessor ? "professor" : abaAtiva;

  // Dados e funções do Firebase
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

  // 1. A carregar verificação de login
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#4b82f6] animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          A verificar autenticação...
        </p>
      </div>
    );
  }

  // 2. Se não estiver autenticado, exibe a Tela de Login
  if (!user) {
    return <Login />;
  }

  // 3. A carregar dados do Firebase
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <Award className="w-10 h-10 text-[#4b82f6] animate-bounce" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          A carregar sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 transition-colors">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo e Info do Usuário */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <Award className="w-6 h-6 text-[#4b82f6]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wide uppercase text-slate-800 leading-none mb-1">
                  SIMULA<span className="text-[#5C9B14]">TECH</span>
                </h1>
                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                  <span className="truncate max-w-[120px] sm:max-w-none mr-1">
                    {user.nome}
                  </span>
                  ({user.codigo}) •{" "}
                  <span className="text-[#4b82f6] ml-1">{user.cargo}</span>
                </div>
              </div>
            </div>

            {/* Botão de Sair Mobile */}
            <button
              onClick={logout}
              className="md:hidden p-2.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all cursor-pointer border border-red-100 active:scale-95"
              title="Sair da Conta"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            {isGestao && (
              <>
                <NavButton
                  active={abaExibida === "admin"}
                  onClick={() => setAbaAtiva("admin")}
                  icon={Settings}
                >
                  Admin
                </NavButton>

                <NavButton
                  active={abaExibida === "turmas"}
                  onClick={() => setAbaAtiva("turmas")}
                  icon={Users}
                >
                  Turmas
                </NavButton>
              </>
            )}

            <NavButton
              active={abaExibida === "professor"}
              onClick={() => setAbaAtiva("professor")}
              icon={UserCheck}
            >
              Professor
            </NavButton>

            {isGestao && (
              <NavButton
                active={abaExibida === "relatorios"}
                onClick={() => setAbaAtiva("relatorios")}
                icon={FileSpreadsheet}
              >
                Relatórios
              </NavButton>
            )}

            {/* Botão de Sair Desktop */}
            <button
              onClick={logout}
              className="hidden md:flex ml-1 p-2.5 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-red-200 shadow-sm active:scale-95"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {abaExibida === "admin" && isGestao && (
          <Admin
            simulados={simulados}
            onSalvarSimulado={salvarSimulado}
            onDeletarSimulado={deletarSimulado}
          />
        )}

        {abaExibida === "turmas" && isGestao && (
          <Turmas
            turmas={turmas}
            onSalvarTurmas={salvarTurma}
            onDeletarTurma={deletarTurma}
          />
        )}

        {abaExibida === "professor" && (
          <Professor
            simulados={simulados}
            turmas={turmas}
            respostasAlunos={respostasAlunos}
            onSalvarResposta={salvarRespostaAluno}
          />
        )}

        {abaExibida === "relatorios" && isGestao && (
          <Relatorios
            turmas={turmas}
            simulados={simulados}
            respostasAlunos={respostasAlunos}
          />
        )}
      </main>
    </div>
  );
}

/* ========================================================================
   SUB-COMPONENTES (Clean Code)
   ======================================================================== */

// Componente reutilizável para os botões do Menu
function NavButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] ${
        active
          ? "bg-[#4b82f6] text-white shadow-md shadow-blue-500/20 border-transparent"
          : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-slate-200 shadow-sm border"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
