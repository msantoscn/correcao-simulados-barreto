import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  User,
  Calendar,
  Layers,
  BookOpen,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");

  const turmaAtual = useMemo(
    () => turmas.find((t) => String(t.id) === String(turmaSelecionadaId)),
    [turmas, turmaSelecionadaId],
  );

  const idsSimuladosVinculados = useMemo(() => {
    if (!turmaAtual || !bimestreSelecionado) return [];
    return turmaAtual.simuladosVinculados?.[bimestreSelecionado] || [];
  }, [turmaAtual, bimestreSelecionado]);

  const simuladosDisponiveis = useMemo(() => {
    return simulados.filter((s) => idsSimuladosVinculados.includes(s.id));
  }, [simulados, idsSimuladosVinculados]);

  const simuladoAtual = useMemo(() => {
    return (
      simulados.find((s) => String(s.id) === String(simuladoSelecionadoId)) ||
      simuladosDisponiveis[0] ||
      null
    );
  }, [simulados, simuladoSelecionadoId, simuladosDisponiveis]);

  const disciplinasDoSimulado = useMemo(() => {
    if (!simuladoAtual?.disciplinas) return [];
    if (Array.isArray(simuladoAtual.disciplinas)) {
      return simuladoAtual.disciplinas;
    }
    if (typeof simuladoAtual.disciplinas === "object") {
      return Object.entries(simuladoAtual.disciplinas).map(([nome, dados]) => ({
        nome,
        ...dados,
      }));
    }
    return [];
  }, [simuladoAtual]);

  const respostasDaTurma = useMemo(() => {
    if (!turmaSelecionadaId || !turmaAtual || !simuladoAtual) return [];

    return respostasAlunos.filter((resp) => {
      const matchTurma =
        String(resp.turmaId) === String(turmaSelecionadaId) ||
        String(resp.turma || "")
          .trim()
          .toUpperCase() ===
          String(turmaAtual.nome || "")
            .trim()
            .toUpperCase();

      const matchSimulado =
        String(resp.simuladoId) === String(simuladoAtual.id) ||
        String(resp.simuladoNome || resp.simulado || "")
          .trim()
          .toUpperCase() ===
          String(simuladoAtual?.nome || simuladoAtual?.titulo || "")
            .trim()
            .toUpperCase();

      return matchTurma && matchSimulado;
    });
  }, [respostasAlunos, turmaSelecionadaId, turmaAtual, simuladoAtual]);

  const totalQuestoesSimulado = useMemo(() => {
    return disciplinasDoSimulado.reduce(
      (acc, d) =>
        acc +
        (d.gabarito?.length || d.questoes?.length || d.totalQuestoes || 0),
      0,
    );
  }, [disciplinasDoSimulado]);

  const getQtdQuestao = (disc) =>
    disc.gabarito?.length ||
    disc.questoes?.length ||
    disc.totalQuestoes ||
    disc.qtd ||
    0;

  const gerarPDF = () => {
    if (!turmaAtual || !simuladoAtual) return;

    const doc = new jsPDF("landscape");
    const nomeSimulado =
      simuladoAtual?.nome || simuladoAtual?.titulo || "Geral";

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("RESUMO DE DESEMPENHO DA TURMA", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Bimestre: ${bimestreSelecionado}º   |   Turma: ${turmaAtual.nome}   |   Simulado: ${nomeSimulado}`,
      14,
      21,
    );

    const colunas = [
      { header: "ALUNO", dataKey: "aluno" },
      ...disciplinasDoSimulado.map((disc) => {
        const qtd = getQtdQuestao(disc);
        return {
          header: `${String(disc.nome).toUpperCase()}\n(${qtd} Q)`,
          dataKey: disc.nome,
        };
      }),
      {
        header: `GERAL (TOTAL)\n(${totalQuestoesSimulado} Q)`,
        dataKey: "geral",
      },
    ];

    const linhas = turmaAtual.alunos.map((nomeAluno, index) => {
      const linhaData = {};
      const numAluno = String(index + 1).padStart(2, "0");
      linhaData.aluno = `${numAluno}  ${String(nomeAluno).toUpperCase()}`;

      const respostaAluno = respostasDaTurma.find(
        (r) =>
          String(r.nomeAluno || r.aluno || "")
            .trim()
            .toUpperCase() === String(nomeAluno).trim().toUpperCase(),
      );

      disciplinasDoSimulado.forEach((disc) => {
        let resultadoDisc = null;
        if (respostaAluno) {
          const container =
            respostaAluno.detalhes ||
            respostaAluno.disciplinas ||
            respostaAluno;
          if (container && typeof container === "object") {
            const chave = Object.keys(container).find(
              (k) =>
                k.trim().toUpperCase() ===
                String(disc.nome).trim().toUpperCase(),
            );
            if (chave) resultadoDisc = container[chave];
          }
        }

        if (!respostaAluno || !resultadoDisc) {
          linhaData[disc.nome] = "-";
        } else {
          const qtd = getQtdQuestao(disc);
          const acertos = resultadoDisc.acertos ?? 0;
          const total = resultadoDisc.total ?? qtd;
          const percentual =
            resultadoDisc.percentagem ??
            resultadoDisc.percentual ??
            (total > 0 ? Math.round((acertos / total) * 100) : 0);
          const nota = Number(resultadoDisc.nota ?? 0).toFixed(1);

          linhaData[disc.nome] =
            `${acertos}/${total} (${percentual}%)\nNOTA: ${nota}`;
        }
      });

      if (!respostaAluno || respostaAluno.totalAcertos === undefined) {
        linhaData.geral = "PENDENTE";
      } else {
        linhaData.geral = `${respostaAluno.totalAcertos}/${respostaAluno.totalQuestoes}\n(${respostaAluno.percentualGeral}%)`;
      }

      return linhaData;
    });

    autoTable(doc, {
      startY: 25,
      columns: colunas,
      body: linhas,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      columnStyles: {
        aluno: { halign: "left", fontStyle: "bold", textColor: [51, 65, 85] },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`Relatório_${turmaAtual.nome}_${nomeSimulado}.pdf`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Cabeçalho e Filtros Compactos */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#4b82f6]" /> Relatório
              de Desempenho
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Filtre por bimestre, turma e simulado.
            </p>
          </div>

          {turmaSelecionadaId && simuladoAtual && (
            <button
              onClick={gerarPDF}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4b82f6]" /> 1. Bimestre
            </label>
            <select
              value={bimestreSelecionado}
              onChange={(e) => {
                setBimestreSelecionado(e.target.value);
                setTurmaSelecionadaId("");
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 uppercase outline-none focus:border-[#4b82f6] transition shadow-xs cursor-pointer"
            >
              <option value="">Selecione...</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#4b82f6]" /> 2. Turma
            </label>
            <select
              disabled={!bimestreSelecionado || turmas.length === 0}
              value={turmaSelecionadaId}
              onChange={(e) => {
                setTurmaSelecionadaId(e.target.value);
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 uppercase outline-none focus:border-[#4b82f6] transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecione...</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#4b82f6]" /> 3. Simulado
            </label>
            <select
              disabled={
                !turmaSelecionadaId || simuladosDisponiveis.length === 0
              }
              value={simuladoSelecionadoId || simuladoAtual?.id || ""}
              onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 uppercase outline-none focus:border-[#4b82f6] transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {simuladosDisponiveis.length === 0
                  ? "Nenhum vinculado"
                  : "Selecione..."}
              </option>
              {simuladosDisponiveis.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.nome || sim.titulo || "Simulado"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela Responsiva */}
      {turmaSelecionadaId && simuladoAtual ? (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-2 mb-4 text-slate-800 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-[#4b82f6]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Desempenho:{" "}
              <span className="text-[#4b82f6]">{turmaAtual?.nome}</span> (
              {simuladoAtual.nome || simuladoAtual.titulo})
            </h3>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs uppercase font-bold border border-dashed border-slate-200 rounded-xl">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse bg-white whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="p-3.5 align-middle text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Aluno
                    </th>
                    {disciplinasDoSimulado.map((disc, idx) => {
                      const qtdQ = getQtdQuestao(disc);
                      return (
                        <th
                          key={idx}
                          className="p-3 text-center align-middle text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200"
                        >
                          <span
                            className="block text-slate-700 truncate max-w-[120px]"
                            title={disc.nome}
                          >
                            {disc.nome}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal mt-0.5 block">
                            ({qtdQ} Q)
                          </span>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center align-middle text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 bg-blue-50/30">
                      <span className="block text-blue-700">Geral</span>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5 block">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {turmaAtual.alunos.map((nomeAluno, index) => {
                    const respostaAluno = respostasDaTurma.find(
                      (r) =>
                        String(r.nomeAluno || r.aluno || "")
                          .trim()
                          .toUpperCase() ===
                        String(nomeAluno).trim().toUpperCase(),
                    );

                    return (
                      <tr
                        key={index}
                        className="hover:bg-blue-50/20 transition-colors"
                      >
                        <td className="p-3.5 align-middle font-bold text-slate-700 uppercase">
                          <span className="text-[10px] text-slate-400 font-mono mr-2">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {nomeAluno}
                        </td>

                        {disciplinasDoSimulado.map((disc, dIdx) => {
                          const qtdQ = getQtdQuestao(disc);
                          let resultadoDisc = null;

                          if (respostaAluno) {
                            const containerDisciplinas =
                              respostaAluno.detalhes ||
                              respostaAluno.disciplinas ||
                              respostaAluno;

                            if (
                              containerDisciplinas &&
                              typeof containerDisciplinas === "object"
                            ) {
                              const chaveEncontrada = Object.keys(
                                containerDisciplinas,
                              ).find(
                                (k) =>
                                  k.trim().toUpperCase() ===
                                  String(disc.nome).trim().toUpperCase(),
                              );
                              if (chaveEncontrada) {
                                resultadoDisc =
                                  containerDisciplinas[chaveEncontrada];
                              }
                            }
                          }

                          if (!respostaAluno || !resultadoDisc) {
                            return (
                              <td
                                key={dIdx}
                                className="p-3 text-center align-middle text-slate-300 font-bold border-l border-slate-200"
                              >
                                -
                              </td>
                            );
                          }

                          const acertos = resultadoDisc.acertos ?? 0;
                          const total = resultadoDisc.total ?? qtdQ;
                          const percentual =
                            resultadoDisc.percentagem ??
                            resultadoDisc.percentual ??
                            (total > 0
                              ? Math.round((acertos / total) * 100)
                              : 0);
                          const nota = Number(resultadoDisc.nota ?? 0).toFixed(
                            1,
                          );

                          return (
                            <td
                              key={dIdx}
                              className="p-3 text-center align-middle border-l border-slate-200"
                            >
                              <div className="font-bold text-slate-700 text-xs">
                                {acertos}/{total}{" "}
                                <span className="text-[#4b82f6] font-semibold">
                                  ({percentual}%)
                                </span>
                              </div>
                              <div className="mt-1 inline-block px-1.5 py-0.5 text-emerald-700 border border-emerald-200 bg-emerald-50 rounded text-[9px] font-bold">
                                Nota: {nota}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-3 text-center align-middle border-l border-slate-200 bg-blue-50/20">
                          {!respostaAluno ||
                          respostaAluno.totalAcertos === undefined ? (
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Pendente
                            </span>
                          ) : (
                            <div>
                              <div className="font-bold text-slate-700 text-xs">
                                {respostaAluno.totalAcertos}/
                                {respostaAluno.totalQuestoes}
                              </div>
                              <div className="text-[10px] text-[#4b82f6] font-bold mt-0.5">
                                ({respostaAluno.percentualGeral}%)
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Selecione o bimestre, turma e simulado para ver os resultados.
          </p>
        </div>
      )}
    </div>
  );
}
