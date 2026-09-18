import { useState } from "react";
import { FileSpreadsheet, Users, Filter, Trash2 } from "lucide-react";

export default function Relatorios({ respostasAlunos, setRespostasAlunos }) {
  const [turmaFiltro, setTurmaFiltro] = useState("");

  // Extrai lista única de turmas que têm resultados guardados
  const turmasDisponiveis = Array.from(
    new Set(respostasAlunos.map((r) => r.turma)),
  ).sort();

  // Filtra as respostas com base na turma selecionada
  const respostasFiltradas = turmaFiltro
    ? respostasAlunos.filter((r) => r.turma === turmaFiltro)
    : [];

  const eliminarRegisto = (id) => {
    if (!confirm("Deseja eliminar este registo de resposta?")) return;
    const listaAtualizada = respostasAlunos.filter((r) => r.id !== id);
    setRespostasAlunos(listaAtualizada);
    localStorage.setItem("respostas_alunos", JSON.stringify(listaAtualizada));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" /> Relatório de
            Desempenho
          </h2>
          <p className="text-slate-500 text-sm">
            Selecione a turma para visualizar as notas e acertos.
          </p>
        </div>

        {/* Seletor de Turma */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 min-w-[250px]">
          <Filter className="w-4 h-4 text-indigo-600" />
          <select
            value={turmaFiltro}
            onChange={(e) => setTurmaFiltro(e.target.value)}
            className="bg-transparent font-medium text-slate-700 text-sm outline-none w-full cursor-pointer"
          >
            <option value="">-- Selecione uma Turma --</option>
            {turmasDisponiveis.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!turmaFiltro ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-600">
            Nenhuma turma selecionada
          </p>
          <p className="text-xs text-slate-400">
            Escolha uma turma no seletor acima para carregar o relatório
            detalhado.
          </p>
        </div>
      ) : respostasFiltradas.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
          Não foram encontrados registos para a turma{" "}
          <strong>{turmaFiltro}</strong>.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabela de Resultados da Turma */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-indigo-50 text-indigo-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Aluno</th>
                  <th className="p-3">Simulado</th>
                  <th className="p-3">Prof. Aplicador</th>
                  <th className="p-3 text-center">Acertos</th>
                  <th className="p-3 text-center">Nota Final</th>
                  <th className="p-3 text-center">Data</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {respostasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-800">
                      {item.nomeAluno}
                    </td>
                    <td className="p-3">{item.simuladoNome}</td>
                    <td className="p-3 text-slate-600">
                      {item.professorAplicador || "Não informado"}
                    </td>
                    <td className="p-3 text-center font-medium">
                      {item.totalAcertos} / {item.totalQuestoes}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          Number(item.notaFinal) >= 6
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.notaFinal} / 10
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs text-slate-500">
                      {item.dataRegisto}
                    </td>
                    <td className="p-3 text-center">
                      {setRespostasAlunos && (
                        <button
                          onClick={() => eliminarRegisto(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                          title="Eliminar Registo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
