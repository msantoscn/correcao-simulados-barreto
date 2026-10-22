import { useState, useMemo, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  User,
  Calendar,
  Layers,
  BookOpen,
  AlertTriangle,
  BarChart2,
  Filter,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Relatorios({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [tipoRelatorio, setTipoRelatorio] = useState("desempenho"); // "desempenho" | "reprovacao"

  // ==========================================
  // ESTADOS DA ABA: DESEMPENHO
  // ==========================================
  const [bimestreSelecionado, setBimestreSelecionado] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");

  const getNomeAluno = (aluno) => {
    if (!aluno) return "";
    if (typeof aluno === "string") return aluno;
    return aluno.nome || "";
  };

  const turmaAtual = useMemo(
    () => turmas.find((t) => String(t.id) === String(turmaSelecionadaId)),
    [turmas, turmaSelecionadaId],
  );

  const idsSimuladosVinculados = useMemo(() => {
    if (!turmaAtual || !bimestreSelecionado) return [];
    const lista = turmaAtual.simuladosVinculados?.[bimestreSelecionado] || [];
    return lista.map((id) => String(id));
  }, [turmaAtual, bimestreSelecionado]);

  const simuladosDisponiveis = useMemo(() => {
    return simulados.filter((s) =>
      idsSimuladosVinculados.includes(String(s.id)),
    );
  }, [simulados, idsSimuladosVinculados]);

  const simuladoAtual = useMemo(() => {
    if (!simuladoSelecionadoId) return null;
    if (simuladoSelecionadoId === "GERAL") return "GERAL";
    return (
      simulados.find((s) => String(s.id) === String(simuladoSelecionadoId)) ||
      null
    );
  }, [simulados, simuladoSelecionadoId]);

  const extrairDisciplinasDoSim = (sim) => {
    if (!sim) return [];
    if (Array.isArray(sim.disciplinas)) {
      return sim.disciplinas.map((d) =>
        typeof d === "string" ? { nome: d } : d,
      );
    }
    if (sim.disciplinas && typeof sim.disciplinas === "object") {
      return Object.entries(sim.disciplinas).map(([nome, dados]) => ({
        nome,
        ...(dados || {}),
      }));
    }
    return [];
  };

  const disciplinasDoSimulado = useMemo(() => {
    try {
      if (!simuladoAtual) return [];

      if (simuladoAtual === "GERAL") {
        const simuladosOrdenados = [...simuladosDisponiveis].sort((a, b) => {
          const nomeA = String(a.nome || a.titulo || "").toUpperCase();
          const nomeB = String(b.nome || b.titulo || "").toUpperCase();

          const ehTercaA =
            nomeA.includes("TERÇA") ||
            nomeA.includes("TERCA") ||
            nomeA.includes("DIA 2") ||
            nomeA.includes("SIM II") ||
            nomeA.includes("PARTE 2");

          const ehTercaB =
            nomeB.includes("TERÇA") ||
            nomeB.includes("TERCA") ||
            nomeB.includes("DIA 2") ||
            nomeB.includes("SIM II") ||
            nomeB.includes("PARTE 2");

          if (!ehTercaA && ehTercaB) return -1;
          if (ehTercaA && !ehTercaB) return 1;
          return 0;
        });

        const mapaDisciplinas = new Map();

        simuladosOrdenados.forEach((sim) => {
          const discList = extrairDisciplinasDoSim(sim);
          discList.forEach((d) => {
            if (!d) return;
            const nomeDisc = String(d.nome || "")
              .trim()
              .toUpperCase();
            if (!nomeDisc) return;

            const qtd =
              d.gabarito?.length ||
              d.questoes?.length ||
              d.totalQuestoes ||
              d.qtd ||
              0;

            if (!mapaDisciplinas.has(nomeDisc)) {
              mapaDisciplinas.set(nomeDisc, {
                nome: d.nome || nomeDisc,
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

      return extrairDisciplinasDoSim(simuladoAtual);
    } catch (error) {
      console.error("Erro ao processar disciplinas do simulado:", error);
      return [];
    }
  }, [simuladoAtual, simuladosDisponiveis]);

  const respostasDaTurma = useMemo(() => {
    if (!turmaSelecionadaId || !turmaAtual || !simuladoAtual) return [];

    return respostasAlunos.filter((resp) => {
      if (!resp) return false;
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
        (d?.totalQuestoes || d?.gabarito?.length || d?.questoes?.length || 0),
      0,
    );
  }, [disciplinasDoSimulado]);

  const getQtdQuestao = (disc) =>
    disc?.totalQuestoes ||
    disc?.gabarito?.length ||
    disc?.questoes?.length ||
    disc?.qtd ||
    0;

  const gerarPDFDesempenho = () => {
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
          header: `${String(disc?.nome || "Disc").toUpperCase()}\n(${qtd} Q)`,
          dataKey: disc?.nome || "disc",
        };
      }),
      {
        header: `GERAL\n(${totalQuestoesSimulado} Q)`,
        dataKey: "geral",
      },
    ];

    const linhas = (turmaAtual.alunos || []).map((alunoItem, index) => {
      const nomeAlunoStr = getNomeAluno(alunoItem);
      const linhaData = {};
      const numAluno = String(index + 1).padStart(2, "0");
      linhaData.aluno = `${numAluno}  ${String(nomeAlunoStr).toUpperCase()}`;

      const respostasDoAluno = respostasDaTurma.filter(
        (r) =>
          String(r.nomeAluno || r.aluno || "")
            .trim()
            .toUpperCase() === String(nomeAlunoStr).trim().toUpperCase(),
      );

      disciplinasDoSimulado.forEach((disc) => {
        if (!disc || !disc.nome) return;
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
          linhaData[disc.nome] =
            `${acertosTotalDisc}/${totalDisc} (${percentual}%)`;
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
        linhaData.geral = `${somaAcertos}/${somaQuestoes} (${percentGeral}%)`;
      }

      return linhaData;
    });

    const larguraUtil = 287;
    const totalColunasNotas = disciplinasDoSimulado.length + 1;

    let larguraAluno = 68;
    let larguraColunaNota = (larguraUtil - larguraAluno) / totalColunasNotas;

    if (larguraColunaNota < 22) {
      larguraColunaNota = 22;
      larguraAluno = Math.max(
        55,
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
      if (disc && disc.nome) {
        columnStylesConfig[disc.nome] = {
          cellWidth: larguraColunaNota,
          halign: "center",
        };
      }
    });

    autoTable(doc, {
      startY: 19,
      columns: colunas,
      body: linhas,
      theme: "grid",
      margin: { left: 5, right: 5 },
      styles: {
        fontSize: 6.5,
        cellPadding: { top: 1.2, bottom: 1.2, left: 0.5, right: 0.5 },
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
        cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 },
      },
      columnStyles: columnStylesConfig,
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`Relatório_${turmaAtual.nome}_${nomeSimulado}.pdf`);
  };

  // ==========================================
  // ESTADOS DA ABA: PREV. DE REPROVAÇÃO
  // ==========================================
  const [turmaRiscoId, setTurmaRiscoId] = useState("");
  const [tipoEscopoRisco, setTipoEscopoRisco] = useState("turma"); // "turma" | "geral"
  const [todosDadosRiscoTurma, setTodosDadosRiscoTurma] = useState([]);
  const [todosDadosRiscoGeral, setTodosDadosRiscoGeral] = useState([]);
  const [carregandoGeralRisco, setCarregandoGeralRisco] = useState(false);

  const turmaRiscoAtiva = useMemo(
    () => turmas.find((t) => String(t.id) === String(turmaRiscoId)),
    [turmas, turmaRiscoId],
  );

  const listaAlunosRisco = useMemo(() => {
    if (!turmaRiscoAtiva || !Array.isArray(turmaRiscoAtiva.alunos)) return [];
    return turmaRiscoAtiva.alunos
      .map((a) => (typeof a === "string" ? a : a.nome))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [turmaRiscoAtiva]);

  // Carrega dados de risco da turma específica
  useEffect(() => {
    async function carregarDadosRiscoTurma() {
      if (!turmaRiscoId || tipoEscopoRisco !== "turma") {
        setTodosDadosRiscoTurma([]);
        return;
      }
      try {
        const q = query(
          collection(db, "alunosRisco"),
          where("turmaId", "==", String(turmaRiscoId)),
        );
        const querySnapshot = await getDocs(q);
        const registros = [];
        querySnapshot.forEach((docSnap) => {
          registros.push(docSnap.data());
        });
        setTodosDadosRiscoTurma(registros);
      } catch (error) {
        console.error("Erro ao carregar dados de risco para relatório:", error);
      }
    }
    carregarDadosRiscoTurma();
  }, [turmaRiscoId, tipoEscopoRisco]);

  // Carrega dados de risco de todas as turmas para o modo Geral
  useEffect(() => {
    async function carregarDadosRiscoGeral() {
      if (tipoEscopoRisco !== "geral") {
        setTodosDadosRiscoGeral([]);
        return;
      }
      try {
        setCarregandoGeralRisco(true);
        const querySnapshot = await getDocs(collection(db, "alunosRisco"));
        const registros = [];
        querySnapshot.forEach((docSnap) => {
          registros.push(docSnap.data());
        });
        setTodosDadosRiscoGeral(registros);
      } catch (error) {
        console.error("Erro ao carregar dados gerais de risco:", error);
      } finally {
        setCarregandoGeralRisco(false);
      }
    }
    carregarDadosRiscoGeral();
  }, [tipoEscopoRisco]);

  const relatorioCruzadoAlunos = useMemo(() => {
    return listaAlunosRisco
      .map((nomeAluno, idx) => {
        const disciplinasEmRisco = [];
        todosDadosRiscoTurma.forEach((reg) => {
          if (reg.alunos && reg.alunos[nomeAluno] === true) {
            disciplinasEmRisco.push(reg.disciplina);
          }
        });
        return {
          id: String(idx + 1).padStart(2, "0"),
          nome: nomeAluno,
          temRisco: disciplinasEmRisco.length > 0,
          totalRisco: disciplinasEmRisco.length,
          disciplinasStr:
            disciplinasEmRisco.length === 0
              ? "Nenhum risco apontado"
              : disciplinasEmRisco.join(", "),
        };
      })
      .sort((a, b) => b.totalRisco - a.totalRisco);
  }, [listaAlunosRisco, todosDadosRiscoTurma]);

  // Percentual de risco da turma ativa
  const percentualRiscoTurma = useMemo(() => {
    if (listaAlunosRisco.length === 0) return "0.0";
    const totalAlunosComRisco = relatorioCruzadoAlunos.filter(
      (a) => a.temRisco,
    ).length;
    return ((totalAlunosComRisco / listaAlunosRisco.length) * 100).toFixed(1);
  }, [listaAlunosRisco, relatorioCruzadoAlunos]);

  // Estrutura de turmas agrupadas para o modo GERAL na tela
  const dadosGeralAgrupados = useMemo(() => {
    if (tipoEscopoRisco !== "geral") return [];

    const resultado = [];

    turmas.forEach((turma) => {
      const turmaIdStr = String(turma.id);
      const turmaNome = turma.nome || "Turma";
      const listaAlunosTurma = Array.isArray(turma.alunos)
        ? turma.alunos
            .map((a) => (typeof a === "string" ? a : a.nome))
            .filter(Boolean)
        : [];

      const regsTurma = todosDadosRiscoGeral.filter(
        (r) => String(r.turmaId) === turmaIdStr,
      );
      const alunosEmRiscoNessaTurma = [];

      listaAlunosTurma.forEach((nomeAluno) => {
        const discRisco = [];
        regsTurma.forEach((reg) => {
          if (reg.alunos && reg.alunos[nomeAluno] === true) {
            discRisco.push(reg.disciplina);
          }
        });

        if (discRisco.length > 0) {
          alunosEmRiscoNessaTurma.push({
            nome: nomeAluno,
            totalRisco: discRisco.length,
            disciplinasStr: discRisco.join(", "),
          });
        }
      });

      if (alunosEmRiscoNessaTurma.length > 0 && listaAlunosTurma.length > 0) {
        const percentTurma = (
          (alunosEmRiscoNessaTurma.length / listaAlunosTurma.length) *
          100
        ).toFixed(1);
        resultado.push({
          turmaNome,
          percentual: percentTurma,
          alunos: alunosEmRiscoNessaTurma.sort(
            (a, b) => b.totalRisco - a.totalRisco,
          ),
        });
      }
    });

    return resultado;
  }, [tipoEscopoRisco, turmas, todosDadosRiscoGeral]);

  // Função para exportar PDF de Previsão de Reprovação (Por Turma)
  const gerarPDFReprovacaoTurma = () => {
    if (!turmaRiscoAtiva) return;

    const doc = new jsPDF("portrait", "mm", "a4");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("RELATÓRIO DE PREVISÃO DE REPROVAÇÃO", 14, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Turma: ${turmaRiscoAtiva.nome}    |    Percentual de Risco: ${percentualRiscoTurma}%`,
      14,
      20,
    );

    const colunas = [
      { header: "#", dataKey: "id" },
      { header: "ALUNO", dataKey: "nome" },
      { header: "DISCIPLINAS EM RISCO", dataKey: "totalRisco" },
      { header: "DISCIPLINAS APONTADAS", dataKey: "disciplinasStr" },
    ];

    const linhas = relatorioCruzadoAlunos.map((item) => ({
      id: item.id,
      nome: item.nome,
      totalRisco: `${item.totalRisco} ${item.totalRisco === 1 ? "disciplina" : "disciplinas"}`,
      disciplinasStr: item.disciplinasStr,
    }));

    autoTable(doc, {
      startY: 25,
      columns: colunas,
      body: linhas,
      theme: "grid",
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [126, 34, 206],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        id: { cellWidth: 12, halign: "center" },
        nome: { cellWidth: 70, fontStyle: "bold" },
        totalRisco: { cellWidth: 40, halign: "center" },
        disciplinasStr: { cellWidth: 68 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`Previsao_Reprovacao_${turmaRiscoAtiva.nome}.pdf`);
  };

  // Função para Gerar PDF Geral (Apenas Alunos em Risco, Agrupados por Turma com Percentual Geral)
  const gerarPDFAlunosEmRiscoGeral = () => {
    if (dadosGeralAgrupados.length === 0) {
      alert("Nenhum aluno em risco de reprovação encontrado no sistema.");
      return;
    }

    const doc = new jsPDF("portrait", "mm", "a4");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("RELATÓRIO GERAL — ALUNOS EM RISCO DE REPROVAÇÃO", 14, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 20);

    let posY = 26;

    dadosGeralAgrupados.forEach((dadosTurma) => {
      if (posY > 250) {
        doc.addPage();
        posY = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(126, 34, 206);
      doc.text(
        `Turma: ${dadosTurma.turmaNome}  —  Percentual de Risco: ${dadosTurma.percentual}%`,
        14,
        posY,
      );
      posY += 4;

      const colunas = [
        { header: "#", dataKey: "id" },
        { header: "ALUNO", dataKey: "nome" },
        { header: "DISCIPLINAS EM RISCO", dataKey: "totalRisco" },
        { header: "DISCIPLINAS APONTADAS", dataKey: "disciplinasStr" },
      ];

      const linhas = dadosTurma.alunos.map((item, idx) => ({
        id: String(idx + 1).padStart(2, "0"),
        nome: item.nome,
        totalRisco: `${item.totalRisco} ${item.totalRisco === 1 ? "disc." : "disc."}`,
        disciplinasStr: item.disciplinasStr,
      }));

      autoTable(doc, {
        startY: posY,
        columns: colunas,
        body: linhas,
        theme: "grid",
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          valign: "middle",
        },
        headStyles: {
          fillColor: [126, 34, 206],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          id: { cellWidth: 10, halign: "center" },
          nome: { cellWidth: 65, fontStyle: "bold" },
          totalRisco: { cellWidth: 35, halign: "center" },
          disciplinasStr: { cellWidth: 80 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      posY = doc.lastAutoTable.finalY + 10;
    });

    doc.save("Relatorio_Geral_Alunos_Em_Risco.pdf");
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-12 max-w-7xl mx-auto w-full font-sans antialiased">
      {/* Botões de Seleção de Tipo de Relatório */}
      <div className="bg-white p-3 rounded-md shadow-sm border border-[#dbc8b6] flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTipoRelatorio("desempenho")}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tipoRelatorio === "desempenho"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Relatório de Desempenho
          </button>
          <button
            onClick={() => setTipoRelatorio("reprovacao")}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              tipoRelatorio === "reprovacao"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Prev. de Reprovação
          </button>
        </div>

        {tipoRelatorio === "reprovacao" && (
          <div>
            {tipoEscopoRisco === "turma" && turmaRiscoId && (
              <button
                onClick={gerarPDFReprovacaoTurma}
                className="px-3.5 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" /> Gerar PDF Turma
              </button>
            )}
            {tipoEscopoRisco === "geral" && dadosGeralAgrupados.length > 0 && (
              <button
                onClick={gerarPDFAlunosEmRiscoGeral}
                className="px-3.5 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" /> Gerar PDF Geral (Em Risco)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* CONTEÚDO: RELATÓRIO DE DESEMPENHO         */}
      {/* ========================================== */}
      {tipoRelatorio === "desempenho" && (
        <>
          <div className="bg-white p-3.5 sm:p-4 rounded-md shadow-sm border border-[#dbc8b6]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#dbc8b6]">
              <div>
                <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />{" "}
                  RELATÓRIO DE{" "}
                  <span className="text-red-500 font-bold">DESEMPENHO</span>
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Filtre por bimestre, turma e simulado.
                </p>
              </div>

              {turmaSelecionadaId && simuladoAtual && (
                <button
                  onClick={gerarPDFDesempenho}
                  className="w-full sm:w-auto px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase rounded-md flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Exportar PDF
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> 1. Bimestre
                </label>
                <select
                  value={bimestreSelecionado}
                  onChange={(e) => {
                    setBimestreSelecionado(e.target.value);
                    setTurmaSelecionadaId("");
                    setSimuladoSelecionadoId("");
                  }}
                  className="w-full p-2.5 border border-[#dbc8b6] rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  <option value="1">1º Bimestre</option>
                  <option value="2">2º Bimestre</option>
                  <option value="3">3º Bimestre</option>
                  <option value="4">4º Bimestre</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-500" /> 2. Turma
                </label>
                <select
                  disabled={!bimestreSelecionado || turmas.length === 0}
                  value={turmaSelecionadaId}
                  onChange={(e) => {
                    setTurmaSelecionadaId(e.target.value);
                    setSimuladoSelecionadoId("");
                  }}
                  className="w-full p-2.5 border border-[#dbc8b6] rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" /> 3. Simulado
                </label>
                <select
                  disabled={
                    !turmaSelecionadaId || simuladosDisponiveis.length === 0
                  }
                  value={simuladoSelecionadoId}
                  onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                  className="w-full p-2.5 border border-[#dbc8b6] rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-blue-500 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-white p-3.5 sm:p-4 rounded-md shadow-sm border border-[#dbc8b6]">
              <div className="flex items-center gap-2 mb-3 text-gray-800 pb-2.5 border-b border-[#dbc8b6]">
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
                <div className="p-6 text-center text-gray-400 text-xs uppercase font-bold border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
                  Não existem alunos inscritos nesta turma.
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-md border border-[#dbc8b6]">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#dbc8b6]">
                        <th className="p-2.5 align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[260px]">
                          Aluno
                        </th>
                        {disciplinasDoSimulado.map((disc, idx) => {
                          if (!disc || !disc.nome) return null;
                          const qtdQ = getQtdQuestao(disc);
                          return (
                            <th
                              key={idx}
                              className="p-1.5 text-center align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-[#dbc8b6] min-w-[100px]"
                            >
                              <span
                                className="block text-gray-800 whitespace-nowrap font-bold"
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
                        <th className="p-1.5 text-center align-middle text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-[#dbc8b6] bg-blue-50/40 min-w-[100px]">
                          <span className="block text-blue-700 whitespace-nowrap font-bold">
                            Geral
                          </span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 block">
                            ({totalQuestoesSimulado} Q)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700 divide-y divide-[#dbc8b6]">
                      {turmaAtual.alunos.map((alunoItem, index) => {
                        const nomeAlunoStr = getNomeAluno(alunoItem);

                        const respostasDoAluno = respostasDaTurma.filter(
                          (r) =>
                            String(r.nomeAluno || r.aluno || "")
                              .trim()
                              .toUpperCase() ===
                            String(nomeAlunoStr).trim().toUpperCase(),
                        );

                        return (
                          <tr
                            key={index}
                            className="hover:bg-amber-50/20 transition-colors"
                          >
                            <td className="p-2 align-middle font-bold text-gray-800 uppercase min-w-[260px] whitespace-nowrap">
                              <span className="text-[10px] text-gray-400 font-mono mr-2">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span>{nomeAlunoStr}</span>
                            </td>

                            {disciplinasDoSimulado.map((disc, dIdx) => {
                              if (!disc || !disc.nome) return null;
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
                                    className="p-1.5 text-center align-middle text-gray-300 font-bold border-l border-[#dbc8b6] min-w-[100px]"
                                  >
                                    -
                                  </td>
                                );
                              }

                              const percentual =
                                totalDisc > 0
                                  ? Math.round(
                                      (acertosTotalDisc / totalDisc) * 100,
                                    )
                                  : 0;
                              const nota =
                                totalDisc > 0
                                  ? (
                                      (acertosTotalDisc / totalDisc) *
                                      10
                                    ).toFixed(1)
                                  : "0.0";

                              return (
                                <td
                                  key={dIdx}
                                  className="p-1.5 text-center align-middle border-l border-[#dbc8b6] min-w-[100px]"
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

                            <td className="p-1.5 text-center align-middle border-l border-[#dbc8b6] bg-blue-50/20 min-w-[100px]">
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
            <div className="bg-white p-8 rounded-md border border-dashed border-[#dbc8b6] text-center shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Selecione o bimestre, turma e simulado para ver os resultados.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================== */}
      {/* CONTEÚDO: PREV. DE REPROVAÇÃO             */}
      {/* ========================================== */}
      {tipoRelatorio === "reprovacao" && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-md shadow-sm border border-[#dbc8b6]">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-[#dbc8b6]">
              <AlertTriangle className="w-4 h-4 text-purple-600" /> RELATÓRIO DE{" "}
              <span className="text-red-500 font-bold">
                PREVISÃO DE REPROVAÇÃO
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-purple-600" /> Tipo de
                  Relatório:
                </label>
                <select
                  value={tipoEscopoRisco}
                  onChange={(e) => {
                    setTipoEscopoRisco(e.target.value);
                    if (e.target.value === "geral") setTurmaRiscoId("");
                  }}
                  className="w-full p-2.5 border border-[#dbc8b6] rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-purple-500 transition shadow-xs cursor-pointer"
                >
                  <option value="turma">Por Turma</option>
                  <option value="geral">Geral (Todas as Turmas)</option>
                </select>
              </div>

              {tipoEscopoRisco === "turma" && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" /> Selecione
                    a Turma:
                  </label>
                  <select
                    value={turmaRiscoId}
                    onChange={(e) => setTurmaRiscoId(e.target.value)}
                    className="w-full p-2.5 border border-[#dbc8b6] rounded-md text-xs bg-white font-bold text-gray-800 uppercase outline-none focus:border-purple-500 transition shadow-xs cursor-pointer"
                  >
                    <option value="">Selecione a turma...</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* MODO POR TURMA */}
          {tipoEscopoRisco === "turma" && !turmaRiscoId ? (
            <div className="bg-white p-8 rounded-md border border-dashed border-[#dbc8b6] text-center shadow-sm">
              <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Selecione uma Turma para visualizar o relatório de previsão de
                reprovação.
              </p>
            </div>
          ) : tipoEscopoRisco === "turma" ? (
            <div className="border border-[#dbc8b6] rounded-md bg-white overflow-hidden space-y-3">
              <div className="bg-purple-50 p-3 border-b border-[#dbc8b6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-bold text-purple-900 uppercase">
                  Previsão de Reprovação — Turma: {turmaRiscoAtiva?.nome}
                </span>
                <span className="text-[11px] font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200 uppercase">
                  Percentual de Risco da Turma: {percentualRiscoTurma}%
                </span>
              </div>

              <div className="overflow-x-auto p-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-[#dbc8b6] text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5">Aluno</th>
                      <th className="p-2.5 text-center">
                        Disciplinas em Risco
                      </th>
                      <th className="p-2.5">Disciplinas Apontadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbc8b6] text-xs">
                    {relatorioCruzadoAlunos.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 ${item.totalRisco > 0 ? "bg-red-50/30" : ""}`}
                      >
                        <td className="p-2.5 text-center font-bold text-gray-400">
                          {item.id}
                        </td>
                        <td className="p-2.5 font-bold uppercase text-gray-800">
                          {item.nome}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              item.totalRisco === 0
                                ? "bg-emerald-100 text-emerald-800"
                                : item.totalRisco <= 2
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800 font-black"
                            }`}
                          >
                            {item.totalRisco}{" "}
                            {item.totalRisco === 1
                              ? "disciplina"
                              : "disciplinas"}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {item.totalRisco === 0 ? (
                            <span className="text-gray-400 italic">
                              Nenhum risco apontado
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {item.disciplinasStr
                                .split(", ")
                                .map((d, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-200"
                                  >
                                    {d}
                                  </span>
                                ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MODO GERAL (EXIBE NA TELA TODOS OS ALUNOS EM RISCO AGRUPADOS POR TURMA) */
            <div className="space-y-4">
              {carregandoGeralRisco ? (
                <div className="bg-white p-8 rounded-md border border-[#dbc8b6] text-center shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase animate-pulse">
                    A carregar dados gerais...
                  </p>
                </div>
              ) : dadosGeralAgrupados.length === 0 ? (
                <div className="bg-white p-8 rounded-md border border-dashed border-[#dbc8b6] text-center shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Nenhum aluno em risco de reprovação encontrado no sistema.
                  </p>
                </div>
              ) : (
                dadosGeralAgrupados.map((dadosTurma, tIdx) => (
                  <div
                    key={tIdx}
                    className="border border-[#dbc8b6] rounded-md bg-white overflow-hidden space-y-2"
                  >
                    <div className="bg-purple-50 p-3 border-b border-[#dbc8b6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-xs font-bold text-purple-900 uppercase">
                        Turma: {dadosTurma.turmaNome}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200 uppercase">
                        Percentual de Risco: {dadosTurma.percentual}%
                      </span>
                    </div>

                    <div className="overflow-x-auto p-3">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b border-[#dbc8b6] text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            <th className="p-2.5 w-12 text-center">#</th>
                            <th className="p-2.5">Aluno</th>
                            <th className="p-2.5 text-center">
                              Disciplinas em Risco
                            </th>
                            <th className="p-2.5">Disciplinas Apontadas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbc8b6] text-xs">
                          {dadosTurma.alunos.map((item, idx) => (
                            <tr
                              key={idx}
                              className="bg-red-50/30 hover:bg-red-50/50"
                            >
                              <td className="p-2.5 text-center font-bold text-gray-400">
                                {String(idx + 1).padStart(2, "0")}
                              </td>
                              <td className="p-2.5 font-bold uppercase text-gray-800">
                                {item.nome}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-800">
                                  {item.totalRisco}{" "}
                                  {item.totalRisco === 1
                                    ? "disciplina"
                                    : "disciplinas"}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {item.disciplinasStr
                                    .split(", ")
                                    .map((d, dIdx) => (
                                      <span
                                        key={dIdx}
                                        className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-200"
                                      >
                                        {d}
                                      </span>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
