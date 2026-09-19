import { useState } from "react";
import {
  Settings,
  X,
  Trash2,
  PlusCircle,
  Save,
  FileText,
  Edit3,
} from "lucide-react";

export default function Admin({
  simulados,
  onSalvarSimulado,
  onDeletarSimulado,
}) {
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nomeSimulado, setNomeSimulado] = useState("");

  // Começa com uma disciplina vazia, aguardando digitação
  const [disciplinas, setDisciplinas] = useState([
    { id: 1, nome: "", qtdQuestoes: 5, gabarito: Array(5).fill("") },
  ]);

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

    // Só atualiza o estado se for vazio (apagar) ou uma letra permitida
    if (val === "" || ["A", "B", "C", "D", "E"].includes(val)) {
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

      // Avança o cursor apenas se não for vazio
      if (val !== "") {
        const proximoCampo = document.getElementById(
          `admin-q-${disciplinaId}-${index + 1}`,
        );
        if (proximoCampo) proximoCampo.focus();
      }
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
    // Ao cancelar, volta para uma disciplina limpa
    setDisciplinas([
      { id: 1, nome: "", qtdQuestoes: 5, gabarito: Array(5).fill("") },
    ]);
  };

  const removerSimulado = async (id) => {
    if (!confirm("Tem a certeza de que deseja eliminar este simulado?")) return;
    try {
      await onDeletarSimulado(id);
      if (idEmEdicao === id) cancelarEdicao();
    } catch (error) {
      console.error("Erro ao eliminar simulado:", error);
      alert("Erro ao eliminar o simulado do Firebase.");
    }
  };

  const guardarSimulado = async (e) => {
    e.preventDefault();
    if (!nomeSimulado.trim()) return alert("Insira o nome do simulado.");

    try {
      if (idEmEdicao) {
        const simuladoAtualizado = {
          id: idEmEdicao,
          nome: nomeSimulado,
          disciplinas,
        };
        await onSalvarSimulado(simuladoAtualizado);
        alert("Simulado atualizado com sucesso no Firebase!");
      } else {
        const novoSimulado = {
          nome: nomeSimulado,
          disciplinas,
          dataCriacao: new Date().toLocaleDateString("pt-PT"),
        };
        await onSalvarSimulado(novoSimulado);
        alert("Simulado guardado com sucesso no Firebase!");
      }
      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao guardar simulado:", error);
      alert("Erro ao guardar o simulado no Firebase.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUNA ESQUERDA - FORMULÁRIO */}
      <div className="lg:col-span-2 bg-white rounded-sm shadow-sm p-6 border border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
            <Settings className="text-gray-700 w-6 h-6" />
            {idEmEdicao ? "EDITAR" : "CRIAR"}{" "}
            <span className="text-red-600">SIMULADO</span>
          </h2>

          <div className="flex gap-2">
            {idEmEdicao && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="text-xs font-bold text-white bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-sm uppercase flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-4 h-4" /> CANCELAR
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-6 mt-2">
          Digite o gabarito. O cursor avança automaticamente para a questão
          seguinte ao digitar!
        </p>

        <form onSubmit={guardarSimulado} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              NOME DO SIMULADO
            </label>
            <input
              type="text"
              placeholder="Ex: Simulado 1 - 1º Trimestre"
              value={nomeSimulado}
              onChange={(e) => setNomeSimulado(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-bold text-gray-700 uppercase">
              DISCIPLINAS E GABARITO OFICIAL
            </h3>

            {disciplinas.map((disc, index) => (
              <div
                key={disc.id}
                className="p-4 bg-[#f8f9fa] border border-gray-200 rounded-sm relative"
              >
                <span className="absolute -top-3 left-4 bg-[#f8f9fa] px-2 text-[10px] font-bold text-gray-500 uppercase border border-gray-200 rounded-sm">
                  DISCIPLINA {index + 1}
                </span>

                {disciplinas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerDisciplina(disc.id)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-2 pr-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      NOME DA DISCIPLINA
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ling. Portuguesa"
                      value={disc.nome}
                      onChange={(e) =>
                        atualizarDisciplina(disc.id, "nome", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      QTD. DE QUESTÕES (1-40)
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
                      className="w-full p-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    RESPOSTAS CORRETAS (A, B, C, D OU E)
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {disc.gabarito.map((resposta, qIdx) => (
                      <div key={qIdx} className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-bold mb-0.5">
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
                          className="w-9 h-9 text-center text-sm font-bold uppercase border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 bg-white"
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
            className="w-full py-3 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase text-sm rounded-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" /> ADICIONAR OUTRA DISCIPLINA
          </button>

          <button
            type="submit"
            className="w-full py-4 bg-[#84cc16] hover:bg-lime-600 text-white font-bold uppercase text-lg rounded-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Save className="w-5 h-5" />{" "}
            {idEmEdicao ? "ATUALIZAR SIMULADO" : "CRIAR SIMULADO"}
          </button>
        </form>
      </div>

      {/* COLUNA DIREITA - LISTAGEM */}
      <div className="lg:col-span-1 bg-white rounded-sm shadow-sm p-6 border border-gray-200 h-fit">
        <h3 className="text-lg font-bold text-gray-800 uppercase mb-1 flex items-center gap-2 pb-2 border-b border-gray-100">
          <FileText className="text-gray-700 w-5 h-5" /> SIMULADOS{" "}
          <span className="text-red-600">GERADOS</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4 mt-2">
          Clique em "Editar" para alterar o gabarito.
        </p>

        {simulados.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">
            Nenhum simulado criado.
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {simulados.map((sim) => (
              <div
                key={sim.id}
                className={`p-4 rounded-sm border transition shadow-sm bg-white ${
                  idEmEdicao === sim.id
                    ? "border-blue-400 ring-1 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-sm uppercase">
                    {sim.nome}
                  </h4>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-sm font-mono font-bold">
                    DATA: {sim.dataCriacao || "N/D"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 font-bold uppercase mb-4">
                  {sim.disciplinas?.length || 0} disciplina(s) •{" "}
                  {sim.disciplinas?.reduce(
                    (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
                    0,
                  ) || 0}{" "}
                  questões
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => carregarParaEdicao(sim)}
                    className="flex-1 py-2 px-2 bg-[#4b82f6] hover:bg-blue-600 text-white text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> EDITAR
                  </button>
                  <button
                    onClick={() => removerSimulado(sim.id)}
                    className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase rounded-sm transition flex items-center justify-center cursor-pointer"
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
