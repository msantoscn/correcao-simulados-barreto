import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

export default function Inicio({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");

  // Filtra os simulados do bimestre escolhido (excluindo adaptados)
  const simuladosDoBimestre = bimestreSelecionado
    ? simulados.filter((s) => {
        const matchBimestre =
          String(s.bimestre) === String(bimestreSelecionado) || !s.bimestre;
        const nomeSim = String(s.nome || s.titulo || "").toUpperCase();
        const isAdaptadoFlag = typeof s.adaptado === "boolean" && s.adaptado;
        return (
          matchBimestre && !isAdaptadoFlag && !nomeSim.includes("ADAPTADO")
        );
      })
    : [];

  const temSimuladosNoBimestre = bimestreSelecionado
    ? simuladosDoBimestre.length > 0
    : false;

  // Separa os simulados entre Segunda-feira e Terça-feira com base no nome (ou divide em dois grupos)
  const simuladosSegunda = simuladosDoBimestre.filter((s) => {
    const nome = String(s.nome || s.titulo || "").toUpperCase();
    return (
      nome.includes("SEGUNDA") ||
      nome.includes("DIA 1") ||
      nome.includes("SIM I") ||
      (!nome.includes("TERÇA") &&
        !nome.includes("DIA 2") &&
        !nome.includes("SIM II"))
    );
  });

  const simuladosTerca = simuladosDoBimestre.filter((s) => {
    const nome = String(s.nome || s.titulo || "").toUpperCase();
    return (
      nome.includes("TERÇA") ||
      nome.includes("DIA 2") ||
      nome.includes("SIM II")
    );
  });

  // Função auxiliar para calcular o status das turmas para um dado conjunto de simulados
  const calcularStatusTurmas = (simuladosDoDia) => {
    const idsSimuladosDia = simuladosDoDia.map((s) => String(s.id));

    const respostasFiltradas = respostasAlunos.filter((r) => {
      const simId = String(r.simuladoId || r.idSimulado || "");
      return idsSimuladosDia.includes(simId);
    });

    return turmas.map((turma) => {
      const alunosDaTurma = turma.alunos || [];
      const totalAlunosTurma = alunosDaTurma.length;

      const respTurma = respostasFiltradas.filter(
        (r) =>
          String(r.turmaId) === String(turma.id) ||
          String(r.turma).trim().toUpperCase() ===
            String(turma.nome).trim().toUpperCase(),
      );

      const alunosAvaliadosUnicos = new Set(
        respTurma.map((r) =>
          String(r.nomeAluno || r.aluno)
            .trim()
            .toUpperCase(),
        ),
      );

      const qtdLancados = alunosAvaliadosUnicos.size;
      const qtdPendentes = Math.max(0, totalAlunosTurma - qtdLancados);

      let status = "Pendente";
      let badgeStyle = "bg-red-100 text-red-800 border-red-200";

      if (totalAlunosTurma > 0 && qtdLancados >= totalAlunosTurma) {
        status = "Concluído";
        badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
      } else if (qtdLancados > 0) {
        status = "Andamento";
        badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
      }

      return {
        id: turma.id,
        nome: turma.nome,
        qtdLancados,
        qtdPendentes,
        status,
        badgeStyle,
      };
    });
  };

  const statusSegunda = calcularStatusTurmas(simuladosSegunda);
  const statusTerca = calcularStatusTurmas(simuladosTerca);

  return (
    <div className="bg-white rounded-md shadow-sm p-3 sm:p-5 border border-[#dbc8b6] w-full max-w-7xl mx-auto font-sans antialiased space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dbc8b6] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-500 text-white rounded-md flex-shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-gray-800 truncate">
            STATUS DE{" "}
            <span className="text-red-500 font-bold">LANÇAMENTOS</span>
          </h2>
        </div>
      </div>

      {/* FILTRO DE BIMESTRE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
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
        /* BLOCOS LADO A LADO (COMPUTADOR) / EMPILHADOS (CELULAR) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* BLOCO 1: SEGUNDA-FEIRA */}
          <div className="border border-[#dbc8b6] rounded-md p-3 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbc8b6] bg-blue-50/50 p-2 rounded">
              <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" /> Segunda-feira
              </h3>
            </div>

            {statusSegunda.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
                Nenhuma turma cadastrada.
              </div>
            ) : (
              <div className="w-full overflow-x-hidden border border-[#dbc8b6] rounded-md shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#dbc8b6] font-bold text-gray-500 uppercase tracking-widest text-[9px] sm:text-[10px]">
                      <th className="p-2 border-r border-[#dbc8b6] w-[110px] sm:w-16">
                        Turma
                      </th>
                      <th className="p-2 border-r border-[#dbc8b6] text-center w-16">
                        Lanç.
                      </th>
                      <th className="p-2 border-r border-[#dbc8b6] text-center w-16">
                        Pend.
                      </th>
                      <th className="p-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbc8b6]">
                    {statusSegunda.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-amber-50/20 transition-colors"
                      >
                        <td className="p-2 font-bold text-gray-800 border-r border-[#dbc8b6] uppercase max-w-[110px] sm:max-w-xs break-words leading-tight">
                          {t.nome}
                        </td>
                        <td className="p-2 border-r border-[#dbc8b6] text-center font-bold text-emerald-700">
                          {t.qtdLancados}
                        </td>
                        <td className="p-2 border-r border-[#dbc8b6] text-center font-bold text-red-600">
                          {t.qtdPendentes}
                        </td>
                        <td className="p-2 text-center font-bold uppercase">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] inline-block border ${t.badgeStyle}`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BLOCO 2: TERÇA-FEIRA */}
          <div className="border border-[#dbc8b6] rounded-md p-3 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbc8b6] bg-emerald-50/50 p-2 rounded">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />{" "}
                Terça-feira
              </h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase"></span>
            </div>

            {statusTerca.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
                Nenhuma turma cadastrada.
              </div>
            ) : (
              <div className="w-full overflow-x-hidden border border-[#dbc8b6] rounded-md shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#dbc8b6] font-bold text-gray-500 uppercase tracking-widest text-[9px] sm:text-[10px]">
                      <th className="p-2 border-r border-[#dbc8b6] w-[110px] sm:w-16">
                        Turma
                      </th>
                      <th className="p-2 border-r border-[#dbc8b6] text-center w-16">
                        Lanç.
                      </th>
                      <th className="p-2 border-r border-[#dbc8b6] text-center w-16">
                        Pend.
                      </th>
                      <th className="p-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbc8b6]">
                    {statusTerca.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-amber-50/20 transition-colors"
                      >
                        <td className="p-2 font-bold text-gray-800 border-r border-[#dbc8b6] uppercase max-w-[110px] sm:max-w-xs break-words leading-tight">
                          {t.nome}
                        </td>
                        <td className="p-2 border-r border-[#dbc8b6] text-center font-bold text-emerald-700">
                          {t.qtdLancados}
                        </td>
                        <td className="p-2 border-r border-[#dbc8b6] text-center font-bold text-red-600">
                          {t.qtdPendentes}
                        </td>
                        <td className="p-2 text-center font-bold uppercase">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] inline-block border ${t.badgeStyle}`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
