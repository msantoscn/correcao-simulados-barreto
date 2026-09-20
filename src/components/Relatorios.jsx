import { useState } from "react";

export default function Relatorios({ turmas = [], respostasAlunos = [] }) {
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");

  // Filtrar alunos e simulados com base na turma selecionada
  const turmaAtual = turmas.find((t) => t.id === turmaSelecionadaId);

  // Filtrar respostas apenas dos alunos pertencentes à turma selecionada
  // (Assumindo que cada resposta ou aluno guarda a referência da turma ou ID da turma)
  const respostasDaTurma = respostasAlunos.filter((resp) => {
    if (!turmaSelecionadaId) return false;
    // Verifica se a resposta pertence à turma selecionada (ajuste o campo conforme o seu objeto no Firebase, ex: resp.turmaId)
    return (
      resp.turmaId === turmaSelecionadaId || resp.turma === turmaAtual?.nome
    );
  });

  // Estatísticas rápidas
  const totalAlunosNaTurma = turmaAtual?.alunos?.length || 0;
  const totalAlunosAvaliados = new Set(
    respostasDaTurma.map((r) => r.alunoId || r.aluno),
  ).size;

  // Cálculo simples de média de acertos (exemplo base, ajustável à sua estrutura de dados)
  const somaNotas = respostasDaTurma.reduce(
    (acc, curr) => acc + (Number(curr.nota) || 0),
    0,
  );
  const mediaTurma =
    totalAlunosAvaliados > 0
      ? (somaNotas / totalAlunosAvaliados).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
          Relatórios de Desempenho por Turma
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Selecione uma turma para visualizar o resumo estatístico e o
          desempenho detalhado dos alunos.
        </p>

        {/* Filtro de Pesquisa: Apenas por Turma */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Selecionar Turma:
          </label>

          {turmas.length === 0 ? (
            <p className="text-xs text-amber-600 font-medium">
              Nenhuma turma registada no sistema.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              {turmas.map((turma) => {
                const selecionada = turmaSelecionadaId === turma.id;
                return (
                  <button
                    key={turma.id}
                    onClick={() => setTurmaSelecionadaId(turma.id)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-sm transition cursor-pointer border ${
                      selecionada
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {turma.nome || turma.descricao}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo exibido apenas se houver uma turma selecionada */}
      {turmaSelecionadaId ? (
        <>
          {/* Cards de Resumo Estatístico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 border-l-4 border-l-blue-600">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Alunos na Turma
              </span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">
                {totalAlunosNaTurma}
              </h3>
            </div>

            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 border-l-4 border-l-emerald-600">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Alunos Avaliados
              </span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">
                {totalAlunosAvaliados}
              </h3>
            </div>

            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 border-l-4 border-l-indigo-600">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Média de Acertos / Nota
              </span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">
                {mediaTurma}
              </h3>
            </div>
          </div>

          {/* Tabela de Detalhes dos Alunos da Turma */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-700 uppercase">
                Listagem de Resultados — {turmaAtual?.nome || "Turma"}
              </h3>
            </div>

            {respostasDaTurma.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs uppercase font-medium">
                Nenhum registo de resposta encontrado para esta turma.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100/50 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="p-3">Aluno</th>
                      <th className="p-3">Simulado</th>
                      <th className="p-3 text-center">Nota / Acertos</th>
                      <th className="p-3 text-right">Data do Registo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
                    {respostasDaTurma.map((resp, index) => (
                      <tr
                        key={resp.id || index}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="p-3 font-medium text-gray-900">
                          {resp.aluno ||
                            resp.nomeAluno ||
                            "Aluno não identificado"}
                        </td>
                        <td className="p-3 text-gray-600">
                          {resp.simuladoNome ||
                            resp.simuladoId ||
                            "Simulado Geral"}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-600">
                          {resp.nota ?? "-"}
                        </td>
                        <td className="p-3 text-right text-gray-400 text-[11px]">
                          {resp.data
                            ? new Date(resp.data).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-sm shadow-sm border border-gray-200 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Selecione uma turma acima para gerar o relatório correspondente.
          </p>
        </div>
      )}
    </div>
  );
}
