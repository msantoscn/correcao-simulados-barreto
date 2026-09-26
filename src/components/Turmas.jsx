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
  Edit3,
  Save,
  Check,
} from "lucide-react";

export default function Turmas({
  turmas,
  simuladosDisponiveis = [],
  onSalvarTurmas,
  onDeletarTurma,
}) {
  const [nomeTurmaInput, setNomeTurmaInput] = useState("");
  const [turmaEmEdicaoId, setTurmaEmEdicaoId] = useState(null);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState("alunos");
  const [buscaTurma, setBuscaTurma] = useState("");

  // Estados para Alunos
  const [novoAlunoUnico, setNovoAlunoUnico] = useState("");
  const [textoListaAlunos, setTextoListaAlunos] = useState("");
  const [mostrarAddAlunos, setMostrarAddAlunos] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState("");

  // Estado para Edição de Aluno
  const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
  const [nomeAlunoEditado, setNomeAlunoEditado] = useState("");

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

  const lidarComSubmissaoTurma = async (e) => {
    e.preventDefault();
    if (!nomeTurmaInput.trim()) return;

    const nomeFormatado = nomeTurmaInput.trim().toUpperCase();

    if (turmaEmEdicaoId) {
      if (
        turmas.some(
          (t) =>
            t.nome === nomeFormatado &&
            String(t.id) !== String(turmaEmEdicaoId),
        )
      ) {
        alert("Já existe outra turma com este nome.");
        return;
      }

      const listaAtualizada = turmas.map((t) => {
        if (String(t.id) === String(turmaEmEdicaoId)) {
          return { ...t, nome: nomeFormatado };
        }
        return t;
      });

      await atualizarEPersistir(listaAtualizada);
      cancelarEdicao();
      return;
    }

    if (turmas.some((t) => t.nome === nomeFormatado)) {
      alert("Já existe uma turma com este nome.");
      return;
    }

    const idGerado = `turma_${turmas.length + 1}_${nomeFormatado.replace(/\s+/g, "")}`;
    const nova = {
      id: idGerado,
      nome: nomeFormatado,
      alunos: [],
      simuladosVinculados: { 1: [], 2: [], 3: [], 4: [] },
    };

    const listaAtualizada = [...turmas, nova];
    await atualizarEPersistir(listaAtualizada);
    setNomeTurmaInput("");
    setTurmaSelecionadaId(nova.id);
    setModoVisualizacao("alunos");
  };

  const iniciarEdicaoTurma = (turma) => {
    setTurmaEmEdicaoId(turma.id);
    setNomeTurmaInput(turma.nome);
  };

  const cancelarEdicao = () => {
    setTurmaEmEdicaoId(null);
    setNomeTurmaInput("");
  };

  const removerTurma = async (id) => {
    if (!confirm("Tem a certeza de que deseja eliminar esta turma?")) return;
    try {
      await onDeletarTurma(id);
      if (turmaSelecionadaId === id) setTurmaSelecionadaId(null);
      if (turmaEmEdicaoId === id) cancelarEdicao();
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

  const iniciarEdicaoAluno = (nome) => {
    setAlunoEmEdicao(nome);
    setNomeAlunoEditado(nome);
  };

  const cancelarEdicaoAluno = () => {
    setAlunoEmEdicao(null);
    setNomeAlunoEditado("");
  };

  const salvarEdicaoAluno = async (turmaId, nomeAntigo) => {
    const nomeNovoFormatado = nomeAlunoEditado.trim().toUpperCase();
    if (!nomeNovoFormatado) return;

    if (nomeNovoFormatado === nomeAntigo) {
      cancelarEdicaoAluno();
      return;
    }

    const turmaAlvo = turmas.find((t) => String(t.id) === String(turmaId));
    if (turmaAlvo?.alunos?.includes(nomeNovoFormatado)) {
      alert("Já existe um aluno com este nome nesta turma.");
      return;
    }

    const listaAtualizada = turmas.map((t) => {
      if (String(t.id) === String(turmaId)) {
        const novosAlunos = (t.alunos || [])
          .map((a) => (a === nomeAntigo ? nomeNovoFormatado : a))
          .sort();
        return { ...t, alunos: novosAlunos };
      }
      return t;
    });

    await atualizarEPersistir(listaAtualizada);
    cancelarEdicaoAluno();
  };

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

  const turmasFiltradas = turmas.filter((t) =>
    t.nome.toUpperCase().includes(buscaTurma.trim().toUpperCase()),
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

  const formatarNomeTurmaBicolor = (nome) => {
    if (!nome) return "";
    const partes = nome.split("-");

    if (partes.length > 1) {
      const antes = partes.slice(0, -1).join("-").trim();
      const depois = partes[partes.length - 1].trim();

      return (
        <>
          {antes} - <span className="text-red-500 font-bold">{depois}</span>
        </>
      );
    }

    return nome.trim();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 font-sans antialiased">
      {/* =========================================================
          COLUNA ESQUERDA: LISTA DE TURMAS
          ========================================================= */}
      <div className="lg:col-span-4 bg-white rounded-md shadow-sm p-3 sm:p-4 border border-[#dbc8b6] h-fit">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#dbc8b6] mb-3.5">
          <div className="p-1.5 bg-blue-500 text-white rounded-md">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold tracking-wide uppercase text-gray-800">
            GERIR <span className="text-red-500 font-bold">TURMAS</span>
          </h2>
        </div>

        {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE TURMA */}
        <form onSubmit={lidarComSubmissaoTurma} className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {turmaEmEdicaoId ? "Editar Nome da Turma" : "Nome da Turma"}
            </label>
            {turmaEmEdicaoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="text-[10px] text-red-500 font-bold hover:underline uppercase"
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 6º ANO - A ou 5ª 6ª SÉRIE - EJA"
              value={nomeTurmaInput}
              onChange={(e) => setNomeTurmaInput(e.target.value.toUpperCase())}
              className="flex-1 p-2 bg-white border border-[#dbc8b6] rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium outline-none transition-all uppercase placeholder:text-gray-400 placeholder:font-light placeholder:normal-case shadow-xs"
              required
            />
            <button
              type="submit"
              className={`px-3 py-2 text-white font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm cursor-pointer ${
                turmaEmEdicaoId
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              title={turmaEmEdicaoId ? "Salvar Edição" : "Criar Turma"}
            >
              {turmaEmEdicaoId ? (
                <Save className="w-4 h-4" />
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Criar
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Turmas Registadas
          </h3>
          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-medium border border-[#dbc8b6]">
            {turmasFiltradas.length} / {turmas.length}
          </span>
        </div>

        <div className="mb-2.5 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar turma..."
            value={buscaTurma}
            onChange={(e) => setBuscaTurma(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dbc8b6] rounded-md text-xs font-medium outline-none focus:border-blue-500 uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400 shadow-xs"
          />
        </div>

        {turmasFiltradas.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-md border border-dashed border-[#dbc8b6]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nenhuma turma encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {turmasFiltradas.map((turma) => (
              <div
                key={turma.id}
                onClick={() => {
                  setTurmaSelecionadaId(turma.id);
                  setModoVisualizacao("alunos");
                  setMostrarAddAlunos(false);
                  setBuscaAluno("");
                  cancelarEdicaoAluno();
                  if (window.innerWidth < 1024) {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`p-2 rounded-md border transition-all flex items-center justify-between cursor-pointer group ${
                  String(turmaSelecionadaId) === String(turma.id)
                    ? "border-blue-500 bg-blue-50/40 shadow-sm"
                    : "border-[#dbc8b6] bg-white hover:bg-amber-50/20"
                }`}
              >
                <div>
                  <h4
                    className={`font-bold text-xs uppercase mb-0.5 ${
                      String(turmaSelecionadaId) === String(turma.id)
                        ? "text-blue-700"
                        : "text-gray-800"
                    }`}
                  >
                    {turma.nome}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {turma.alunos?.length || 0} aluno(s)
                  </p>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTurmaSelecionadaId(turma.id);
                      setModoVisualizacao("simulados");
                      cancelarEdicaoAluno();
                      if (window.innerWidth < 1024) {
                        window.scrollTo({
                          top: document.body.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer shadow-xs ${
                      String(turmaSelecionadaId) === String(turma.id) &&
                      modoVisualizacao === "simulados"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-300"
                    }`}
                    title="Vincular Simulados"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => iniciarEdicaoTurma(turma)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer border border-[#dbc8b6] bg-white shadow-xs"
                    title="Editar Nome da Turma"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removerTurma(turma.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-[#dbc8b6] bg-white shadow-xs"
                    title="Eliminar Turma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
      <div className="lg:col-span-8 bg-white rounded-md shadow-sm border border-[#dbc8b6] overflow-hidden flex flex-col h-fit lg:min-h-[460px]">
        {!turmaAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 min-h-[260px]">
            <div className="w-12 h-12 bg-white rounded-md shadow-sm border border-[#dbc8b6] flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">
              Selecione ou crie uma turma para gerir alunos e simulados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cabeçalho da Turma */}
            <div className="p-3 sm:p-4 border-b border-[#dbc8b6] bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold tracking-wide uppercase text-gray-800">
                    {formatarNomeTurmaBicolor(turmaAtiva.nome)}
                  </h3>
                </div>

                {/* Botão de Adicionar Alunos (visível apenas na aba de alunos) */}
                {modoVisualizacao === "alunos" && (
                  <button
                    type="button"
                    onClick={() => setMostrarAddAlunos(!mostrarAddAlunos)}
                    className={`px-3 py-1.5 font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm cursor-pointer ${
                      mostrarAddAlunos
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-[#dbc8b6]"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {mostrarAddAlunos ? (
                      <>
                        <X className="w-4 h-4" /> Fechar
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Adicionar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* CONTEÚDO CONDICIONAL: SE MODO FOR SIMULADOS */}
            {modoVisualizacao === "simulados" ? (
              <div className="p-3 sm:p-4 bg-white flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-emerald-600" /> Gestão de
                    Simulados por Bimestre
                  </h4>

                  {/* Seletor de Bimestre */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Bimestre:
                    </span>
                    {["1", "2", "3", "4"].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBimestre(b)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          bimestre === b
                            ? "bg-blue-500 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-[#dbc8b6] hover:bg-gray-100"
                        }`}
                      >
                        {b}º
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Vinculados vs Disponíveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Já Vinculados */}
                  <div className="bg-gray-50 p-3 rounded-md border border-emerald-300 shadow-sm flex flex-col">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-2.5 border-b border-emerald-200 pb-1.5">
                      Vinculados no {bimestre}º Bimestre (
                      {idsVinculadosNoBimestre.length}/2)
                    </span>
                    <div className="space-y-2 flex-1 overflow-auto max-h-[220px]">
                      {idsVinculadosNoBimestre.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-5">
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
                              className="flex items-center justify-between p-2.5 bg-white rounded-md border border-emerald-300 text-xs shadow-sm"
                            >
                              <div>
                                <span className="font-bold text-gray-800 uppercase block">
                                  {sim.nome || sim.titulo}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {sim.dataCriacao || "N/D"}
                                </span>
                              </div>
                              <button
                                onClick={() => desvincularSimulado(sim.id)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer border border-[#dbc8b6]"
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
                  <div className="bg-gray-50 p-3 rounded-md border border-[#dbc8b6] shadow-sm flex flex-col">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2.5 border-b border-[#dbc8b6] pb-1.5">
                      Disponíveis para Vincular ({bimestre}º Bimestre)
                    </span>
                    <div className="space-y-2 flex-1 overflow-auto max-h-[220px]">
                      {simuladosDesteBimestre.filter(
                        (sim) => !idsVinculadosNoBimestre.includes(sim.id),
                      ).length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-5">
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
                              className="flex items-center justify-between p-2.5 bg-white rounded-md border border-[#dbc8b6] text-xs shadow-sm"
                            >
                              <div>
                                <span className="font-bold text-gray-800 uppercase block">
                                  {sim.nome || sim.titulo}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {sim.dataCriacao || "N/D"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => vincularSimulado(sim.id)}
                                disabled={idsVinculadosNoBimestre.length >= 2}
                                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                  idsVinculadosNoBimestre.length >= 2
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-[#dbc8b6]"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-gray-50 border-b border-[#dbc8b6]">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <UserPlus className="w-3.5 h-3.5" /> Adicionar
                        Individual
                      </h4>
                      <form
                        onSubmit={adicionarAlunoUnico}
                        className="space-y-2.5"
                      >
                        <input
                          type="text"
                          placeholder="Nome completo do aluno"
                          value={novoAlunoUnico}
                          onChange={(e) => setNovoAlunoUnico(e.target.value)}
                          className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md focus:ring-1 focus:ring-blue-500 text-xs font-medium outline-none uppercase placeholder:text-gray-400 placeholder:font-light shadow-xs"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full py-1.5 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-blue-600 cursor-pointer transition-colors shadow-xs"
                        >
                          Gravar Aluno
                        </button>
                      </form>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <ClipboardList className="w-3.5 h-3.5" /> Importar Lista
                      </h4>
                      <form onSubmit={colarListaAlunos} className="space-y-2.5">
                        <textarea
                          rows="2"
                          placeholder="Cole a lista (um por linha)"
                          value={textoListaAlunos}
                          onChange={(e) => setTextoListaAlunos(e.target.value)}
                          className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md focus:ring-1 focus:ring-green-500 text-xs font-medium uppercase resize-none placeholder:text-gray-400 placeholder:font-light shadow-xs"
                        ></textarea>
                        <button
                          type="submit"
                          className="w-full py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-emerald-700 cursor-pointer transition-colors shadow-xs"
                        >
                          Importar Todos
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* LISTA DE ALUNOS DA TURMA */}
                <div className="flex-1 flex flex-col p-3 sm:p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Alunos Matriculados ({turmaAtiva.alunos?.length || 0})
                    </h4>
                  </div>

                  {!turmaAtiva.alunos || turmaAtiva.alunos.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
                        Nenhum aluno registado nesta turma.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col h-full bg-white border border-[#dbc8b6] rounded-md overflow-hidden shadow-xs">
                      <div className="bg-gray-50 border-b border-[#dbc8b6] p-2.5 flex justify-between gap-3">
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar aluno..."
                            value={buscaAluno}
                            onChange={(e) => setBuscaAluno(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dbc8b6] rounded-md text-xs font-medium outline-none focus:border-blue-500 uppercase placeholder:text-gray-400 placeholder:font-light shadow-xs"
                          />
                        </div>
                      </div>
                      <div className="divide-y divide-[#dbc8b6] flex-1">
                        {alunosFiltrados.map((aluno, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center px-3.5 py-1.5 hover:bg-amber-50/20 group gap-2 transition-colors"
                          >
                            {alunoEmEdicao === aluno ? (
                              <div className="flex items-center gap-2 w-full py-0.5">
                                <input
                                  type="text"
                                  value={nomeAlunoEditado}
                                  onChange={(e) =>
                                    setNomeAlunoEditado(
                                      e.target.value.toUpperCase(),
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      salvarEdicaoAluno(turmaAtiva.id, aluno);
                                    if (e.key === "Escape")
                                      cancelarEdicaoAluno();
                                  }}
                                  className="flex-1 px-2.5 py-1 bg-white border border-blue-500 rounded-md text-xs font-medium outline-none uppercase shadow-xs"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    salvarEdicaoAluno(turmaAtiva.id, aluno)
                                  }
                                  className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-xs"
                                  title="Salvar Nome"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelarEdicaoAluno}
                                  className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-gray-800 uppercase">
                                  {aluno}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => iniciarEdicaoAluno(aluno)}
                                    className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors border border-[#dbc8b6] bg-white shadow-xs"
                                    title="Editar nome do aluno"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      removerAluno(turmaAtiva.id, aluno)
                                    }
                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors border border-[#dbc8b6] bg-white shadow-xs"
                                    title="Remover aluno"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
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
