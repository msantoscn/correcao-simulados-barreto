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
    setDisciplinas([
      { id: 1, nome: "", qtdQuestoes: 5, gabarito: Array(5).fill("") },
    ]);
  };

  const removerSimulado = async (id) => {
    if (!confirm("Tem certeza de que deseja eliminar este simulado?")) return;
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
        alert("Simulado atualizado com sucesso!");
      } else {
        const novoSimulado = {
          nome: nomeSimulado,
          disciplinas,
          dataCriacao: new Date().toLocaleDateString("pt-BR"),
        };
        await onSalvarSimulado(novoSimulado);
        alert("Simulado guardado com sucesso!");
      }
      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao guardar simulado:", error);
      alert("Erro ao guardar o simulado no Firebase.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* ========================================= */}
      {/* COLUNA ESQUERDA - FORMULÁRIO DE CRIAÇÃO   */}
      {/* ========================================= */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 transition-all">
        {/* Cabeçalho do Formulário */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#4b82f6] rounded-xl border border-blue-100/50 shadow-sm">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                {idEmEdicao ? "EDITAR" : "CRIAR"}{" "}
                <span className="text-red-600">SIMULADO</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Digite o gabarito oficial. O cursor avança automaticamente.
              </p>
            </div>
          </div>

          {idEmEdicao && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:text-slate-700 px-3.5 py-2 rounded-xl uppercase flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={guardarSimulado} className="space-y-6">
          {/* Input: Nome do Simulado */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome do Simulado
            </label>
            <input
              type="text"
              placeholder="Ex: Simulado 1 - 1º Trimestre"
              value={nomeSimulado}
              onChange={(e) => setNomeSimulado(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal"
              required
            />
          </div>

          {/* Listagem de Disciplinas */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Disciplinas e Gabarito Oficial
            </h3>

            {disciplinas.map((disc, index) => (
              <DisciplinaCard
                key={disc.id}
                index={index}
                disc={disc}
                podeRemover={disciplinas.length > 1}
                aoRemover={() => removerDisciplina(disc.id)}
                aoAtualizar={(campo, valor) =>
                  atualizarDisciplina(disc.id, campo, valor)
                }
                aoAtualizarGabarito={(idx, val) =>
                  atualizarGabaritoOficial(disc.id, idx, val)
                }
              />
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={adicionarDisciplina}
              className="w-full py-3 bg-blue-50/50 hover:bg-blue-50 text-[#4b82f6] border border-blue-200/60 hover:border-[#4b82f6] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Outra Disciplina
            </button>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              {idEmEdicao ? "Atualizar Simulado" : "Guardar Simulado"}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================= */}
      {/* COLUNA DIREITA - LISTAGEM DE SIMULADOS    */}
      {/* ========================================= */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-fit transition-all">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200/60 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              Simulados <span className="text-[#4b82f6]">Gerados</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Gestão e alteração
            </p>
          </div>
        </div>

        {simulados.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nenhum simulado cadastrado
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {simulados.map((sim) => (
              <SimuladoCard
                key={sim.id}
                sim={sim}
                emEdicao={idEmEdicao === sim.id}
                aoEditar={() => carregarParaEdicao(sim)}
                aoRemover={() => removerSimulado(sim.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   SUB-COMPONENTES INTERNOS
   ======================================================================== */

function DisciplinaCard({
  index,
  disc,
  podeRemover,
  aoRemover,
  aoAtualizar,
  aoAtualizarGabarito,
}) {
  return (
    <div className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl relative transition-all hover:border-slate-300">
      <div className="flex justify-between items-center mb-4">
        <span className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
          Disciplina {index + 1}
        </span>

        {podeRemover && (
          <button
            type="button"
            onClick={aoRemover}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Remover Disciplina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Nome da Disciplina
          </label>
          <input
            type="text"
            placeholder="Ex: Ling. Portuguesa"
            value={disc.nome}
            onChange={(e) => aoAtualizar("nome", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Qtd. de Questões (1-40)
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={disc.qtdQuestoes}
            onChange={(e) => aoAtualizar("qtdQuestoes", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            required
          />
        </div>
      </div>

      {/* Grid do Gabarito */}
      <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center sm:text-left">
          Respostas Corretas (A, B, C, D ou E)
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-y-3 gap-x-2">
          {disc.gabarito.map((resposta, qIdx) => (
            <div key={qIdx} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold mb-1">
                Q{qIdx + 1}
              </span>
              <input
                id={`admin-q-${disc.id}-${qIdx}`}
                type="text"
                maxLength="1"
                value={resposta}
                onChange={(e) => aoAtualizarGabarito(qIdx, e.target.value)}
                /* Aqui foi aplicada a alteração: tamanho fixo de w-10 h-10 */
                className="w-10 h-10 text-center text-sm font-black uppercase rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                required
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimuladoCard({ sim, emEdicao, aoEditar, aoRemover }) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 bg-white shadow-sm ${
        emEdicao
          ? "border-[#4b82f6] ring-2 ring-blue-50"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide leading-tight">
          {sim.nome}
        </h4>
        <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono font-bold border border-slate-200/60">
          {sim.dataCriacao || "N/D"}
        </span>
      </div>

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
        {sim.disciplinas?.length || 0} disciplina(s) •{" "}
        {sim.disciplinas?.reduce(
          (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
          0,
        ) || 0}{" "}
        questões
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={aoEditar}
          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-[#4b82f6] text-slate-600 hover:text-white border border-slate-200 hover:border-[#4b82f6] text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <Edit3 className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={aoRemover}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
          title="Eliminar Simulado"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
