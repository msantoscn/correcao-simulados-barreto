import { useState } from "react";
import {
  Settings,
  X,
  Trash2,
  PlusCircle,
  Save,
  FileText,
  Edit3,
  Calendar,
  Copy,
} from "lucide-react";

export default function Admin({
  simulados,
  onSalvarSimulado,
  onDeletarSimulado,
}) {
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nomeSimulado, setNomeSimulado] = useState("");
  const [bimestre, setBimestre] = useState("3");

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
    setBimestre(simulado.bimestre || "3");
    setDisciplinas(JSON.parse(JSON.stringify(simulado.disciplinas)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicarSimulado = (simulado) => {
    setIdEmEdicao(null);
    setNomeSimulado(`${simulado.nome} (Cópia)`);
    setBimestre(simulado.bimestre || "3");
    const disciplinasCopiadas = JSON.parse(
      JSON.stringify(simulado.disciplinas),
    ).map((d) => ({
      ...d,
      id: Date.now() + Math.random(),
    }));
    setDisciplinas(disciplinasCopiadas);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    setIdEmEdicao(null);
    setNomeSimulado("");
    setBimestre("3");
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

    const gabaritoIncompleto = disciplinas.some((d) =>
      d.gabarito.some((resp) => resp === ""),
    );
    if (gabaritoIncompleto) {
      if (
        !confirm(
          "Algumas questões estão sem gabarito. Deseja salvar mesmo assim?",
        )
      )
        return;
    }

    try {
      if (idEmEdicao) {
        const simuladoAtualizado = {
          id: idEmEdicao,
          nome: nomeSimulado,
          bimestre: bimestre,
          disciplinas,
        };
        await onSalvarSimulado(simuladoAtualizado);
        alert("Simulado atualizado com sucesso!");
      } else {
        const novoSimulado = {
          nome: nomeSimulado,
          bimestre: bimestre,
          disciplinas,
          dataCriacao: new Date().toLocaleDateString("pt-PT"),
        };
        await onSalvarSimulado(novoSimulado);
        alert("Simulado cadastrado com sucesso!");
      }
      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao salvar simulado:", error);
      alert("Erro ao salvar o simulado no Firebase.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans max-w-7xl mx-auto w-full pb-16">
      {/* ========================================= */}
      {/* COLUNA ESQUERDA - FORMULÁRIO DE CRIAÇÃO   */}
      {/* ========================================= */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-300 shadow-sm p-5 sm:p-8 transition-all">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                {idEmEdicao ? "Editar" : "Criar"}{" "}
                <span className="text-blue-600">Simulado</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Digite o gabarito oficial. O cursor avança automaticamente.
              </p>
            </div>
          </div>

          {idEmEdicao && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2 rounded-xl uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={guardarSimulado} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Simulado
              </label>
              <input
                type="text"
                placeholder="Ex: Simulado 1 - Trimestral"
                value={nomeSimulado}
                onChange={(e) => setNomeSimulado(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Bimestre Ref.
              </label>
              <select
                value={bimestre}
                onChange={(e) => setBimestre(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all uppercase cursor-pointer shadow-xs"
                required
              >
                <option value="1">1º Bimestre</option>
                <option value="2">2º Bimestre</option>
                <option value="3">3º Bimestre</option>
                <option value="4">4º Bimestre</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
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

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={adicionarDisciplina}
              className="w-full py-3.5 bg-blue-50/70 hover:bg-blue-100/60 text-blue-700 border border-blue-300 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Outra Disciplina
            </button>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              {idEmEdicao ? "Atualizar Simulado" : "Salvar Simulado"}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================= */}
      {/* COLUNA DIREITA - LISTAGEM DE SIMULADOS    */}
      {/* ========================================= */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-300 shadow-sm p-5 h-fit transition-all">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-4">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-300 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Simulados <span className="text-blue-600">Gerados</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Gestão e alteração
            </p>
          </div>
        </div>

        {simulados.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nenhum simulado cadastrado
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {simulados.map((sim) => (
              <SimuladoCard
                key={sim.id}
                sim={sim}
                emEdicao={idEmEdicao === sim.id}
                aoEditar={() => carregarParaEdicao(sim)}
                aoDuplicar={() => duplicarSimulado(sim)}
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
    <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-300 rounded-2xl relative transition-all hover:border-slate-400 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <span className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs">
          Disciplina {index + 1}
        </span>

        {podeRemover && (
          <button
            type="button"
            onClick={aoRemover}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-300 bg-white"
            title="Remover Disciplina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nome da Disciplina
          </label>
          <input
            type="text"
            placeholder="Ex: Ling. Portuguesa"
            value={disc.nome}
            onChange={(e) => aoAtualizar("nome", e.target.value)}
            className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 shadow-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Qtd. de Questões (1-40)
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={disc.qtdQuestoes}
            onChange={(e) => aoAtualizar("qtdQuestoes", e.target.value)}
            className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
            required
          />
        </div>
      </div>

      {/* Grid do Gabarito */}
      <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center sm:text-left">
          Respostas Corretas (A, B, C, D ou E)
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-y-3 gap-x-2">
          {disc.gabarito.map((resposta, qIdx) => (
            <div key={qIdx} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold mb-1">
                Q{qIdx + 1}
              </span>
              <input
                id={`admin-q-${disc.id}-${qIdx}`}
                type="text"
                maxLength="1"
                value={resposta}
                onChange={(e) => aoAtualizarGabarito(qIdx, e.target.value)}
                className="w-10 h-10 text-center text-sm font-black uppercase rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                required
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimuladoCard({ sim, emEdicao, aoEditar, aoDuplicar, aoRemover }) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 bg-white shadow-xs ${
        emEdicao
          ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50/20"
          : "border-slate-300 hover:border-slate-400 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide leading-tight">
            {sim.nome}
          </h4>
          {sim.bimestre && (
            <span className="inline-block mt-1 text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-200">
              {sim.bimestre}º Bimestre
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-mono font-bold border border-slate-300">
          {sim.dataCriacao || "N/D"}
        </span>
      </div>

      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-4 mt-2">
        {sim.disciplinas?.length || 0} disciplina(s) •{" "}
        {sim.disciplinas?.reduce(
          (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
          0,
        ) || 0}{" "}
        questões
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
        <button
          onClick={aoEditar}
          className="flex-1 py-2 px-3 bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-300 hover:border-blue-600 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <Edit3 className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={aoDuplicar}
          className="py-2 px-2.5 bg-white hover:bg-emerald-600 text-slate-700 hover:text-white border border-slate-300 hover:border-emerald-600 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          title="Duplicar Simulado"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={aoRemover}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-slate-300 bg-white hover:border-red-200"
          title="Excluir Simulado"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
