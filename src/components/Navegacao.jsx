import { useAuth } from "../context/AuthContext";
import { UserCheck, FileText, Users, LogOut } from "lucide-react";

export default function Navegacao({ abaAtiva, setAbaAtiva }) {
  const { user, logout, isGestao } = useAuth();

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center shadow-md">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-lg uppercase tracking-wider">
          Sistema Escolar
        </h1>
        <span className="text-xs bg-blue-600 px-2.5 py-1 rounded-sm uppercase font-bold">
          {user?.cargo}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Tela do Professor: Acessível a todos */}
        <button
          onClick={() => setAbaAtiva("LANCAR_NOTAS")}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-sm flex items-center gap-2 transition cursor-pointer ${
            abaAtiva === "LANCAR_NOTAS"
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Área do Professor
        </button>

        {/* Telas restritas: Visíveis apenas para Coordenação e Direção */}
        {isGestao && (
          <>
            <button
              onClick={() => setAbaAtiva("RELATORIOS")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-sm flex items-center gap-2 transition cursor-pointer ${
                abaAtiva === "RELATORIOS"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <FileText className="w-4 h-4" /> Relatórios
            </button>

            <button
              onClick={() => setAbaAtiva("TURMAS")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-sm flex items-center gap-2 transition cursor-pointer ${
                abaAtiva === "TURMAS"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Users className="w-4 h-4" /> Turmas e Alunos
            </button>
          </>
        )}

        <button
          onClick={logout}
          className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
