import { useState } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";

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

  const lidarComImpressao = () => {
    window.print();
  };

  const totalQuestoesSimulado = disciplinasDoSimulado.reduce(
    (acc, d) =>
      acc + (d.gabarito?.length || d.questoes?.length || d.totalQuestoes || 0),
    0,
  );

  return (
    <div className="space-y-6 pb-12 print:space-y-0 print:pb-0">
      {/* 
        Este bloco de estilo só afeta a impressão.
        Força a página a ficar deitada (landscape) e ajusta as margens para caber tudo.
      */}
      <style type="text/css" media="print">
        {`
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* Cabeçalho e Filtros */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 print:mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 print:border-b-2 print:border-gray-800 print:pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 print:text-black">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 print:hidden" />{" "}
              Relatório de Desempenho
            </h2>
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Consolidado de notas e aproveitamento por disciplina e aluno.
            </p>
            {/* Título visível apenas na impressão */}
            <div className="hidden print:block text-sm font-bold text-gray-700 mt-2 uppercase">
              Turma: {turmaAtual?.nome} | Simulado:{" "}
              {simuladoAtual?.nome || simuladoAtual?.titulo || "Geral"}
            </div>
          </div>

          {turmaSelecionadaId && (
            <button
              onClick={lidarComImpressao}
              className="print:hidden px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-sm flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Exportar / Imprimir
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 print:hidden">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
              1. Selecionar Turma
            </label>
            {turmas.length === 0 ? (
              <p className="text-sm text-amber-600 font-medium bg-amber-50 p-3 rounded-sm border border-amber-200">
                Nenhuma turma registada no sistema.
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

      {/* Área da Tabela */}
      {turmaSelecionadaId ? (
        <div className="bg-white rounded-sm shadow-sm border border-gray-300 print:shadow-none print:border-none">
          <div className="p-3 bg-gray-800 text-white flex justify-between items-center print:hidden">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Turma: <span className="text-blue-400">{turmaAtual?.nome}</span>
              <span className="mx-2 text-gray-500">|</span>
              Simulado:{" "}
              <span className="text-blue-400">
                {simuladoAtual?.nome || simuladoAtual?.titulo || "Geral"}
              </span>
            </h3>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm uppercase font-bold bg-gray-50">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            // A largura total (w-full) sem scrollbar, dividindo proporcionalmente
            <div className="w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-100 print:bg-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {/* A primeira coluna ocupa um espaço maior (~25%) */}
                    <th className="p-2 sm:p-3 w-1/4 align-middle text-gray-800 print:text-[11px] print:p-1">
                      Aluno
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
                          className="p-2 sm:p-3 text-center align-middle border-l border-gray-300 print:border-gray-400 print:text-[11px] print:p-1"
                        >
                          <span
                            className="block text-gray-800 truncate"
                            title={disc.nome}
                          >
                            {disc.nome}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium mt-0.5 block">
                            ({qtdQ} Q)
                          </span>
                        </th>
                      );
                    })}

                    <th className="p-2 sm:p-3 text-center align-middle border-l-2 border-gray-300 bg-blue-50/50 print:bg-gray-200 print:border-gray-400 print:text-[11px] print:p-1">
                      <span className="block text-blue-900 print:text-black">
                        Geral
                      </span>
                      <span className="text-[9px] text-blue-600 print:text-gray-600 font-medium mt-0.5 block">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-sm text-gray-700 print:text-xs">
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
                        className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition"
                      >
                        {/* Coluna Nome do Aluno */}
                        <td
                          className="p-2 sm:p-3 font-bold text-gray-900 uppercase align-middle truncate print:p-1.5"
                          title={nomeAluno}
                        >
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-200 px-1 py-0.5 rounded-sm mr-2 print:bg-transparent print:border print:border-gray-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {nomeAluno}
                        </td>

                        {/* Colunas de Disciplinas */}
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
                                className="p-2 sm:p-3 text-center align-middle border-l border-gray-200 text-gray-300 font-medium print:p-1"
                              >
                                —
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
                          const nota = resultadoDisc.nota ?? "0.0";

                          return (
                            <td
                              key={dIdx}
                              className="p-2 sm:p-3 text-center align-middle border-l border-gray-200 print:p-1 print:border-gray-300"
                            >
                              <div className="font-extrabold text-gray-800 text-xs sm:text-sm print:text-[11px]">
                                {acertos}/{total}{" "}
                                <span className="text-blue-600 print:text-gray-600 font-bold ml-0.5">
                                  ({percentual}%)
                                </span>
                              </div>
                              <div className="mt-1 inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-[3px] text-[10px] font-bold shadow-sm print:bg-transparent print:border-gray-400 print:text-black">
                                NOTA: {nota}
                              </div>
                            </td>
                          );
                        })}

                        {/* Coluna Resultado Geral - Agora sem a Nota Final */}
                        <td className="p-2 sm:p-3 text-center align-middle border-l-2 border-gray-300 bg-blue-50/20 print:p-1 print:bg-transparent print:border-gray-400">
                          {!respostaAluno ||
                          respostaAluno.totalAcertos === undefined ? (
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-sm print:border print:border-gray-300 print:bg-transparent">
                              Pendente
                            </span>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <div className="font-extrabold text-blue-900 print:text-black text-sm sm:text-base print:text-xs">
                                {respostaAluno.totalAcertos}{" "}
                                <span className="text-gray-500 text-xs font-bold print:text-gray-600">
                                  / {respostaAluno.totalQuestoes}
                                </span>
                              </div>
                              <div className="text-[10px] sm:text-xs text-blue-600 print:text-gray-800 font-bold mt-0.5 bg-blue-100 print:bg-transparent print:border print:border-gray-300 px-1.5 rounded-sm">
                                {respostaAluno.percentualGeral}%
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
        <div className="bg-gray-50 p-16 rounded-sm border border-dashed border-gray-300 text-center print:hidden">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Selecione uma turma para visualizar os resultados.
          </p>
        </div>
      )}
    </div>
  );
}
