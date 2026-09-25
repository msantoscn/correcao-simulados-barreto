import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  ClipboardList,
  BookOpen,
  X,
  Search,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

export default function Turmas({
  turmas,
  simuladosDisponiveis = [],
  onSalvarTurmas,
  onDeletarTurma,
}) {
  const [nomeNovaTurma, setNomeNovaTurma] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState("alunos");

  // Estados para Alunos
  const [novoAlunoUnico, setNovoAlunoUnico] = useState("");
  const [textoListaAlunos, setTextoListaAlunos] = useState("");
  const [mostrarAddAlunos, setMostrarAddAlunos] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState("");

  // Controle de Bimestre
  const [bimestre, setBimestre] = useState("3");

  const atualizarEPersistir = async (novaLista) => {
    try {
      await onSalvarTurmas(novaLista);
    } catch (error) {
      console.error("Erro ao sincronizar turmas com o Firebase:", error);
      alert("Erro ao guardar as alterações no Firebase. Verifique a consola.");
    }
  };

  const adicionarTurma = async (e) => {
    e.preventDefault();
    if (!nomeNovaTurma.trim()) return;

    const nomeFormatado = nomeNovaTurma.trim().toUpperCase();

    if (turmas.some((t) => t.nome === nomeFormatado)) {
      alert("Já existe uma turma com este nome.");
      return;
    }

    const nova = {
      id: Date.now().toString(),
      nome: nomeFormatado,
      alunos: [],
      simuladosVinculados: { 1: [], 2: [], 3: [], 4: [] },
    };

    const listaAtualizada = [...turmas, nova];
    await atualizarEPersistir(listaAtualizada);
    setNomeNovaTurma("");
    setTurmaSelecionadaId(nova.id);
    setModoVisualizacao("alunos");
  };

  const removerTurma = async (id) => {
    if (!confirm("Tem a certeza de que deseja eliminar esta turma?")) return;
    try {
      await onDeletarTurma(id);
      if (turmaSelecionadaId === id) setTurmaSelecionadaId(null);
    } catch (error) {
      console.error("Erro ao eliminar turma do Firebase:", error);
      alert("Erro ao eliminar turma.");
    }
  };

  const adicionarAlunoUnico = async (e) => {
    e.preventDefault();
    if (!novoAlunoUnico.trim() || !turmaSelecionadaId) return;

    let alunoJaExiste = false;
    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaSelecionadaId)) {
        const alunosAtuais = t.alunos || [];
        if (alunosAtuais.includes(novoAlunoUnico.trim().toUpperCase())) {
          alunoJaExiste = true;
          return t;
        }
        return {
          ...t,
          alunos: [...alunosAtuais, novoAlunoUnico.trim().toUpperCase()].sort(),
        };
      }
      return t;
    });

    if (alunoJaExiste) {
      alert("Este aluno já se encontra na lista.");
      return;
    }

    await atualizarEPersistir(listaAtualizada);
    setNovoAlunoUnico("");
    setMostrarAddAlunos(false);
  };

  const colarListaAlunos = async (e) => {
    e.preventDefault();
    if (!textoListaAlunos.trim() || !turmaSelecionadaId) return;

    const novosNomes = textoListaAlunos
      .split("\n")
      .map((nome) => nome.trim().toUpperCase())
      .filter((nome) => nome.length > 0);

    if (novosNomes.length === 0) return;

    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaSelecionadaId)) {
        const conjuntoAlunos = new Set([...(t.alunos || []), ...novosNomes]);
        return { ...t, alunos: Array.from(conjuntoAlunos).sort() };
      }
      return t;
    });

    await atualizarEPersistir(listaAtualizada);
    setTextoListaAlunos("");
    setMostrarAddAlunos(false);
    alert(`${novosNomes.length} aluno(s) adicionados!`);
  };

  const removerAluno = async (turmaId, nomeAluno) => {
    if (!confirm(`Remover ${nomeAluno} da turma?`)) return;
    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaId)) {
        return {
          ...t,
          alunos: (t.alunos || []).filter((a) => a !== nomeAluno),
        };
      }
      return t;
    });
    await atualizarEPersistir(listaAtualizada);
  };

  // FUNÇÃO DE VINCULAÇÃO DIRETA E SEGURA
  const vincularSimulado = async (simuladoId) => {
    if (!turmaSelecionadaId) {
      alert("Nenhuma turma selecionada!");
      return;
    }

    const turmaAlvo = turmas.find(
      (t) => String(t.id) === String(turmaSelecionadaId),
    );
    if (!turmaAlvo) return;

    const vinculosAtuais = turmaAlvo.simuladosVinculados || {
      1: [],
      2: [],
      3: [],
      4: [],
    };
    const simuladosDoBimestre = vinculosAtuais[bimestre] || [];

    if (simuladosDoBimestre.length >= 2) {
      alert(
        `Esta turma já tem o limite de 2 simulados vinculados no ${bimestre}º Bimestre.`,
      );
      return;
    }

    if (simuladosDoBimestre.includes(simuladoId)) {
      return;
    }

    const novosVinculosDoBimestre = [...simuladosDoBimestre, simuladoId];

    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaSelecionadaId)) {
        return {
          ...t,
          simuladosVinculados: {
            ...vinculosAtuais,
            [bimestre]: novosVinculosDoBimestre,
          },
        };
      }
      return t;
    });

    await atualizarEPersistir(listaAtualizada);
  };

  // FUNÇÃO DE DESVINCULAÇÃO DIRETA E SEGURA
  const desvincularSimulado = async (simuladoId) => {
    if (!confirm("Remover este simulado da turma?")) return;
    if (!turmaSelecionadaId) return;

    const turmaAlvo = turmas.find(
      (t) => String(t.id) === String(turmaSelecionadaId),
    );
    if (!turmaAlvo) return;

    const vinculosAtuais = turmaAlvo.simuladosVinculados || {
      1: [],
      2: [],
      3: [],
      4: [],
    };
    const simuladosDoBimestre = vinculosAtuais[bimestre] || [];
    const novosVinculosDoBimestre = simuladosDoBimestre.filter(
      (id) => String(id) !== String(simuladoId),
    );

    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaSelecionadaId)) {
        return {
          ...t,
          simuladosVinculados: {
            ...vinculosAtuais,
            [bimestre]: novosVinculosDoBimestre,
          },
        };
      }
      return t;
    });

    await atualizarEPersistir(listaAtualizada);
  };

  const turmaAtiva = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );
  const alunosFiltrados =
    turmaAtiva?.alunos?.filter((aluno) =>
      aluno.includes(buscaAluno.trim().toUpperCase()),
    ) || [];

  const idsVinculadosNoBimestre =
    turmaAtiva?.simuladosVinculados?.[bimestre] || [];

  const simuladosDesteBimestre = simuladosDisponiveis.filter(
    (sim) => String(sim.bimestre) === String(bimestre) || !sim.bimestre,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* =========================================================
          COLUNA ESQUERDA: LISTA DE TURMAS
          ========================================================= */}
      <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm p-4 sm:p-5 lg:p-6 border border-slate-200/80 h-fit">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
            <Users className="text-slate-600 w-5 h-5" />
          </div>
          <h2 className="text-lg font-black tracking-wide uppercase text-slate-800">
            Gerir <span className="text-[#4b82f6]">Turmas</span>
          </h2>
        </div>

        <form onSubmit={adicionarTurma} className="mb-6">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Nome da Nova Turma
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 9º ANO A"
              value={nomeNovaTurma}
              onChange={(e) => setNomeNovaTurma(e.target.value.toUpperCase())}
              className="flex-1 p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-sm font-medium outline-none transition-all uppercase placeholder:text-slate-400"
              required
            />
            <button
              type="submit"
              className="px-4 py-3 lg:py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all text-[11px] shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar
            </button>
          </div>
        </form>

        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>Turmas Registadas</span>
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
            {turmas.length}
          </span>
        </h3>

        {turmas.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Nenhuma turma cadastrada.
            </p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-2.5">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                onClick={() => {
                  setTurmaSelecionadaId(turma.id);
                  setModoVisualizacao("alunos");
                  setMostrarAddAlunos(false);
                  setBuscaAluno("");
                  if (window.innerWidth < 1024) {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`p-4 lg:p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                  String(turmaSelecionadaId) === String(turma.id)
                    ? "border-blue-400 bg-blue-50/40 shadow-sm"
                    : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <h4
                    className={`font-bold text-sm lg:text-sm uppercase mb-0.5 ${String(turmaSelecionadaId) === String(turma.id) ? "text-blue-700" : "text-slate-700"}`}
                  >
                    {turma.nome}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {turma.alunos?.length || 0} aluno(s)
                  </p>
                </div>

                {/* BOTÕES NO CARTÃO DA TURMA (VINCULAR E EXCLUIR) */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTurmaSelecionadaId(turma.id);
                      setModoVisualizacao("simulados");
                      if (window.innerWidth < 1024) {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      String(turmaSelecionadaId) === String(turma.id) &&
                      modoVisualizacao === "simulados"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                    title="Vincular Simulados"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerTurma(turma.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    title="Eliminar Turma"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          COLUNA DIREITA: GESTÃO EXCLUSIVA (ALUNOS OU SIMULADOS)
          ========================================================= */}
      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-fit lg:min-h-[500px]">
        {!turmaAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
              Selecione ou crie uma turma para gerir alunos e simulados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cabeçalho da Turma com seletor rápido de visualização */}
            <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Turma Selecionada
                  </span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                      {turmaAtiva.nome}
                    </h3>

                    {/* Botões alternadores rápidos de painel */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setModoVisualizacao("alunos")}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                          modoVisualizacao === "alunos"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Alunos ({turmaAtiva.alunos?.length || 0})
                      </button>
                      <button
                        onClick={() => setModoVisualizacao("simulados")}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                          modoVisualizacao === "simulados"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Simulados
                      </button>
                    </div>
                  </div>
                </div>

                {modoVisualizacao === "alunos" && (
                  <button
                    type="button"
                    onClick={() => setMostrarAddAlunos(!mostrarAddAlunos)}
                    className={`w-full sm:w-auto px-4 py-3 lg:py-2.5 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] shadow-sm cursor-pointer ${
                      mostrarAddAlunos
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-[#4b82f6] text-white hover:bg-blue-600"
                    }`}
                  >
                    {mostrarAddAlunos ? (
                      <>
                        <X className="w-4 h-4" /> Fechar Formulário
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Adicionar Alunos
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* CONTEÚDO CONDICIONAL: SE MODO FOR SIMULADOS */}
            {modoVisualizacao === "simulados" ? (
              <div className="p-4 sm:p-6 bg-slate-50/50 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-emerald-600" /> Gestão de
                    Simulados por Bimestre
                  </h4>

                  {/* Seletor de Bimestre */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Bimestre:
                    </span>
                    {["1", "2", "3", "4"].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBimestre(b)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          bimestre === b
                            ? "bg-slate-800 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {b}º
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Vinculados vs Disponíveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Já Vinculados */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-3 border-b border-emerald-100 pb-2">
                      Vinculados no {bimestre}º Bimestre (
                      {idsVinculadosNoBimestre.length}/2)
                    </span>
                    <div className="space-y-2.5 flex-1 overflow-auto max-h-[250px]">
                      {idsVinculadosNoBimestre.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">
                          Nenhum simulado vinculado neste período.
                        </p>
                      ) : (
                        simuladosDisponiveis
                          .filter((sim) =>
                            idsVinculadosNoBimestre.includes(sim.id),
                          )
                          .map((sim) => (
                            <div
                              key={sim.id}
                              className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs shadow-sm"
                            >
                              <div>
                                <span className="font-bold text-slate-700 uppercase block">
                                  {sim.nome || sim.titulo}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {sim.dataCriacao || "N/D"}
                                </span>
                              </div>
                              <button
                                onClick={() => desvincularSimulado(sim.id)}
                                className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors cursor-pointer"
                                title="Remover vínculo"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Disponíveis para Adicionar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-3 border-b border-emerald-100 pb-2">
                      Disponíveis para Vincular ({bimestre}º Bimestre)
                    </span>
                    <div className="space-y-2.5 flex-1 overflow-auto max-h-[250px]">
                      {simuladosDesteBimestre.filter(
                        (sim) => !idsVinculadosNoBimestre.includes(sim.id),
                      ).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">
                          Sem simulados disponíveis para este bimestre.
                        </p>
                      ) : (
                        simuladosDesteBimestre
                          .filter(
                            (sim) => !idsVinculadosNoBimestre.includes(sim.id),
                          )
                          .map((sim) => (
                            <div
                              key={sim.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs shadow-sm"
                            >
                              <div>
                                <span className="font-bold text-slate-700 uppercase block">
                                  {sim.nome || sim.titulo}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {sim.dataCriacao || "N/D"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => vincularSimulado(sim.id)}
                                disabled={idsVinculadosNoBimestre.length >= 2}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                  idsVinculadosNoBimestre.length >= 2
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60"
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Vincular
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CONTEÚDO CONDICIONAL: SE MODO FOR ALUNOS */
              <>
                {mostrarAddAlunos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-5 lg:p-6 bg-slate-50 border-b border-slate-200">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <UserPlus className="w-3.5 h-3.5" /> Adicionar
                        Individual
                      </h4>
                      <form
                        onSubmit={adicionarAlunoUnico}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          placeholder="Nome completo do aluno"
                          value={novoAlunoUnico}
                          onChange={(e) => setNovoAlunoUnico(e.target.value)}
                          className="w-full p-3 lg:p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm outline-none uppercase"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-white border-2 border-[#4b82f6] text-[#4b82f6] text-[11px] font-bold uppercase rounded-xl hover:bg-blue-50 cursor-pointer"
                        >
                          Gravar Aluno
                        </button>
                      </form>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <ClipboardList className="w-3.5 h-3.5" /> Importar Lista
                      </h4>
                      <form onSubmit={colarListaAlunos} className="space-y-3">
                        <textarea
                          rows="3"
                          placeholder="Cole a lista (um por linha)"
                          value={textoListaAlunos}
                          onChange={(e) => setTextoListaAlunos(e.target.value)}
                          className="w-full p-3 lg:p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none uppercase resize-none"
                        ></textarea>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-emerald-500 text-white text-[11px] font-bold uppercase rounded-xl hover:bg-emerald-600 cursor-pointer"
                        >
                          Importar Todos
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* LISTA DE ALUNOS DA TURMA */}
                <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 bg-slate-50/30">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Alunos Matriculados ({turmaAtiva.alunos?.length || 0})
                  </h4>

                  {!turmaAtiva.alunos || turmaAtiva.alunos.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                        Nenhum aluno registado nesta turma.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between gap-3">
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar aluno..."
                            value={buscaAluno}
                            onChange={(e) => setBuscaAluno(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 uppercase"
                          />
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[300px]">
                        {alunosFiltrados.map((aluno, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center px-4 py-3 hover:bg-blue-50/30 group"
                          >
                            <span className="text-xs font-bold text-slate-700 uppercase">
                              {aluno}
                            </span>
                            <button
                              onClick={() => removerAluno(turmaAtiva.id, aluno)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
