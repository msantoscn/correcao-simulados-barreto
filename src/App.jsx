import { useState } from "react";
import {
  Award,
  Settings,
  Users,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  Loader2,
  UserCog,
} from "lucide-react";
import Admin from "./components/Admin.jsx";
import Turmas from "./components/Turmas.jsx";
import Professor from "./components/Professor.jsx";
import Relatorios from "./components/Relatorios.jsx";
import Usuarios from "./components/Usuarios.jsx";
import Login from "./components/Login.jsx";
import { useFirebase } from "./useFirebase.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function MainContent() {
  const { user, logout, isProfessor, isGestao, loadingAuth } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState(() =>
    isProfessor ? "professor" : "admin",
  );
  const abaExibida = isProfessor ? "professor" : abaAtiva;

  // Dados e funções do Firebase atualizados
  const {
    simulados,
    turmas,
    respostasAlunos,
    usuarios,
    loading,
    salvarSimulado,
    deletarSimulado,
    salvarTurma,
    deletarTurma,
    salvarRespostaAluno,
    deletarRespostaAluno,
    vincularTurmaSimulado,
    salvarUsuarios,
    deletarUsuario,
  } = useFirebase();

  // 1. A carregar verificação de login
  if (loadingAuth) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="w-8 h-8 text-[#4b82f6] animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse text-center">
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
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <Award className="w-10 h-10 text-[#4b82f6] animate-bounce" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest animate-pulse text-center">
          A carregar sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans pb-12 overflow-x-hidden selection:bg-blue-100">
      {/* Cabeçalho Blindado para Mobile */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Logo e Info do Usuário */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100 flex-shrink-0 shadow-xs">
                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-[#4b82f6]" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-800 leading-tight truncate">
                  SIMULA<span className="text-[#5C9B14]">TECH</span>
                </h1>

                {/* Nome do usuário em destaque fora do contorno antigo, limpo e profissional */}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight truncate">
                    {user.nome}
                  </span>
                  <div className="inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                    <span className="mr-1">{user.codigo}</span> •
                    <span className="text-[#4b82f6] ml-1">{user.cargo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Sair Mobile (Apenas para Gestão, ou geral caso necessário) */}
            <button
              onClick={logout}
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              className="md:hidden p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all cursor-pointer border border-red-100 active:scale-95 flex-shrink-0 ml-2 shadow-xs"
              title="Sair da Conta"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação Otimizada e Flexível (Oculta para Professor) */}
          {!isProfessor && (
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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
                <>
                  <NavButton
                    active={abaExibida === "relatorios"}
                    onClick={() => setAbaAtiva("relatorios")}
                    icon={FileSpreadsheet}
                  >
                    Relatórios
                  </NavButton>

                  <NavButton
                    active={abaExibida === "usuarios"}
                    onClick={() => setAbaAtiva("usuarios")}
                    icon={UserCog}
                  >
                    Acessos
                  </NavButton>
                </>
              )}

              {/* Botão de Sair Desktop */}
              <button
                onClick={logout}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
                className="hidden md:flex ml-1 p-2.5 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-red-200 shadow-xs active:scale-95 items-center justify-center"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Conteúdo Principal Adaptado a Largura Máxima sem Estouro */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-8 w-full overflow-x-hidden">
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
            simuladosDisponiveis={simulados}
            onSalvarTurmas={salvarTurma}
            onDeletarTurma={deletarTurma}
          />
        )}

        {abaExibida === "professor" && (
          <Professor
            simulados={simulados}
            turmas={turmas}
            respostasAlunos={respostasAlunos}
            onSalvarResposta={(registo) =>
              salvarRespostaAluno(registo, user, turmas)
            }
            onExcluirResposta={deletarRespostaAluno}
            onVincularTurmaSimulado={vincularTurmaSimulado}
          />
        )}

        {abaExibida === "relatorios" && isGestao && (
          <Relatorios
            turmas={turmas}
            simulados={simulados}
            respostasAlunos={respostasAlunos}
          />
        )}

        {abaExibida === "usuarios" && isGestao && (
          <Usuarios
            usuarios={usuarios || []}
            onSalvarUsuarios={salvarUsuarios}
            onDeletarUsuario={deletarUsuario}
          />
        )}
      </main>
    </div>
  );
}

/* ========================================================================
   SUB-COMPONENTES (Clean Code & iOS/Android Touch Optimized)
   ======================================================================== */

function NavButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap shadow-xs ${
        active
          ? "bg-[#4b82f6] text-white shadow-blue-500/20 border border-transparent"
          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-200 border"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
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
