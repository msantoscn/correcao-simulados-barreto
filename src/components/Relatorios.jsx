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

  // Turma atual memoizada
  const turmaAtual = useMemo(
    () => turmas.find((t) => String(t.id) === String(turmaSelecionadaId)),
    [turmas, turmaSelecionadaId],
  );

  // Lista de IDs dos simulados vinculados à turma selecionada neste bimestre
  const idsSimuladosVinculados = useMemo(() => {
    if (!turmaAtual || !bimestreSelecionado) return [];
    return turmaAtual.simuladosVinculados?.[bimestreSelecionado] || [];
  }, [turmaAtual, bimestreSelecionado]);

  // Lista de objetos de simulados que estão efetivamente vinculados
  const simuladosDisponiveis = useMemo(() => {
    return simulados.filter((s) => idsSimuladosVinculados.includes(s.id));
  }, [simulados, idsSimuladosVinculados]);

  // Simulado atual memoizado
  const simuladoAtual = useMemo(() => {
    return (
      simulados.find((s) => String(s.id) === String(simuladoSelecionadoId)) ||
      simuladosDisponiveis[0] ||
      null
    );
  }, [simulados, simuladoSelecionadoId, simuladosDisponiveis]);

  // Normalização das disciplinas do simulado
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

  // Filtragem das respostas da turma
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

  // Função para gerar e descarregar o PDF
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Cabeçalho e Seletores em Menu Suspenso (Select) */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Relatório de
              Desempenho
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Selecione o bimestre, a turma e o simulado para consultar os
              resultados.
            </p>
          </div>

          {turmaSelecionadaId && simuladoAtual && (
            <button
              onClick={gerarPDF}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Descarregar PDF
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* PASSO 1: SELECIONAR BIMESTRE */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> 1. Selecionar
              Bimestre
            </label>
            <select
              value={bimestreSelecionado}
              onChange={(e) => {
                setBimestreSelecionado(e.target.value);
                setTurmaSelecionadaId("");
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 uppercase outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs cursor-pointer"
            >
              <option value="">-- Selecione o Bimestre --</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
          </div>

          {/* PASSO 2: SELECIONAR TURMA (Habilitado apenas se houver bimestre) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> 2. Selecionar
              Turma
            </label>
            <select
              disabled={!bimestreSelecionado || turmas.length === 0}
              value={turmaSelecionadaId}
              onChange={(e) => {
                setTurmaSelecionadaId(e.target.value);
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 uppercase outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Selecione a Turma --</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          {/* PASSO 3: SELECIONAR SIMULADO VINCULADO (Habilitado apenas se houver turma) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> 3. Simulado
              Vinculado
            </label>
            <select
              disabled={
                !turmaSelecionadaId || simuladosDisponiveis.length === 0
              }
              value={simuladoSelecionadoId || simuladoAtual?.id || ""}
              onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 uppercase outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {simuladosDisponiveis.length === 0
                  ? "-- Nenhum simulado vinculado --"
                  : "-- Selecione o Simulado --"}
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

      {/* Tabela de Visualização dos Resultados */}
      {turmaSelecionadaId && simuladoAtual ? (
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4 text-gray-800 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Desempenho da Turma:{" "}
                <span className="text-blue-600">{turmaAtual?.nome}</span>
                <span className="text-gray-400 font-normal ml-2">
                  ({simuladoAtual.nome || simuladoAtual.titulo})
                </span>
              </h3>
            </div>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs uppercase font-bold border border-dashed border-gray-200 rounded-lg">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left border-collapse bg-white whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200">
                    <th className="p-3.5 align-middle w-1/4 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Aluno
                    </th>
                    {disciplinasDoSimulado.map((disc, idx) => {
                      const qtdQ = getQtdQuestao(disc);
                      return (
                        <th
                          key={idx}
                          className="p-3 text-center align-middle text-[11px] font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200"
                        >
                          <span
                            className="block truncate max-w-[140px]"
                            title={disc.nome}
                          >
                            {disc.nome}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal mt-0.5 block">
                            ({qtdQ} Q)
                          </span>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center align-middle text-[11px] font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200 min-w-[110px]">
                      <span className="block">Geral (Total)</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-0.5 block">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 divide-y divide-gray-200">
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
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="p-3.5 align-middle font-medium">
                          <span className="text-[10px] text-gray-400 font-bold mr-2.5">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-bold text-gray-800 uppercase">
                            {nomeAluno}
                          </span>
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
                                className="p-3 text-center align-middle text-gray-300 font-medium border-l border-gray-200"
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
                              className="p-3 text-center align-middle border-l border-gray-200"
                            >
                              <div className="font-bold text-gray-800 text-[11px]">
                                {acertos}/{total}{" "}
                                <span className="text-blue-600 ml-0.5 font-semibold">
                                  ({percentual}%)
                                </span>
                              </div>
                              <div className="mt-1 inline-block px-1.5 py-0.5 text-emerald-600 border border-emerald-200 bg-emerald-50/50 rounded text-[10px] font-bold tracking-wide">
                                NOTA: {nota}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-3 text-center align-middle border-l border-gray-200 bg-gray-50/50">
                          {!respostaAluno ||
                          respostaAluno.totalAcertos === undefined ? (
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Pendente
                            </span>
                          ) : (
                            <div>
                              <div className="font-bold text-gray-800 text-[11px]">
                                {respostaAluno.totalAcertos}/
                                {respostaAluno.totalQuestoes}
                              </div>
                              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
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
        <div className="bg-white p-16 rounded-xl border border-dashed border-gray-200 text-center shadow-xs">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {!bimestreSelecionado
              ? "Selecione o bimestre para começar."
              : !turmaSelecionadaId
                ? "Selecione a turma para prosseguir."
                : "Selecione um simulado vinculado para visualizar os resultados."}
          </p>
        </div>
      )}
    </div>
  );
}
