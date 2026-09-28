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
  Search,
  RotateCcw,
  Plus,
  CheckCircle2,
} from "lucide-react";

export default function Admin({
  simulados,
  onSalvarSimulado,
  onDeletarSimulado,
}) {
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nomeSimulado, setNomeSimulado] = useState("");
  const [bimestre, setBimestre] = useState("3");
  const [isAdaptado, setIsAdaptado] = useState(false);
  const [simuladoPadraoId, setSimuladoPadraoId] = useState(null);
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

    setTimeout(() => {
      const campoQ1 = document.getElementById(`admin-q-${id}-0`);
      if (campoQ1) {
        campoQ1.focus();
        campoQ1.select();
      }
    }, 50);
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
          const valFinal = campo === "nome" ? valor.toUpperCase() : valor;
          return { ...d, [campo]: valFinal };
        }
        return d;
      }),
    );
  };

  const atualizarGabaritoOficial = (disciplinaId, index, resposta) => {
    const val = resposta.toUpperCase();
    const permitidas = isAdaptado ? ["A", "B"] : ["A", "B", "C", "D"];

    if (val === "" || permitidas.includes(val)) {
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
        if (proximoCampo) {
          proximoCampo.focus();
          proximoCampo.select();
        }
      }
    }
  };

  const carregarParaEdicao = (simulado) => {
    setIdEmEdicao(simulado.id);
    const adaptadoCheck =
      !!simulado.adaptado ||
      (simulado.nome || "").toUpperCase().includes("ADAPTADO");
    const nomeLimpo = (simulado.nome || "")
      .replace(/\s*-\s*ADAPTADO\s*$/i, "")
      .trim();

    setNomeSimulado(nomeLimpo);
    setBimestre(simulado.bimestre || "3");
    setIsAdaptado(adaptadoCheck);
    setSimuladoPadraoId(simulado.simuladoPadraoId || null);
    setDisciplinas(JSON.parse(JSON.stringify(simulado.disciplinas)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicarSimulado = (simulado) => {
    setIdEmEdicao(null);
    const adaptadoCheck =
      !!simulado.adaptado ||
      (simulado.nome || "").toUpperCase().includes("ADAPTADO");
    const nomeLimpo = (simulado.nome || "")
      .replace(/\s*-\s*ADAPTADO\s*$/i, "")
      .trim();

    setNomeSimulado(`${nomeLimpo} (CÓPIA)`.toUpperCase());
    setBimestre(simulado.bimestre || "3");
    setIsAdaptado(adaptadoCheck);
    setSimuladoPadraoId(null);

    const disciplinasCopiadas = JSON.parse(
      JSON.stringify(simulado.disciplinas),
    ).map((d) => ({
      ...d,
      nome: String(d.nome || "").toUpperCase(),
      id: Date.now() + Math.random(),
    }));
    setDisciplinas(disciplinasCopiadas);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lidarComBotaoAdaptar = (simuladoPadrao) => {
    const adaptadoExistente = simulados.find((s) => {
      const isAdapt =
        !!s.adaptado || (s.nome || "").toUpperCase().includes("ADAPTADO");
      const sNomeBase = (s.nome || "")
        .replace(/\s*-\s*ADAPTADO\s*$/i, "")
        .trim()
        .toUpperCase();
      const padraoNomeBase = (simuladoPadrao.nome || "")
        .replace(/\s*-\s*ADAPTADO\s*$/i, "")
        .trim()
        .toUpperCase();
      return (
        isAdapt &&
        (s.simuladoPadraoId === simuladoPadrao.id ||
          sNomeBase === padraoNomeBase)
      );
    });

    if (adaptadoExistente) {
      carregarParaEdicao(adaptadoExistente);
    } else {
      setIdEmEdicao(null);
      const nomeBase = (simuladoPadrao.nome || "")
        .replace(/\s*-\s*ADAPTADO\s*$/i, "")
        .trim();

      setNomeSimulado(`${nomeBase} - ADAPTADO`.toUpperCase());
      setBimestre(simuladoPadrao.bimestre || "3");
      setIsAdaptado(true);
      setSimuladoPadraoId(simuladoPadrao.id);

      const disciplinasCopiadas = JSON.parse(
        JSON.stringify(simuladoPadrao.disciplinas),
      ).map((d) => {
        const gabaritoAdaptado = (d.gabarito || []).map((resp) =>
          ["A", "B"].includes(resp) ? resp : "",
        );
        return {
          ...d,
          nome: String(d.nome || "").toUpperCase(),
          gabarito: gabaritoAdaptado,
          id: Date.now() + Math.random(),
        };
      });

      setDisciplinas(disciplinasCopiadas);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelarEdicao = () => {
    setIdEmEdicao(null);
    setNomeSimulado("");
    setBimestre("3");
    setIsAdaptado(false);
    setSimuladoPadraoId(null);
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

    let nomeFinal = nomeSimulado.trim().toUpperCase();
    if (isAdaptado && !nomeFinal.includes("ADAPTADO")) {
      nomeFinal = `${nomeFinal} - ADAPTADO`;
    }

    const disciplinasSanitizadas = disciplinas.map((d) => ({
      ...d,
      nome: String(d.nome || "")
        .trim()
        .toUpperCase(),
    }));

    try {
      if (idEmEdicao) {
        const simuladoAtualizado = {
          id: idEmEdicao,
          nome: nomeFinal,
          bimestre: bimestre,
          adaptado: isAdaptado,
          simuladoPadraoId: simuladoPadraoId || null,
          disciplinas: disciplinasSanitizadas,
        };
        await onSalvarSimulado(simuladoAtualizado);
        alert("Simulado atualizado com sucesso!");
      } else {
        const novoSimulado = {
          nome: nomeFinal,
          bimestre: bimestre,
          adaptado: isAdaptado,
          simuladoPadraoId: simuladoPadraoId || null,
          disciplinas: disciplinasSanitizadas,
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

  const simuladosFiltrados = simulados
    .filter((sim) => {
      const isAdapt =
        !!sim.adaptado || (sim.nome || "").toUpperCase().includes("ADAPTADO");
      return !isAdapt;
    })
    .filter((sim) => sim.nome.toLowerCase().includes(termoBusca.toLowerCase()));

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans antialiased box-border">
      {/* COLUNA ESQUERDA - FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
      <div className="lg:col-span-2 bg-white rounded-md border border-[#dbc8b6] p-4 sm:p-5 transition-all overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-[#dbc8b6]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 text-white rounded-md shrink-0 ${isAdaptado ? "bg-orange-500" : "bg-blue-500"}`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide truncate">
                {idEmEdicao ? "EDITAR" : "CRIAR"}{" "}
                <span
                  className={
                    isAdaptado
                      ? "text-orange-600 font-bold"
                      : "text-red-500 font-bold"
                  }
                >
                  {isAdaptado ? "SIMULADO ADAPTADO" : "SIMULADO"}
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium truncate">
                {isAdaptado
                  ? "Gabarito restrito (A, B)."
                  : "Gabarito (A, B, C, D)."}{" "}
                Avanço automático.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {idEmEdicao && isAdaptado && (
              <button
                type="button"
                onClick={() => removerSimulado(idEmEdicao)}
                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-md uppercase flex items-center gap-1 transition cursor-pointer shrink-0 active:scale-95"
                title="Excluir este simulado adaptado"
              >
                <Trash2 className="w-4 h-4" /> Excluir Adaptado
              </button>
            )}

            {idEmEdicao && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-[#dbc8b6] px-3 py-2 rounded-md uppercase flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </div>

        <form onSubmit={guardarSimulado} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Nome do Simulado
              </label>
              <input
                type="text"
                placeholder="Ex: Simulado 1 - Trimestral"
                value={nomeSimulado}
                onChange={(e) => setNomeSimulado(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-blue-500" />{" "}
                Bimestre Ref.
              </label>
              <select
                value={bimestre}
                onChange={(e) => setBimestre(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase cursor-pointer shadow-xs"
                required
              >
                <option value="1">1º Bimestre</option>
                <option value="2">2º Bimestre</option>
                <option value="3">3º Bimestre</option>
                <option value="4">4º Bimestre</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest border-b border-[#dbc8b6] pb-2 flex items-center justify-between">
              <span>Disciplinas e Gabarito Oficial</span>
              {isAdaptado && (
                <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold uppercase">
                  Modo Adaptado (A / B)
                </span>
              )}
            </h3>

            {disciplinas.map((disc, index) => (
              <DisciplinaCard
                key={disc.id}
                index={index}
                disc={disc}
                isAdaptado={isAdaptado}
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

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={adicionarDisciplina}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-blue-600 border border-[#dbc8b6] font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Outra Disciplina
            </button>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 text-white font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99] ${
                isAdaptado
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              <Save className="w-4 h-4" />
              {idEmEdicao ? "Atualizar Simulado" : "Salvar Simulado"}
            </button>
          </div>
        </form>
      </div>

      {/* COLUNA DIREITA - LISTAGEM DE SIMULADOS PADRÃO */}
      <div className="lg:col-span-1 bg-white rounded-md border border-[#dbc8b6] p-4 sm:p-5 h-fit transition-all shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#dbc8b6] mb-3.5 min-w-0">
          <div className="p-2 bg-gray-100 text-gray-600 rounded-md border border-[#dbc8b6] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide truncate">
              SIMULADOS <span className="text-red-500 font-bold">GERADOS</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium truncate">
              Gestão e alteração
            </p>
          </div>
        </div>

        <div className="mb-3 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar simulado..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400"
          />
        </div>

        {simuladosFiltrados.length === 0 ? (
          <div className="text-center py-8 px-3 rounded-md border border-dashed border-[#dbc8b6] bg-gray-50">
            <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Nenhum simulado encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {simuladosFiltrados.map((sim) => {
              const possuiAdaptado = simulados.some((s) => {
                const isAdapt =
                  !!s.adaptado ||
                  (s.nome || "").toUpperCase().includes("ADAPTADO");
                const sNomeBase = (s.nome || "")
                  .replace(/\s*-\s*ADAPTADO\s*$/i, "")
                  .trim()
                  .toUpperCase();
                const simNomeBase = (sim.nome || "")
                  .replace(/\s*-\s*ADAPTADO\s*$/i, "")
                  .trim()
                  .toUpperCase();
                return (
                  isAdapt &&
                  (s.simuladoPadraoId === sim.id || sNomeBase === simNomeBase)
                );
              });

              return (
                <SimuladoCard
                  key={sim.id}
                  sim={sim}
                  possuiAdaptado={possuiAdaptado}
                  emEdicao={idEmEdicao === sim.id}
                  aoEditar={() => carregarParaEdicao(sim)}
                  aoDuplicar={() => duplicarSimulado(sim)}
                  aoAdaptar={() => lidarComBotaoAdaptar(sim)}
                  aoRemover={() => removerSimulado(sim.id)}
                />
              );
            })}
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
  isAdaptado,
  podeRemover,
  aoRemover,
  aoLimpar,
  aoAtualizar,
  aoAtualizarGabarito,
}) {
  return (
    <div className="p-3 sm:p-4 bg-gray-50 border border-[#dbc8b6] rounded-md relative transition-all">
      <div className="flex justify-between items-center mb-3">
        <span className="inline-flex items-center px-2.5 py-1 bg-amber-50/90 text-amber-900 border border-[#dbc8b6] text-xs font-bold uppercase tracking-wider rounded-md">
          Disciplina {index + 1}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={aoLimpar}
            className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-[#dbc8b6] rounded-md transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
            title="Limpar Respostas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Limpar
          </button>

          {podeRemover && (
            <button
              type="button"
              onClick={aoRemover}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer border border-[#dbc8b6] bg-white active:scale-95"
              title="Remover Disciplina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Nome da Disciplina
          </label>
          <input
            type="text"
            placeholder="Ex: Ling. Portuguesa"
            value={disc.nome}
            onChange={(e) => aoAtualizar("nome", e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Qtd. de Questões (1-40)
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={disc.qtdQuestoes}
            onChange={(e) => aoAtualizar("qtdQuestoes", e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="p-3 bg-white border border-[#dbc8b6] rounded-md overflow-x-auto">
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 text-center sm:text-left">
          {isAdaptado
            ? "Respostas Corretas (A, B)"
            : "Respostas Corretas (A, B, C, D)"}
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 min-w-[260px]">
          {disc.gabarito.map((resposta, qIdx) => (
            <div key={qIdx} className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-bold mb-1">
                Q{qIdx + 1}
              </span>
              <input
                id={`admin-q-${disc.id}-${qIdx}`}
                type="text"
                maxLength="1"
                value={resposta}
                onChange={(e) => aoAtualizarGabarito(qIdx, e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                className="w-9 h-9 sm:w-10 sm:h-10 text-center text-xs sm:text-sm font-bold uppercase rounded-md border border-[#dbc8b6] bg-white text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimuladoCard({
  sim,
  possuiAdaptado,
  emEdicao,
  aoEditar,
  aoDuplicar,
  aoAdaptar,
  aoRemover,
}) {
  return (
    <div
      className={`p-3 rounded-md border transition-all bg-white ${
        emEdicao
          ? "border-blue-500 bg-blue-50/20 shadow-sm"
          : "border-[#dbc8b6] hover:bg-amber-50/20"
      }`}
    >
      <div className="mb-2 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide leading-tight break-words">
            {sim.nome}
          </h4>
          {possuiAdaptado && (
            <span
              className="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 flex items-center gap-0.5"
              title="Versão adaptada criada"
            >
              <CheckCircle2 className="w-3 h-3 text-orange-600" /> Adaptado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {sim.bimestre && (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-200">
              {sim.bimestre}º Bimestre
            </span>
          )}
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-medium border border-[#dbc8b6]">
            {sim.dataCriacao || "N/D"}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-2.5">
        {sim.disciplinas?.length || 0} disciplina(s) •{" "}
        {sim.disciplinas?.reduce(
          (acc, d) => acc + (parseInt(d.qtdQuestoes) || 0),
          0,
        ) || 0}{" "}
        questões
      </p>

      <div className="flex items-center gap-1.5 pt-2 border-t border-[#dbc8b6] flex-wrap">
        <button
          onClick={aoEditar}
          className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-blue-500 text-gray-700 hover:text-white border border-[#dbc8b6] text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5" /> Editar
        </button>

        <button
          onClick={aoAdaptar}
          className={`py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 transition cursor-pointer active:scale-95 border ${
            possuiAdaptado
              ? "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-300"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
          }`}
          title={
            possuiAdaptado
              ? "Editar simulado adaptado existente"
              : "Criar simulado adaptado"
          }
        >
          {possuiAdaptado ? (
            <Edit3 className="w-3.5 h-3.5 text-orange-600" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
          )}
          Adaptar
        </button>

        <button
          onClick={aoDuplicar}
          className="py-1.5 px-2 bg-gray-50 hover:bg-gray-200 text-gray-700 border border-[#dbc8b6] text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
          title="Duplicar Simulado"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={aoRemover}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer border border-[#dbc8b6] bg-gray-50 active:scale-95"
          title="Excluir Simulado"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
