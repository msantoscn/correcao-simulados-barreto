import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  ClipboardList,
  BookOpen,
  X,
} from "lucide-react";

export default function Turmas({ turmas, onSalvarTurmas, onDeletarTurma }) {
  const [nomeNovaTurma, setNomeNovaTurma] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);
  const [novoAlunoUnico, setNovoAlunoUnico] = useState("");
  const [textoListaAlunos, setTextoListaAlunos] = useState("");
  const [mostrarAddAlunos, setMostrarAddAlunos] = useState(false);

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

    const nova = {
      id: Date.now().toString(),
      nome: nomeNovaTurma.trim().toUpperCase(),
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
    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaId) {
        return { ...t, alunos: t.alunos.filter((a) => a !== nomeAluno) };
      }
      return t;
    });
    await atualizarEPersistir(listaAtualizada);
  };

  const turmaAtiva = turmas.find((t) => t.id === turmaSelecionadaId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Esquerda: Lista de Turmas */}
      <div className="bg-white rounded-sm shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2 pb-2 border-b border-gray-100">
          <Users className="text-gray-700 w-6 h-6" /> GERIR{" "}
          <span className="text-red-600">TURMAS</span>
        </h2>

        {/* Criar Turma */}
        <form onSubmit={adicionarTurma} className="mb-6 mt-4">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            NOME DA NOVA TURMA
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 9º ANO A"
              value={nomeNovaTurma}
              onChange={(e) => setNomeNovaTurma(e.target.value.toUpperCase())}
              className="flex-1 p-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 text-sm outline-none bg-white uppercase"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase rounded-sm flex items-center gap-1 transition text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> CRIAR
            </button>
          </div>
        </form>

        {/* Lista das Turmas */}
        <h3 className="text-xs font-bold text-gray-600 uppercase mb-2">
          TURMAS REGISTADAS ({turmas.length})
        </h3>
        {turmas.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4 bg-[#f8f9fa] rounded-sm border border-gray-200">
            Nenhuma turma cadastrada.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                onClick={() => {
                  setTurmaSelecionadaId(turma.id);
                  setMostrarAddAlunos(false);
                }}
                className={`p-3 rounded-sm border cursor-pointer transition flex items-center justify-between shadow-sm ${
                  turmaSelecionadaId === turma.id
                    ? "border-blue-400 ring-1 ring-blue-200 bg-blue-50/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div>
                  <h4 className="font-bold text-gray-800 text-sm uppercase">
                    {turma.nome}
                  </h4>
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    {turma.alunos?.length || 0} aluno(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerTurma(turma.id);
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 transition cursor-pointer"
                  title="Eliminar Turma"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coluna Direita: Alunos da Turma Selecionada */}
      <div className="lg:col-span-2 bg-white rounded-sm shadow-sm p-6 border border-gray-200">
        {!turmaAtiva ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <BookOpen className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm font-bold uppercase">
              Selecione ou crie uma turma ao lado para gerir os seus alunos.
            </p>
          </div>
        ) : (
          <div>
            {/* Cabeçalho da Turma */}
            <div className="border-b border-gray-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 uppercase">
                  TURMA: <span className="text-red-600">{turmaAtiva.nome}</span>
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                  TOTAL DE {turmaAtiva.alunos?.length || 0} ALUNOS INSCRITOS
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarAddAlunos(!mostrarAddAlunos)}
                className="px-4 py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase rounded-sm flex items-center justify-center gap-1.5 transition text-xs shadow-sm self-start sm:self-auto cursor-pointer"
              >
                {mostrarAddAlunos ? (
                  <>
                    <X className="w-4 h-4" /> FECHAR
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> ADICIONAR ALUNOS
                  </>
                )}
              </button>
            </div>

            {/* Painel expansível de adicionar/importar alunos */}
            {mostrarAddAlunos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-[#f8f9fa] border border-gray-200 rounded-sm">
                {/* Adicionar 1 Aluno */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-gray-700" /> ADICIONAR 1
                    ALUNO
                  </h4>
                  <form onSubmit={adicionarAlunoUnico} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome completo do aluno"
                      value={novoAlunoUnico}
                      onChange={(e) => setNovoAlunoUnico(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-sm text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#4b82f6] hover:bg-blue-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm transition cursor-pointer"
                    >
                      ADICIONAR ALUNO
                    </button>
                  </form>
                </div>

                {/* Colar Lista Completa */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-gray-700" /> COLAR
                    LISTA DE ALUNOS
                  </h4>
                  <form onSubmit={colarListaAlunos} className="space-y-2">
                    <textarea
                      rows="3"
                      placeholder="Cole aqui a lista de nomes (um por linha)"
                      value={textoListaAlunos}
                      onChange={(e) => setTextoListaAlunos(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-sm text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none font-mono uppercase"
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#84cc16] hover:bg-lime-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm transition cursor-pointer"
                    >
                      IMPORTAR LISTA
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Lista de Alunos Registados */}
            <div>
              {!turmaAtiva.alunos || turmaAtiva.alunos.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6 bg-[#f8f9fa] rounded-sm border border-gray-200">
                  Nenhum aluno registado nesta turma. Clique no botão acima para
                  adicionar.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-sm overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#f8f9fa] text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                    <div className="col-span-2 sm:col-span-1">Nº</div>
                    <div className="col-span-8 sm:col-span-10">
                      NOME DO ALUNO
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-right">
                      AÇÕES
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200 bg-white max-h-[400px] overflow-y-auto">
                    {turmaAtiva.alunos.map((aluno, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition"
                      >
                        <div className="col-span-2 sm:col-span-1 text-xs font-bold text-gray-500">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <div className="col-span-8 sm:col-span-10 text-xs font-bold text-gray-800 uppercase truncate">
                          {aluno}
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removerAluno(turmaAtiva.id, aluno)}
                            className="p-1 text-red-500 hover:text-red-700 transition cursor-pointer"
                            title="Remover Aluno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
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
