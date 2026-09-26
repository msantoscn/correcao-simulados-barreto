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
    if (simuladoSelecionadoId === "GERAL") return "GERAL";
    return (
      simulados.find((s) => String(s.id) === String(simuladoSelecionadoId)) ||
      simuladosDisponiveis[0] ||
      null
    );
  }, [simulados, simuladoSelecionadoId, simuladosDisponiveis]);

  const disciplinasDoSimulado = useMemo(() => {
    if (!simuladoAtual) return [];

    if (simuladoAtual === "GERAL") {
      const mapaDisciplinas = new Map();
      simuladosDisponiveis.forEach((sim) => {
        const discList = Array.isArray(sim.disciplinas)
          ? sim.disciplinas
          : Object.entries(sim.disciplinas || {}).map(([nome, dados]) => ({
              nome,
              ...dados,
            }));

        discList.forEach((d) => {
          const nomeDisc = String(d.nome).trim().toUpperCase();
          const qtd =
            d.gabarito?.length ||
            d.questoes?.length ||
            d.totalQuestoes ||
            d.qtd ||
            0;
          if (!mapaDisciplinas.has(nomeDisc)) {
            mapaDisciplinas.set(nomeDisc, {
              ...d,
              nome: d.nome,
              totalQuestoes: qtd,
            });
          } else {
            const existente = mapaDisciplinas.get(nomeDisc);
            existente.totalQuestoes += qtd;
          }
        });
      });
      return Array.from(mapaDisciplinas.values());
    }

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
  }, [simuladoAtual, simuladosDisponiveis]);

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

      if (!matchTurma) return false;

      if (simuladoAtual === "GERAL") {
        return simuladosDisponiveis.some(
          (s) =>
            String(resp.simuladoId) === String(s.id) ||
            String(resp.simuladoNome || resp.simulado || "")
              .trim()
              .toUpperCase() ===
              String(s.nome || s.titulo || "")
                .trim()
                .toUpperCase(),
        );
      }

      const matchSimulado =
        String(resp.simuladoId) === String(simuladoAtual.id) ||
        String(resp.simuladoNome || resp.simulado || "")
          .trim()
          .toUpperCase() ===
          String(simuladoAtual?.nome || simuladoAtual?.titulo || "")
            .trim()
            .toUpperCase();

      return matchSimulado;
    });
  }, [
    respostasAlunos,
    turmaSelecionadaId,
    turmaAtual,
    simuladoAtual,
    simuladosDisponiveis,
  ]);

  const totalQuestoesSimulado = useMemo(() => {
    return disciplinasDoSimulado.reduce(
      (acc, d) =>
        acc +
        (d.totalQuestoes || d.gabarito?.length || d.questoes?.length || 0),
      0,
    );
  }, [disciplinasDoSimulado]);

  const getQtdQuestao = (disc) =>
    disc.totalQuestoes ||
    disc.gabarito?.length ||
    disc.questoes?.length ||
    disc.qtd ||
    0;

  const gerarPDF = () => {
    if (!turmaAtual || !simuladoAtual) return;

    const doc = new jsPDF("landscape", "mm", "a4");
    const nomeSimulado =
      simuladoAtual === "GERAL"
        ? "GERAL"
        : simuladoAtual?.nome || simuladoAtual?.titulo || "Geral";

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("RESUMO DE DESEMPENHO DA TURMA", 10, 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Bimestre: ${bimestreSelecionado}º    |    Turma: ${turmaAtual.nome}    |    Simulado: ${nomeSimulado}`,
      10,
      15,
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
        header: `GERAL\n(${totalQuestoesSimulado} Q)`,
        dataKey: "geral",
      },
    ];

    const linhas = turmaAtual.alunos.map((nomeAluno, index) => {
      const linhaData = {};
      const numAluno = String(index + 1).padStart(2, "0");
      linhaData.aluno = `${numAluno}  ${String(nomeAluno).toUpperCase()}`;

      const respostasDoAluno = respostasDaTurma.filter(
        (r) =>
          String(r.nomeAluno || r.aluno || "")
            .trim()
            .toUpperCase() === String(nomeAluno).trim().toUpperCase(),
      );

      disciplinasDoSimulado.forEach((disc) => {
        let acertosTotalDisc = 0;
        let totalDisc = getQtdQuestao(disc);
        let encontrouAlguma = false;

        respostasDoAluno.forEach((resp) => {
          const container = resp.detalhes || resp.disciplinas || resp;
          if (container && typeof container === "object") {
            const chave = Object.keys(container).find(
              (k) =>
                k.trim().toUpperCase() ===
                String(disc.nome).trim().toUpperCase(),
            );
            if (chave && container[chave]) {
              encontrouAlguma = true;
              acertosTotalDisc += container[chave].acertos ?? 0;
            }
          }
        });

        if (!encontrouAlguma) {
          linhaData[disc.nome] = "-";
        } else {
          const percentual =
            totalDisc > 0
              ? Math.round((acertosTotalDisc / totalDisc) * 100)
              : 0;
          const nota =
            totalDisc > 0
              ? ((acertosTotalDisc / totalDisc) * 10).toFixed(1)
              : "0.0";
          linhaData[disc.nome] =
            `${acertosTotalDisc}/${totalDisc} (${percentual}%)\nNOTA: ${nota}`;
        }
      });

      if (respostasDoAluno.length === 0) {
        linhaData.geral = "PENDENTE";
      } else {
        const somaAcertos = respostasDoAluno.reduce(
          (acc, r) => acc + (r.totalAcertos || 0),
          0,
        );
        const somaQuestoes = totalQuestoesSimulado;
        const percentGeral =
          somaQuestoes > 0 ? Math.round((somaAcertos / somaQuestoes) * 100) : 0;
        linhaData.geral = `${somaAcertos}/${somaQuestoes}\n(${percentGeral}%)`;
      }

      return linhaData;
    });

    // CÁLCULO DINÂMICO SEGURO PARA CABER NA PÁGINA (A4 Landscape = 297mm largura total)
    const larguraUtil = 287; // Deixando 5mm de margem em cada lado (10mm total)
    const totalColunasNotas = disciplinasDoSimulado.length + 1; // Disciplinas + coluna Geral

    // Aloca um espaço adaptativo para o nome do aluno e para as colunas de notas
    let larguraAluno = 55;
    let larguraColunaNota = (larguraUtil - larguraAluno) / totalColunasNotas;

    if (larguraColunaNota < 14) {
      larguraColunaNota = 14; // Tamanho mínimo seguro para caber tudo sem cortar
      larguraAluno = Math.max(
        45,
        larguraUtil - larguraColunaNota * totalColunasNotas,
      );
    }

    const columnStylesConfig = {
      aluno: {
        cellWidth: larguraAluno,
        halign: "left",
        fontStyle: "bold",
        textColor: [51, 65, 85],
      },
      geral: { cellWidth: larguraColunaNota, halign: "center" },
    };

    disciplinasDoSimulado.forEach((disc) => {
      columnStylesConfig[disc.nome] = {
        cellWidth: larguraColunaNota,
        halign: "center",
      };
    });

    autoTable(doc, {
      startY: 19,
      columns: colunas,
      body: linhas,
      theme: "grid",
      margin: { left: 5, right: 5 },
      styles: {
        fontSize: 5.5, // Fonte levemente menor para acomodar muitas colunas sem transbordar
        cellPadding: { top: 1, bottom: 1, left: 0.3, right: 0.3 },
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
        cellPadding: { top: 1.5, bottom: 1.5, left: 0.3, right: 0.3 },
      },
      columnStyles: columnStylesConfig,
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`Relatório_${turmaAtual.nome}_${nomeSimulado}.pdf`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto w-full font-sans antialiased">
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" /> RELATÓRIO DE{" "}
              <span className="text-red-500 font-bold">DESEMPENHO</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
              Filtre por bimestre, turma e simulado.
            </p>
          </div>

          {turmaSelecionadaId && simuladoAtual && (
            <button
              onClick={gerarPDF}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase rounded-md flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> 1. Bimestre
            </label>
            <select
              value={bimestreSelecionado}
              onChange={(e) => {
                setBimestreSelecionado(e.target.value);
                setTurmaSelecionadaId("");
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer"
            >
              <option value="">Selecione...</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> 2. Turma
            </label>
            <select
              disabled={!bimestreSelecionado || turmas.length === 0}
              value={turmaSelecionadaId}
              onChange={(e) => {
                setTurmaSelecionadaId(e.target.value);
                setSimuladoSelecionadoId("");
              }}
              className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> 3. Simulado
            </label>
            <select
              disabled={
                !turmaSelecionadaId || simuladosDisponiveis.length === 0
              }
              value={simuladoSelecionadoId}
              onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {simuladosDisponiveis.length === 0
                  ? "Nenhum vinculado"
                  : "Selecione..."}
              </option>
              {simuladosDisponiveis.length > 1 && (
                <option value="GERAL">Geral</option>
              )}
              {simuladosDisponiveis.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.nome || sim.titulo || "Simulado"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {turmaSelecionadaId && simuladoAtual ? (
        <div className="bg-white p-4 sm:p-6 rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-800 pb-3 border-b border-gray-200">
            <User className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Desempenho:{" "}
              <span className="text-blue-600">{turmaAtual?.nome}</span> (
              {simuladoAtual === "GERAL"
                ? "Geral"
                : simuladoAtual.nome || simuladoAtual.titulo}
              )
            </h3>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs uppercase font-bold border border-dashed border-gray-200 rounded-md">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-2.5 align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[220px]">
                      Aluno
                    </th>
                    {disciplinasDoSimulado.map((disc, idx) => {
                      const qtdQ = getQtdQuestao(disc);
                      return (
                        <th
                          key={idx}
                          className="p-1.5 text-center align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-gray-200 min-w-[85px]"
                        >
                          <span
                            className="block text-gray-800 whitespace-normal leading-tight font-bold"
                            title={disc.nome}
                          >
                            {disc.nome}
                          </span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 block">
                            ({qtdQ} Q)
                          </span>
                        </th>
                      );
                    })}
                    <th className="p-1.5 text-center align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-gray-200 bg-blue-50/40 min-w-[85px]">
                      <span className="block text-blue-700 whitespace-normal leading-tight font-bold">
                        Geral
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal mt-0.5 block">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 divide-y divide-gray-200">
                  {turmaAtual.alunos.map((nomeAluno, index) => {
                    const respostasDoAluno = respostasDaTurma.filter(
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
                        <td className="p-2.5 align-middle font-bold text-gray-800 uppercase min-w-[220px]">
                          <span className="text-[10px] text-gray-400 font-mono mr-2">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {nomeAluno}
                        </td>

                        {disciplinasDoSimulado.map((disc, dIdx) => {
                          const qtdQ = getQtdQuestao(disc);
                          let acertosTotalDisc = 0;
                          let totalDisc = qtdQ;
                          let encontrouAlguma = false;

                          respostasDoAluno.forEach((resp) => {
                            const containerDisciplinas =
                              resp.detalhes || resp.disciplinas || resp;

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
                              if (
                                chaveEncontrada &&
                                containerDisciplinas[chaveEncontrada]
                              ) {
                                encontrouAlguma = true;
                                acertosTotalDisc +=
                                  containerDisciplinas[chaveEncontrada]
                                    .acertos ?? 0;
                              }
                            }
                          });

                          if (!encontrouAlguma) {
                            return (
                              <td
                                key={dIdx}
                                className="p-1.5 text-center align-middle text-gray-300 font-bold border-l border-gray-200 min-w-[85px]"
                              >
                                -
                              </td>
                            );
                          }

                          const percentual =
                            totalDisc > 0
                              ? Math.round((acertosTotalDisc / totalDisc) * 100)
                              : 0;
                          const nota =
                            totalDisc > 0
                              ? ((acertosTotalDisc / totalDisc) * 10).toFixed(1)
                              : "0.0";

                          return (
                            <td
                              key={dIdx}
                              className="p-1.5 text-center align-middle border-l border-gray-200 min-w-[85px]"
                            >
                              <div className="font-bold text-gray-800 text-[10px]">
                                {acertosTotalDisc}/{totalDisc}{" "}
                                <span className="text-blue-600 font-semibold">
                                  ({percentual}%)
                                </span>
                              </div>
                              <div className="mt-0.5 inline-block px-1 py-0.2 text-emerald-700 border border-emerald-200 bg-emerald-50 rounded text-[8px] font-bold">
                                Nota: {nota}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-1.5 text-center align-middle border-l border-gray-200 bg-blue-50/20 min-w-[85px]">
                          {respostasDoAluno.length === 0 ? (
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Pendente
                            </span>
                          ) : (
                            <div>
                              <div className="font-bold text-gray-800 text-[10px]">
                                {respostasDoAluno.reduce(
                                  (acc, r) => acc + (r.totalAcertos || 0),
                                  0,
                                )}
                                /{totalQuestoesSimulado}
                              </div>
                              <div className="text-[9px] text-blue-600 font-bold mt-0.5">
                                (
                                {Math.round(
                                  (respostasDoAluno.reduce(
                                    (acc, r) => acc + (r.totalAcertos || 0),
                                    0,
                                  ) /
                                    (totalQuestoesSimulado || 1)) *
                                    100,
                                )}
                                %)
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
        <div className="bg-white p-12 rounded-md border border-dashed border-gray-200 text-center shadow-sm">
          <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Selecione o bimestre, turma e simulado para ver os resultados.
          </p>
        </div>
      )}
    </div>
  );
}
