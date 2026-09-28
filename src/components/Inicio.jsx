import { useState } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function Inicio({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");

  // Filtra os simulados do bimestre escolhido (se houver um selecionado)
  const simuladosDoBimestre = bimestreSelecionado
    ? simulados.filter(
        (s) =>
          String(s.bimestre) === String(bimestreSelecionado) || !s.bimestre,
      )
    : [];
  const simuladoIdsDoBimestre = simuladosDoBimestre.map((s) => String(s.id));

  const temSimuladosNoBimestre = bimestreSelecionado
    ? simuladosDoBimestre.length > 0
    : false;

  // Respostas estritamente do bimestre selecionado
  const respostasFiltradas = bimestreSelecionado
    ? respostasAlunos.filter((r) => {
        const simId = String(r.simuladoId || r.idSimulado || "");
        return simuladoIdsDoBimestre.includes(simId);
      })
    : [];

  // Processa o status de cada turma
  const turmasStatus = turmas.map((turma) => {
    const alunosDaTurma = turma.alunos || [];
    const totalAlunosTurma = alunosDaTurma.length;

    // Respostas desta turma específica no bimestre
    const respTurma = respostasFiltradas.filter(
      (r) =>
        String(r.turmaId) === String(turma.id) ||
        String(r.turma).trim().toUpperCase() ===
          String(turma.nome).trim().toUpperCase(),
    );

    // Alunos únicos que já possuem lançamento
    const alunosAvaliadosUnicos = new Set(
      respTurma.map((r) =>
        String(r.nomeAluno || r.aluno)
          .trim()
          .toUpperCase(),
      ),
    );

    const qtdLancados = alunosAvaliadosUnicos.size;
    const qtdPendentes = Math.max(0, totalAlunosTurma - qtdLancados);

    let status = "pendente"; // "concluido", "parcial", "pendente"
    if (totalAlunosTurma > 0 && qtdLancados >= totalAlunosTurma) {
      status = "concluido";
    } else if (qtdLancados > 0) {
      status = "parcial";
    }

    return {
      id: turma.id,
      nome: turma.nome,
      qtdLancados,
      qtdPendentes,
      status,
    };
  });

  return (
    <div className="bg-white rounded-md shadow-sm p-3 sm:p-5 border border-[#dbc8b6] w-full max-w-7xl mx-auto font-sans antialiased space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dbc8b6] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-500 text-white rounded-md flex-shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-gray-800 truncate">
            TELA DE <span className="text-red-500 font-bold">INÍCIO</span>
          </h2>
        </div>
      </div>

      {/* FILTRO DE BIMESTRE OTIMIZADO PARA TOUCH (iOS / Android) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Selecione o
            bimestre:
          </label>
          <select
            value={bimestreSelecionado}
            onChange={(e) => setBimestreSelecionado(e.target.value)}
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
            className="w-full sm:w-auto p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="">Selecione o bimestre...</option>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>
      </div>

      {/* CONTEÚDO EXIBIDO APÓS A SELEÇÃO DO BIMESTRE */}
      {!bimestreSelecionado ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50 px-4">
          Selecione o bimestre acima para visualizar o acompanhamento de
          lançamentos.
        </div>
      ) : !temSimuladosNoBimestre ? (
        <div className="text-center py-10 px-4 text-amber-800 bg-amber-50/60 border border-amber-200 rounded-md space-y-2">
          <div className="flex justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
            Sem simulados cadastrados
          </h3>
          <p className="text-[11px] text-amber-700 uppercase font-semibold">
            Não existem simulados registados para o {bimestreSelecionado}º
            bimestre.
          </p>
        </div>
      ) : (
        /* LISTAGEM DETALHADA POR TURMA */
        <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-white space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" /> Acompanhamento de
            Lançamentos por Turma
          </h3>

          {turmasStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
              Nenhuma turma cadastrada no sistema.
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-[#dbc8b6] rounded-md shadow-xs">
              <table className="w-full min-w-[400px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#dbc8b6] font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                    <th className="p-2.5 border-r border-[#dbc8b6] w-2/5 sm:w-auto">
                      Turma
                    </th>
                    <th className="p-2.5 border-r border-[#dbc8b6] text-center whitespace-nowrap">
                      Lançados
                    </th>
                    <th className="p-2.5 border-r border-[#dbc8b6] text-center whitespace-nowrap">
                      Pendentes
                    </th>
                    <th className="p-2.5 text-center whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbc8b6]">
                  {turmasStatus.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-amber-50/20 transition-colors"
                    >
                      <td className="p-2.5 font-bold text-gray-800 border-r border-[#dbc8b6] uppercase max-w-[140px] sm:max-w-xs break-words leading-tight">
                        {t.nome}
                      </td>
                      <td className="p-2.5 border-r border-[#dbc8b6] text-center font-bold text-emerald-700">
                        {t.qtdLancados}
                      </td>
                      <td className="p-2.5 border-r border-[#dbc8b6] text-center font-bold text-red-600">
                        {t.qtdPendentes}
                      </td>
                      <td className="p-2.5 text-center font-bold uppercase whitespace-nowrap">
                        {t.status === "concluido" && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] inline-flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                          </span>
                        )}
                        {t.status === "parcial" && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] inline-flex items-center gap-1 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Em Andamento
                          </span>
                        )}
                        {t.status === "pendente" && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] inline-flex items-center gap-1 border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5" /> Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
