import { useState, useRef, useEffect } from "react";
import {
  Award,
  Settings,
  Users,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  UserCog,
  BarChart3,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import Inicio from "./components/Inicio.jsx";
import Admin from "./components/Admin.jsx";
import Turmas from "./components/Turmas.jsx";
import Professor from "./components/Professor.jsx";
import Relatorios from "./components/Relatorios.jsx";
import Usuarios from "./components/Usuarios.jsx";
import Estatisticas from "./components/Estatisticas.jsx";
import Login from "./components/Login.jsx";
import { useFirebase } from "./useFirebase.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function MainContent() {
  const { user, logout, isProfessor, isGestao } = useAuth();

  // Se for professor, a aba inicial ativa é diretamente "professor"
  const [abaAtiva, setAbaAtiva] = useState(() =>
    isProfessor ? "professor" : "inicio",
  );

  const abaExibida =
    isProfessor && abaAtiva !== "estatisticas" && abaAtiva !== "inicio"
      ? "professor"
      : abaAtiva;

  // Estado para controlar o menu em lista (gaveta)
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dados e funções do Firebase
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

  // 1. Se não estiver autenticado, exibe a Tela de Login imediatamente
  if (!user) {
    return <Login />;
  }

  // 2. A carregar dados do Firebase
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
      {/* Cabeçalho Limpo e Otimizado */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex justify-between items-center gap-3">
          {/* Logo e Info do Usuário */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100 flex-shrink-0 shadow-xs">
              <Award className="w-6 h-6 sm:w-7 sm:h-7 text-[#4b82f6]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900 leading-tight truncate">
                SIMULA<span className="text-red-500">TECH</span>
              </h1>
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

          {/* Botão de Menu em Lista (Gaveta) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200 active:scale-95 flex items-center justify-center gap-2 shadow-xs"
              title="Menu do Sistema"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                Menu
              </span>
            </button>

            {/* Lista Dropdown do Menu */}
            {menuAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Navegação
                  </span>
                </div>

                {isGestao && (
                  <MenuItem
                    active={abaExibida === "inicio"}
                    onClick={() => {
                      setAbaAtiva("inicio");
                      setMenuAberto(false);
                    }}
                    icon={LayoutDashboard}
                  >
                    Início
                  </MenuItem>
                )}

                {isGestao && (
                  <>
                    <MenuItem
                      active={abaExibida === "admin"}
                      onClick={() => {
                        setAbaAtiva("admin");
                        setMenuAberto(false);
                      }}
                      icon={Settings}
                    >
                      Admin
                    </MenuItem>

                    <MenuItem
                      active={abaExibida === "turmas"}
                      onClick={() => {
                        setAbaAtiva("turmas");
                        setMenuAberto(false);
                      }}
                      icon={Users}
                    >
                      Turmas
                    </MenuItem>
                  </>
                )}

                <MenuItem
                  active={abaExibida === "professor"}
                  onClick={() => {
                    setAbaAtiva("professor");
                    setMenuAberto(false);
                  }}
                  icon={UserCheck}
                >
                  Professor
                </MenuItem>

                {/* Estatísticas liberadas tanto para Gestão quanto para Professor */}
                <MenuItem
                  active={abaExibida === "estatisticas"}
                  onClick={() => {
                    setAbaAtiva("estatisticas");
                    setMenuAberto(false);
                  }}
                  icon={BarChart3}
                >
                  Estatísticas
                </MenuItem>

                {isGestao && (
                  <>
                    <MenuItem
                      active={abaExibida === "relatorios"}
                      onClick={() => {
                        setAbaAtiva("relatorios");
                        setMenuAberto(false);
                      }}
                      icon={FileSpreadsheet}
                    >
                      Relatórios
                    </MenuItem>

                    <MenuItem
                      active={abaExibida === "usuarios"}
                      onClick={() => {
                        setAbaAtiva("usuarios");
                        setMenuAberto(false);
                      }}
                      icon={UserCog}
                    >
                      Acessos
                    </MenuItem>
                  </>
                )}

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      setMenuAberto(false);
                      logout();
                    }}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-8 w-full overflow-x-hidden">
        {abaExibida === "inicio" && isGestao && (
          <Inicio
            turmas={turmas}
            simulados={simulados}
            respostasAlunos={respostasAlunos}
          />
        )}

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

        {abaExibida === "estatisticas" && (
          <Estatisticas
            turmas={turmas}
            simulados={simulados}
            respostasAlunos={respostasAlunos}
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
    SUB-COMPONENTE DE ITEM DO MENU EM LISTA
    ======================================================================== */

function MenuItem({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-600 font-black border-l-4 border-blue-500"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
