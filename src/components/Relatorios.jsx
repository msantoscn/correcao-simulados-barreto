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

  // Extrair disciplinas do simulado ativo
  const disciplinasDoSimulado = Array.isArray(simuladoAtual?.disciplinas)
    ? simuladoAtual.disciplinas
    : typeof simuladoAtual?.disciplinas === "object" &&
        simuladoAtual?.disciplinas !== null
      ? Object.entries(simuladoAtual.disciplinas).map(([nome, dados]) => ({
          nome,
          ...dados,
        }))
      : [];

  // Filtrar respostas da turma e simulado selecionados
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

  // Calcular total de questões do simulado
  const totalQuestoesSimulado = disciplinasDoSimulado.reduce(
    (acc, d) =>
      acc + (d.gabarito?.length || d.questoes?.length || d.totalQuestoes || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 print:shadow-none print:border-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Relatório de
              Desempenho
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Consolidado de notas e aproveitamento por disciplina e aluno.
            </p>
          </div>

          {turmaSelecionadaId && (
            <button
              onClick={lidarComImpressao}
              className="print:hidden px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-sm flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Exportar / Imprimir
            </button>
          )}
        </div>

        {/* Filtros: Turma e Simulado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 print:hidden">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              1. Selecionar Turma:
            </label>
            {turmas.length === 0 ? (
              <p className="text-xs text-amber-600 font-medium">
                Nenhuma turma registada.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {turmas.map((turma) => (
                  <button
                    key={turma.id}
                    onClick={() => setTurmaSelecionadaId(String(turma.id))}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm transition cursor-pointer border ${
                      String(turmaSelecionadaId) === String(turma.id)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                2. Selecionar Simulado:
              </label>
              <select
                value={simuladoSelecionadoId || simuladoAtual?.id || ""}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-sm text-xs bg-white font-bold uppercase outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Tabela de Resultados por Aluno */}
      {turmaSelecionadaId ? (
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase">
              Turma: <span className="text-blue-600">{turmaAtual?.nome}</span> —
              Simulado:{" "}
              <span className="text-blue-600">
                {simuladoAtual?.nome || simuladoAtual?.titulo || "Geral"}
              </span>
            </h3>
          </div>

          {!turmaAtual?.alunos || turmaAtual.alunos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs uppercase font-medium">
              Não existem alunos inscritos nesta turma.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/70 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="p-3 w-1/4">Aluno</th>
                    {disciplinasDoSimulado.map((disc, idx) => {
                      const qtdQ =
                        disc.gabarito?.length ||
                        disc.questoes?.length ||
                        disc.totalQuestoes ||
                        disc.qtd ||
                        0;
                      return (
                        <th key={idx} className="p-3 text-center">
                          {disc.nome}
                          <br />
                          <span className="text-[9px] text-gray-400 font-normal">
                            ({qtdQ} Q)
                          </span>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center bg-gray-100">
                      Geral (Total)
                      <br />
                      <span className="text-[9px] text-gray-400 font-normal">
                        ({totalQuestoesSimulado} Q)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
                  {turmaAtual.alunos.map((nomeAluno, index) => {
                    const respostaAluno = respostasDaTurma.find(
                      (r) =>
                        String(r.nomeAluno || r.aluno || "")
                          .trim()
                          .toUpperCase() ===
                        String(nomeAluno).trim().toUpperCase(),
                    );

                    return (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-medium text-gray-900 uppercase">
                          <span className="text-[10px] text-gray-400 font-bold mr-2">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {nomeAluno}
                        </td>

                        {/* Notas por Disciplina */}
                        {disciplinasDoSimulado.map((disc, dIdx) => {
                          const qtdQ =
                            disc.gabarito?.length ||
                            disc.questoes?.length ||
                            disc.totalQuestoes ||
                            0;

                          let resultadoDisc = null;
                          if (respostaAluno) {
                            // O componente Professor.jsx guarda os dados em 'detalhes'
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
                                className="p-3 text-center text-gray-300"
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
                          const nota = resultadoDisc.nota ?? "0.0";

                          return (
                            <td key={dIdx} className="p-3 text-center">
                              <div className="font-bold text-gray-800">
                                {acertos}/{total} ({percentual}%)
                              </div>
                              <div className="mt-1 inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[2px] text-[10px] font-bold">
                                NOTA: {nota}
                              </div>
                            </td>
                          );
                        })}

                        {/* Coluna Geral / Status */}
                        <td className="p-3 text-center bg-gray-50/50 font-bold">
                          {!respostaAluno ||
                          respostaAluno.totalAcertos === undefined ? (
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-sm">
                              Pendente
                            </span>
                          ) : (
                            <div>
                              <div className="text-blue-600">
                                {respostaAluno.totalAcertos}/
                                {respostaAluno.totalQuestoes}
                              </div>
                              <div className="text-[11px] text-gray-500 font-normal">
                                ({respostaAluno.percentualGeral}%)
                              </div>
                              {respostaAluno.notaFinal && (
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                  Nota: {respostaAluno.notaFinal}
                                </div>
                              )}
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
        <div className="bg-white p-12 rounded-sm shadow-sm border border-gray-200 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Selecione uma turma acima para gerar o relatório detalhado.
          </p>
        </div>
      )}
    </div>
  );
}
