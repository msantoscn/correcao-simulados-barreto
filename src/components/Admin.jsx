import { useState } from "react";
import {
  Settings,
  Zap,
  X,
  Trash2,
  PlusCircle,
  Save,
  FileText,
  Edit3,
} from "lucide-react";

export default function Admin({ simulados, setSimulados }) {
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nomeSimulado, setNomeSimulado] = useState("");
  const [disciplinas, setDisciplinas] = useState([
    { id: 1, nome: "Português", qtdQuestoes: 5, gabarito: Array(5).fill("") },
    { id: 2, nome: "Matemática", qtdQuestoes: 5, gabarito: Array(5).fill("") },
  ]);

  const carregarModeloPadrao = () => {
    setNomeSimulado("Simulado Geral - 40 Questões");
    setDisciplinas([
      {
        id: Date.now() + 1,
        nome: "Língua Portuguesa",
        qtdQuestoes: 8,
        gabarito: Array(8).fill(""),
      },
      {
        id: Date.now() + 2,
        nome: "Matemática",
        qtdQuestoes: 8,
        gabarito: Array(8).fill(""),
      },
      {
        id: Date.now() + 3,
        nome: "História",
        qtdQuestoes: 8,
        gabarito: Array(8).fill(""),
      },
      {
        id: Date.now() + 4,
        nome: "Geografia",
        qtdQuestoes: 8,
        gabarito: Array(8).fill(""),
      },
      {
        id: Date.now() + 5,
        nome: "Ciências",
        qtdQuestoes: 8,
        gabarito: Array(8).fill(""),
      },
    ]);
  };

  const adicionarDisciplina = () => {
    const id = Date.now();
    setDisciplinas((prev) => [
      ...prev,
      { id, nome: "", qtdQuestoes: 5, gabarito: Array(5).fill("") },
    ]);
  };

  const removerDisciplina = (id) => {
    setDisciplinas((prev) => prev.filter((d) => d.id !== id));
  };

  const atualizarDisciplina = (id, campo, valor) => {
    setDisciplinas((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          if (campo === "qtdQuestoes") {
            const qtd = Math.min(40, Math.max(1, parseInt(valor, 10) || 1));
            const novoGabarito = [...d.gabarito];
            while (novoGabarito.length < qtd) novoGabarito.push("");
            novoGabarito.length = qtd;
            return { ...d, qtdQuestoes: qtd, gabarito: novoGabarito };
          }
          return { ...d, [campo]: valor };
        }
        return d;
      }),
    );
  };

  const atualizarGabaritoOficial = (disciplinaId, index, resposta) => {
    const val = resposta.toUpperCase();
    setDisciplinas((prev) =>
      prev.map((d) => {
        if (d.id === disciplinaId) {
          const novoGabarito = [...d.gabarito];
          novoGabarito[index] = val;
          return { ...d, gabarito: novoGabarito };
        }
        return d;
      }),
    );

    if (["A", "B", "C", "D", "E"].includes(val)) {
      const proximoCampo = document.getElementById(
        `admin-q-${disciplinaId}-${index + 1}`,
      );
      if (proximoCampo) proximoCampo.focus();
    }
  };

  const carregarParaEdicao = (simulado) => {
    setIdEmEdicao(simulado.id);
    setNomeSimulado(simulado.nome);
    setDisciplinas(JSON.parse(JSON.stringify(simulado.disciplinas)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    setIdEmEdicao(null);
    setNomeSimulado("");
    setDisciplinas([
      { id: 1, nome: "Português", qtdQuestoes: 5, gabarito: Array(5).fill("") },
      {
        id: 2,
        nome: "Matemática",
        qtdQuestoes: 5,
        gabarito: Array(5).fill(""),
      },
    ]);
  };

  const removerSimulado = (id) => {
    if (!confirm("Tem a certeza de que deseja eliminar este simulado?")) return;
    const listaAtualizada = simulados.filter((s) => s.id !== id);
    setSimulados(listaAtualizada);
    localStorage.setItem("simulados", JSON.stringify(listaAtualizada));
    if (idEmEdicao === id) cancelarEdicao();
  };

  const guardarSimulado = (e) => {
    e.preventDefault();
    if (!nomeSimulado.trim()) return alert("Insira o nome do simulado.");

    let listaAtualizada;

    if (idEmEdicao) {
      listaAtualizada = simulados.map((s) => {
        if (s.id === idEmEdicao) {
          return { ...s, nome: nomeSimulado, disciplinas };
        }
        return s;
      });
      alert("Simulado atualizado com sucesso!");
    } else {
      const novoSimulado = {
        id: Date.now().toString(),
        nome: nomeSimulado,
        disciplinas,
        dataCriacao: new Date().toLocaleDateString("pt-PT"),
      };
      listaAtualizada = [...simulados, novoSimulado];
      alert("Simulado guardado com sucesso!");
    }

    setSimulados(listaAtualizada);
    localStorage.setItem("simulados", JSON.stringify(listaAtualizada));
    cancelarEdicao();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            {idEmEdicao ? "Editar Simulado" : "Criar Simulado"}
          </h2>

          <div className="flex gap-2">
            {!idEmEdicao && (
              <button
                type="button"
                onClick={carregarModeloPadrao}
                className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Zap className="w-4 h-4 text-amber-500" /> Modelo 40 Questões
              </button>
            )}
            {idEmEdicao && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">
          Digite o gabarito. O cursor avança automaticamente para a questão
          seguinte ao digitar!
        </p>

        <form onSubmit={guardarSimulado} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nome do Simulado
            </label>
            <input
              type="text"
              placeholder="Ex: Simulado 1 - 1º Trimestre"
              value={nomeSimulado}
              onChange={(e) => setNomeSimulado(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700">
              Disciplinas e Gabarito Oficial
            </h3>

            {disciplinas.map((disc) => (
              <div
                key={disc.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative"
              >
                {disciplinas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerDisciplina(disc.id)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pr-8">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nome da Disciplina
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: História"
                      value={disc.nome}
                      onChange={(e) =>
                        atualizarDisciplina(disc.id, "nome", e.target.value)
                      }
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nº de Questões (1-40)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={disc.qtdQuestoes}
                      onChange={(e) =>
                        atualizarDisciplina(
                          disc.id,
                          "qtdQuestoes",
                          e.target.value,
                        )
                      }
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Respostas Corretas (A, B, C, D ou E)
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {disc.gabarito.map((resposta, qIdx) => (
                      <div key={qIdx} className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold mb-0.5">
                          Q{qIdx + 1}
                        </span>
                        <input
                          id={`admin-q-${disc.id}-${qIdx}`}
                          type="text"
                          maxLength="1"
                          value={resposta}
                          onChange={(e) =>
                            atualizarGabaritoOficial(
                              disc.id,
                              qIdx,
                              e.target.value,
                            )
                          }
                          className="w-9 h-9 text-center text-sm font-bold uppercase border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={adicionarDisciplina}
            className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-5 h-5" /> Adicionar Outra Disciplina
          </button>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-lg text-lg hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2 transition"
          >
            <Save className="w-5 h-5" />{" "}
            {idEmEdicao ? "Atualizar Simulado" : "Guardar Simulado e Gabarito"}
          </button>
        </form>
      </div>

      <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 border border-slate-200 h-fit">
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <FileText className="text-indigo-600 w-5 h-5" /> Simulados Gerados
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Clique em "Editar" para alterar o gabarito.
        </p>

        {simulados.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">
            Nenhum simulado criado.
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {simulados.map((sim) => (
              <div
                key={sim.id}
                className={`p-3 rounded-lg border transition ${
                  idEmEdicao === sim.id
                    ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {sim.nome}
                  </h4>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    {sim.dataCriacao}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  {sim.disciplinas.length} disciplina(s) •{" "}
                  {sim.disciplinas.reduce(
                    (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
                    0,
                  )}{" "}
                  questões
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => carregarParaEdicao(sim)}
                    className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => removerSimulado(sim.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Eliminar Simulado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
