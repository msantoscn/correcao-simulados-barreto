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
} from "lucide-react";

export default function Turmas({ turmas, onSalvarTurmas, onDeletarTurma }) {
  const [nomeNovaTurma, setNomeNovaTurma] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);
  const [novoAlunoUnico, setNovoAlunoUnico] = useState("");
  const [textoListaAlunos, setTextoListaAlunos] = useState("");
  const [mostrarAddAlunos, setMostrarAddAlunos] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState("");

  // Função auxiliar para atualizar e persistir no Firebase
  const atualizarEPersistir = async (novaLista) => {
    try {
      await onSalvarTurmas(novaLista);
    } catch (error) {
      console.error("Erro ao sincronizar turmas com o Firebase:", error);
      alert("Erro ao guardar as alterações no Firebase.");
    }
  };

  // Criar nova turma
  const adicionarTurma = async (e) => {
    e.preventDefault();
    if (!nomeNovaTurma.trim()) return;

    const nomeFormatado = nomeNovaTurma.trim().toUpperCase();

    // Verificação simples para evitar nomes duplicados
    if (turmas.some((t) => t.nome === nomeFormatado)) {
      alert("Já existe uma turma com este nome.");
      return;
    }

    const nova = {
      id: Date.now().toString(),
      nome: nomeFormatado,
      alunos: [],
    };

    const listaAtualizada = [...turmas, nova];
    await atualizarEPersistir(listaAtualizada);
    setNomeNovaTurma("");
    setTurmaSelecionadaId(nova.id);
  };

  // Remover turma
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

  // Adicionar aluno único
  const adicionarAlunoUnico = async (e) => {
    e.preventDefault();
    if (!novoAlunoUnico.trim() || !turmaSelecionadaId) return;

    let alunoJaExiste = false;
    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaSelecionadaId) {
        if (t.alunos.includes(novoAlunoUnico.trim().toUpperCase())) {
          alunoJaExiste = true;
          return t;
        }
        return {
          ...t,
          alunos: [...t.alunos, novoAlunoUnico.trim().toUpperCase()].sort(),
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

  // Adicionar lista de alunos colada (1 por linha)
  const colarListaAlunos = async (e) => {
    e.preventDefault();
    if (!textoListaAlunos.trim() || !turmaSelecionadaId) return;

    const novosNomes = textoListaAlunos
      .split("\n")
      .map((nome) => nome.trim().toUpperCase())
      .filter((nome) => nome.length > 0);

    if (novosNomes.length === 0) return;

    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaSelecionadaId) {
        const conjuntoAlunos = new Set([...t.alunos, ...novosNomes]);
        const arrayOrdenado = Array.from(conjuntoAlunos).sort();
        return { ...t, alunos: arrayOrdenado };
      }
      return t;
    });

    await atualizarEPersistir(listaAtualizada);
    setTextoListaAlunos("");
    setMostrarAddAlunos(false);
    alert(`${novosNomes.length} aluno(s) adicionados com sucesso!`);
  };

  // Remover aluno individual
  const removerAluno = async (turmaId, nomeAluno) => {
    if (!confirm(`Remover ${nomeAluno} da turma?`)) return;
    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaId) {
        return { ...t, alunos: t.alunos.filter((a) => a !== nomeAluno) };
      }
      return t;
    });
    await atualizarEPersistir(listaAtualizada);
  };

  const turmaAtiva = turmas.find((t) => t.id === turmaSelecionadaId);
  const alunosFiltrados =
    turmaAtiva?.alunos?.filter((aluno) =>
      aluno.includes(buscaAluno.trim().toUpperCase()),
    ) || [];

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

        {/* Criar Turma */}
        <form onSubmit={adicionarTurma} className="mb-6">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Nome da Nova Turma
          </label>
          <div className="flex gap-2">
            {/* text-base previne o zoom no iOS ao focar no input */}
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

        {/* Lista das Turmas */}
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
                  setMostrarAddAlunos(false);
                  setBuscaAluno("");
                  // Pequeno scroll suave no telemóvel para a secção de alunos
                  if (window.innerWidth < 1024) {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`p-4 lg:p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                  turmaSelecionadaId === turma.id
                    ? "border-blue-400 bg-blue-50/40 shadow-sm"
                    : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <h4
                    className={`font-bold text-sm lg:text-sm uppercase mb-0.5 ${turmaSelecionadaId === turma.id ? "text-blue-700" : "text-slate-700"}`}
                  >
                    {turma.nome}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {turma.alunos?.length || 0} aluno(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerTurma(turma.id);
                  }}
                  /* Opacidade a 100 no telemóvel, dependente do hover apenas em desktop */
                  className={`p-2.5 lg:p-2 rounded-lg transition-all cursor-pointer ${
                    turmaSelecionadaId === turma.id
                      ? "text-red-500 hover:bg-red-100 hover:text-red-600"
                      : "text-slate-400 lg:opacity-0 lg:group-hover:opacity-100 opacity-100 hover:bg-red-50 hover:text-red-500"
                  }`}
                  title="Eliminar Turma"
                >
                  <Trash2 className="w-5 h-5 lg:w-4 lg:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          COLUNA DIREITA: ALUNOS DA TURMA
          ========================================================= */}
      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-fit lg:min-h-[500px]">
        {!turmaAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
              Selecione ou crie uma turma para gerir os seus alunos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cabeçalho da Turma */}
            <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Gerindo Turma
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                    {turmaAtiva.nome}
                  </h3>
                  <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md mt-2">
                    {turmaAtiva.alunos?.length || 0} ALUNOS INSCRITOS
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarAddAlunos(!mostrarAddAlunos)}
                  className={`w-full sm:w-auto px-4 py-3 lg:py-2.5 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] shadow-sm active:scale-95 cursor-pointer ${
                    mostrarAddAlunos
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-[#4b82f6] text-white hover:bg-blue-600 shadow-blue-500/20"
                  }`}
                >
                  {mostrarAddAlunos ? (
                    <>
                      <X className="w-4 h-4" /> Fechar Painel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Adicionar Alunos
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Painel expansível de adicionar/importar alunos */}
            {mostrarAddAlunos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-5 lg:p-6 bg-slate-50 border-b border-slate-200">
                {/* Adicionar 1 Aluno */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <UserPlus className="w-3.5 h-3.5" /> Adicionar Individual
                  </h4>
                  <form onSubmit={adicionarAlunoUnico} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome completo do aluno"
                      value={novoAlunoUnico}
                      onChange={(e) => setNovoAlunoUnico(e.target.value)}
                      className="w-full p-3 lg:p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-sm font-medium outline-none transition-all uppercase placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-3 lg:py-2.5 bg-white border-2 border-[#4b82f6] text-[#4b82f6] hover:bg-blue-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Gravar Aluno
                    </button>
                  </form>
                </div>

                {/* Colar Lista Completa */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <ClipboardList className="w-3.5 h-3.5" /> Importar Lista
                  </h4>
                  <form onSubmit={colarListaAlunos} className="space-y-3">
                    <textarea
                      rows="3"
                      placeholder="Cole a lista de nomes (um por linha)"
                      value={textoListaAlunos}
                      onChange={(e) => setTextoListaAlunos(e.target.value)}
                      className="w-full p-3 lg:p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-base sm:text-sm font-mono outline-none transition-all uppercase placeholder:text-slate-400 resize-none"
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full py-3 lg:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Importar Todos
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Lista de Alunos Registados */}
            <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 bg-slate-50/30">
              {!turmaAtiva.alunos || turmaAtiva.alunos.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                    Nenhum aluno registado nesta turma.
                    <br />
                    Clique no botão acima para adicionar.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Barra de Pesquisa */}
                  <div className="bg-slate-50 border-b border-slate-200 p-3 lg:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={buscaAluno}
                        onChange={(e) => setBuscaAluno(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 lg:py-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all uppercase placeholder:text-slate-400 placeholder:normal-case"
                      />
                    </div>
                  </div>

                  {/* Cabeçalho das Colunas */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <div className="col-span-2 sm:col-span-1 text-center">
                      Nº
                    </div>
                    <div className="col-span-8 sm:col-span-9">
                      Nome do Aluno
                    </div>
                    <div className="col-span-2 text-right">Ações</div>
                  </div>

                  {/* Lista sem scroll */}
                  <div className="divide-y divide-slate-100 flex-1">
                    {alunosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Nenhum aluno encontrado na busca.
                      </div>
                    ) : (
                      alunosFiltrados.map((aluno, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-3 px-4 py-3 sm:py-3 items-center hover:bg-blue-50/30 transition-colors group"
                        >
                          <div className="col-span-2 sm:col-span-1 text-xs font-bold text-slate-400 text-center">
                            {String(
                              turmaAtiva.alunos.indexOf(aluno) + 1,
                            ).padStart(2, "0")}
                          </div>
                          <div className="col-span-8 sm:col-span-9 text-xs font-bold text-slate-700 uppercase truncate">
                            {aluno}
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removerAluno(turmaAtiva.id, aluno)}
                              /* Opacidade a 100 no telemóvel, dependente do hover apenas em desktop */
                              className="p-2 lg:p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                              title="Remover Aluno"
                            >
                              <Trash2 className="w-5 h-5 lg:w-4 lg:h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
