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
  Copy, // Ícone para duplicar
  Search,
  RotateCcw,
} from "lucide-react";

export default function Admin({
  simulados,
  onSalvarSimulado,
  onDeletarSimulado,
}) {
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nomeSimulado, setNomeSimulado] = useState("");
  const [bimestre, setBimestre] = useState("3");
  const [termoBusca, setTermoBusca] = useState("");

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

  const limparGabaritoDisciplina = (id) => {
    setDisciplinas((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return { ...d, gabarito: Array(d.gabarito.length).fill("") };
        }
        return d;
      }),
    );
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

    // Restrito a 4 alternativas: A, B, C, D
    if (val === "" || ["A", "B", "C", "D"].includes(val)) {
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

  const simuladosFiltrados = simulados.filter((sim) =>
    sim.nome.toLowerCase().includes(termoBusca.toLowerCase()),
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 font-['Arial',sans-serif] box-border">
      {/* ========================================= */}
      {/* COLUNA ESQUERDA - FORMULÁRIO DE CRIAÇÃO   */}
      {/* ========================================= */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-3 sm:p-8 transition-all overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-50 text-[#4b82f6] rounded-lg border border-slate-200 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide truncate font-['Arial',sans-serif]">
                {idEmEdicao ? "EDITAR" : "CRIAR"}{" "}
                <span className="text-red-600 font-bold">SIMULADO</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-bold truncate font-['Arial',sans-serif]">
                Gabarito (A, B, C, D). Avanço automático.
              </p>
            </div>
          </div>

          {idEmEdicao && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="w-full sm:w-auto text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded uppercase flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={guardarSimulado} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nome do Simulado
              </label>
              <input
                type="text"
                placeholder="Ex: Simulado 1 - Trimestral"
                value={nomeSimulado}
                onChange={(e) => setNomeSimulado(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded text-sm sm:text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-500 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> Bimestre Ref.
              </label>
              <select
                value={bimestre}
                onChange={(e) => setBimestre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded text-sm sm:text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-500 transition-all uppercase cursor-pointer"
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 font-['Arial',sans-serif]">
              Disciplinas e Gabarito Oficial
            </h3>

            {disciplinas.map((disc, index) => (
              <DisciplinaCard
                key={disc.id}
                index={index}
                disc={disc}
                podeRemover={disciplinas.length > 1}
                aoRemover={() => removerDisciplina(disc.id)}
                aoLimpar={() => limparGabaritoDisciplina(disc.id)}
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
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-[#4b82f6] border border-slate-300 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Outra Disciplina
            </button>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
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
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-3 sm:p-6 h-fit transition-all shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-4 min-w-0">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide truncate font-['Arial',sans-serif]">
              Simulados{" "}
              <span className="text-[#4b82f6] font-bold">Gerados</span>
            </h3>
            <p className="text-xs text-slate-500 font-bold truncate font-['Arial',sans-serif]">
              Gestão e alteração
            </p>
          </div>
        </div>

        {/* Sistema de Busca nos Simulados */}
        <div className="mb-4 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Buscar simulado..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-300 rounded text-sm sm:text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        {simuladosFiltrados.length === 0 ? (
          <div className="text-center py-10 px-4 rounded border border-dashed border-slate-200 bg-slate-50/50">
            <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nenhum simulado encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {simuladosFiltrados.map((sim) => (
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
  aoLimpar,
  aoAtualizar,
  aoAtualizarGabarito,
}) {
  return (
    <div className="p-3 sm:p-4 bg-slate-50/50 border border-slate-200 rounded-xl relative transition-all">
      <div className="flex justify-between items-center mb-3">
        <span className="inline-flex items-center px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded font-['Arial',sans-serif]">
          Disciplina {index + 1}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={aoLimpar}
            className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded transition cursor-pointer flex items-center gap-1"
            title="Limpar Respostas"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" /> Limpar
          </button>

          {podeRemover && (
            <button
              type="button"
              onClick={aoRemover}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer border border-slate-300 bg-white"
              title="Remover Disciplina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            Nome da Disciplina
          </label>
          <input
            type="text"
            placeholder="Ex: Ling. Portuguesa"
            value={disc.nome}
            onChange={(e) => aoAtualizar("nome", e.target.value)}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm sm:text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            Qtd. de Questões (1-40)
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={disc.qtdQuestoes}
            onChange={(e) => aoAtualizar("qtdQuestoes", e.target.value)}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm sm:text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-500"
            required
          />
        </div>
      </div>

      {/* Grid do Gabarito Otimizado para Mobile */}
      <div className="p-3 bg-white border border-slate-200 rounded overflow-x-auto">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left font-['Arial',sans-serif]">
          Respostas Corretas (A, B, C, D)
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 min-w-[260px]">
          {disc.gabarito.map((resposta, qIdx) => (
            <div key={qIdx} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold mb-1 font-['Arial',sans-serif]">
                Q{qIdx + 1}
              </span>
              <input
                id={`admin-q-${disc.id}-${qIdx}`}
                type="text"
                maxLength="1"
                value={resposta}
                onChange={(e) => aoAtualizarGabarito(qIdx, e.target.value)}
                className="w-9 h-9 sm:w-10 sm:h-10 text-center text-sm sm:text-base font-bold uppercase rounded border border-slate-300 bg-slate-100 text-slate-900 outline-none focus:bg-white focus:border-slate-500 transition"
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
      className={`p-3.5 rounded-lg border transition-all bg-white ${
        emEdicao
          ? "border-[#4b82f6] bg-blue-50/20"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex justify-between items-start mb-1.5 gap-2 min-w-0">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide leading-tight truncate font-['Arial',sans-serif]">
            {sim.nome}
          </h4>
          {sim.bimestre && (
            <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200 font-['Arial',sans-serif]">
              {sim.bimestre}º Bimestre
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200">
          {sim.dataCriacao || "N/D"}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 mt-1.5 font-['Arial',sans-serif]">
        {sim.disciplinas?.length || 0} disciplina(s) •{" "}
        {sim.disciplinas?.reduce(
          (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
          0,
        ) || 0}{" "}
        questões
      </p>

      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap sm:flex-nowrap">
        <button
          onClick={aoEditar}
          className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-[#4b82f6] text-slate-600 hover:text-white border border-slate-300 text-[11px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <Edit3 className="w-3 h-3" /> Editar
        </button>
        <button
          onClick={aoDuplicar}
          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 text-[11px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition cursor-pointer"
          title="Duplicar Simulado"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={aoRemover}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer border border-slate-300 bg-slate-100"
          title="Excluir Simulado"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
