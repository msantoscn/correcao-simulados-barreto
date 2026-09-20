import { useState } from "react";
import { FileSpreadsheet, Download, User } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");

  const turmaAtual = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );
  const simuladoAtual =
    simulados.find((s) => String(s.id) === String(simuladoSelecionadoId)) ||
    simulados[0];

  const disciplinasDoSimulado = Array.isArray(simuladoAtual?.disciplinas)
    ? simuladoAtual.disciplinas
    : typeof simuladoAtual?.disciplinas === "object" &&
        simuladoAtual?.disciplinas !== null
      ? Object.entries(simuladoAtual.disciplinas).map(([nome, dados]) => ({
          nome,
          ...dados,
        }))
      : [];

  const respostasDaTurma = respostasAlunos.filter((resp) => {
    if (!turmaSelecionadaId || !turmaAtual) return false;

    const matchTurma =
      String(resp.turmaId) === String(turmaSelecionadaId) ||
      String(resp.turma || "")
        .trim()
        .toUpperCase() ===
        String(turmaAtual.nome || "")
          .trim()
          .toUpperCase();

    const matchSimulado = simuladoSelecionadoId
      ? String(resp.simuladoId) === String(simuladoSelecionadoId) ||
        String(resp.simuladoNome || resp.simulado || "")
          .trim()
          .toUpperCase() ===
          String(simuladoAtual?.nome || simuladoAtual?.titulo || "")
            .trim()
            .toUpperCase()
      : true;

    return matchTurma && matchSimulado;
  });

  const totalQuestoesSimulado = disciplinasDoSimulado.reduce(
    (acc, d) =>
      acc + (d.gabarito?.length || d.questoes?.length || d.totalQuestoes || 0),
    0,
  );

  // Função para gerar e descarregar o PDF diretamente
  const gerarPDF = () => {
    if (!turmaAtual) return;

    const doc = new jsPDF("landscape"); // Documento na horizontal
    const nomeSimulado =
      simuladoAtual?.nome || simuladoAtual?.titulo || "Geral";

    // Cabeçalho do PDF
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("RESUMO DE DESEMPENHO DA TURMA", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Turma: ${turmaAtual.nome}   |   Simulado: ${nomeSimulado}`,
      14,
      28,
    );

    // Preparar as colunas da tabela do PDF
    const colunas = [
      { header: "ALUNO", dataKey: "aluno" },
      ...disciplinasDoSimulado.map((disc) => {
        const qtd =
          disc.gabarito?.length ||
          disc.questoes?.length ||
          disc.totalQuestoes ||
          disc.qtd ||
          0;
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

    // Preparar as linhas (dados) da tabela do PDF
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

      // Preencher notas por disciplina
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
          const qtd =
            disc.gabarito?.length ||
            disc.questoes?.length ||
            disc.totalQuestoes ||
            0;
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

      // Preencher Geral
      if (!respostaAluno || respostaAluno.totalAcertos === undefined) {
        linhaData.geral = "PENDENTE";
      } else {
        linhaData.geral = `${respostaAluno.totalAcertos}/${respostaAluno.totalQuestoes}\n(${respostaAluno.percentualGeral}%)`;
      }

      return linhaData;
    });

    // Gerar a tabela no PDF
    autoTable(doc, {
      startY: 35,
      columns: colunas,
      body: linhas,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 4,
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [30, 41, 59],
        fontStyle: "bold",
      },
      columnStyles: {
        aluno: { halign: "left", fontStyle: "bold", textColor: [51, 65, 85] },
      },
      alternateRowStyles: {
        fillColor: [250, 252, 255], // Cor de fundo subtil nas linhas pares
      },
    });

    // Descarregar o ficheiro com o nome personalizado
    doc.save(`Relatório de Notas ${turmaAtual.nome}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho e Filtros */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Relatório de
              Desempenho
            </h2>
          </div>

          {turmaSelecionadaId && (
            <button
              onClick={gerarPDF}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-sm flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Descarregar PDF
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
              1. Selecionar Turma
            </label>
            {turmas.length === 0 ? (
              <p className="text-sm text-amber-600 font-medium bg-amber-50 p-3 rounded-sm border border-amber-200">
                Nenhuma turma registada.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {turmas.map((turma) => (
                  <button
                    key={turma.id}
                    onClick={() => setTurmaSelecionadaId(String(turma.id))}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-sm transition cursor-pointer border ${
                      String(turmaSelecionadaId) === String(turma.id)
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {turma.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {turmaSelecionadaId && simulados.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                2. Selecionar Simulado
              </label>
              <select
                value={simuladoSelecionadoId || simuladoAtual?.id || ""}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-sm text-sm bg-white font-bold text-gray-700 uppercase outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
              >
                {simulados.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.nome || sim.titulo || "Simulado"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Visualização da Tabela no Ecrã */}
      {turmaSelecionadaId ? (
        <div className="w-full bg-white">
          <div className="flex items-center gap-2 mb-3 text-[#2c3e50]">
            <User className="w-5 h-5" />
            <h3 className="text-[13px] font-bold uppercase tracking-wide">
              Resumo de Desempenho da Turma
            </h3>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm uppercase font-bold border border-gray-200">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="border border-[#e2e8f0] p-3 align-middle bg-[#f8fafc]/50 w-[25%] sm:w-1/4">
                      <span className="text-[11px] font-bold text-gray-800 uppercase">
                        Aluno
                      </span>
                    </th>
                    {disciplinasDoSimulado.map((disc, idx) => {
                      const qtdQ =
                        disc.gabarito?.length ||
                        disc.questoes?.length ||
                        disc.totalQuestoes ||
                        disc.qtd ||
                        0;
                      return (
                        <th
                          key={idx}
                          className="border border-[#e2e8f0] p-2 text-center align-middle bg-[#f8fafc]/50"
                        >
                          <span
                            className="block text-[11px] font-bold text-gray-800 uppercase truncate"
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
                    <th className="border border-[#e2e8f0] p-2 text-center align-middle bg-[#f8fafc]/50 min-w-[110px]">
                      <span className="block text-[11px] font-bold text-gray-800 uppercase">
                        Geral (Total)
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal mt-0.5 block">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-gray-700">
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
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td
                          className="border border-[#e2e8f0] p-3 align-middle truncate"
                          title={nomeAluno}
                        >
                          <span className="text-[10px] text-[#64748b] font-bold mr-2">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-bold text-[#334155] uppercase">
                            {nomeAluno}
                          </span>
                        </td>
                        {disciplinasDoSimulado.map((disc, dIdx) => {
                          const qtdQ =
                            disc.gabarito?.length ||
                            disc.questoes?.length ||
                            disc.totalQuestoes ||
                            0;
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
                              if (chaveEncontrada)
                                resultadoDisc =
                                  containerDisciplinas[chaveEncontrada];
                            }
                          }

                          if (!respostaAluno || !resultadoDisc) {
                            return (
                              <td
                                key={dIdx}
                                className="border border-[#e2e8f0] p-3 text-center align-middle text-gray-300 font-medium"
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
                              className="border border-[#e2e8f0] p-2 text-center align-middle"
                            >
                              <div className="font-bold text-[#1e293b] text-[11px]">
                                {acertos}/{total}{" "}
                                <span className="text-[#3b82f6] ml-0.5 font-semibold">
                                  ({percentual}%)
                                </span>
                              </div>
                              <div className="mt-1 inline-block px-1.5 py-[1px] text-[#16a34a] border border-[#4ade80] bg-white rounded-[2px] text-[10px] font-bold tracking-wide">
                                NOTA: {nota}
                              </div>
                            </td>
                          );
                        })}
                        <td className="border border-[#e2e8f0] p-2 text-center align-middle">
                          {!respostaAluno ||
                          respostaAluno.totalAcertos === undefined ? (
                            <span className="text-[10px] uppercase font-bold text-[#cbd5e1]">
                              Pendente
                            </span>
                          ) : (
                            <div>
                              <div className="font-bold text-[#1e293b] text-[11px]">
                                {respostaAluno.totalAcertos}/
                                {respostaAluno.totalQuestoes}
                              </div>
                              <div className="text-[11px] text-[#3b82f6] font-semibold mt-0.5">
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
        <div className="bg-gray-50 p-16 rounded-sm border border-dashed border-gray-300 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Selecione uma turma para visualizar os resultados.
          </p>
        </div>
      )}
    </div>
  );
}
