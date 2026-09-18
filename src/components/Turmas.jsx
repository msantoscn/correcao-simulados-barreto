import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  ClipboardList,
  BookOpen,
} from "lucide-react";

export default function Turmas({ turmas, setTurmas }) {
  const [nomeNovaTurma, setNomeNovaTurma] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);
  const [novoAlunoUnico, setNovoAlunoUnico] = useState("");
  const [textoListaAlunos, setTextoListaAlunos] = useState("");

  // Criar nova turma
  const adicionarTurma = (e) => {
    e.preventDefault();
    if (!nomeNovaTurma.trim()) return;

    const nova = {
      id: Date.now().toString(),
      nome: nomeNovaTurma.trim().toUpperCase(),
      alunos: [],
    };

    const listaAtualizada = [...turmas, nova];
    setTurmas(listaAtualizada);
    localStorage.setItem("turmas", JSON.stringify(listaAtualizada));
    setNomeNovaTurma("");
    setTurmaSelecionadaId(nova.id);
  };

  // Remover turma
  const removerTurma = (id) => {
    if (!confirm("Tem a certeza de que deseja eliminar esta turma?")) return;
    const listaAtualizada = turmas.filter((t) => t.id !== id);
    setTurmas(listaAtualizada);
    localStorage.setItem("turmas", JSON.stringify(listaAtualizada));
    if (turmaSelecionadaId === id) setTurmaSelecionadaId(null);
  };

  // Adicionar aluno único
  const adicionarAlunoUnico = (e) => {
    e.preventDefault();
    if (!novoAlunoUnico.trim() || !turmaSelecionadaId) return;

    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaSelecionadaId) {
        if (t.alunos.includes(novoAlunoUnico.trim())) {
          alert("Este aluno já se encontra na lista.");
          return t;
        }
        return { ...t, alunos: [...t.alunos, novoAlunoUnico.trim()].sort() };
      }
      return t;
    });

    setTurmas(listaAtualizada);
    localStorage.setItem("turmas", JSON.stringify(listaAtualizada));
    setNovoAlunoUnico("");
  };

  // Adicionar lista de alunos colada (1 por linha)
  const colarListaAlunos = (e) => {
    e.preventDefault();
    if (!textoListaAlunos.trim() || !turmaSelecionadaId) return;

    // Divide o texto por quebras de linha e remove linhas vazias
    const novosNomes = textoListaAlunos
      .split("\n")
      .map((nome) => nome.trim())
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

    setTurmas(listaAtualizada);
    localStorage.setItem("turmas", JSON.stringify(listaAtualizada));
    setTextoListaAlunos("");
    alert(`${novosNomes.length} aluno(s) adicionados com sucesso!`);
  };

  // Remover aluno individual
  const removerAluno = (turmaId, nomeAluno) => {
    const listaAtualizada = turmas.map((t) => {
      if (t.id === turmaId) {
        return { ...t, alunos: t.alunos.filter((a) => a !== nomeAluno) };
      }
      return t;
    });
    setTurmas(listaAtualizada);
    localStorage.setItem("turmas", JSON.stringify(listaAtualizada));
  };

  const turmaAtiva = turmas.find((t) => t.id === turmaSelecionadaId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Esquerda: Lista de Turmas */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="text-indigo-600" /> Gerir Turmas
        </h2>

        {/* Criar Turma */}
        <form onSubmit={adicionarTurma} className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nome da Nova Turma
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 9º Ano A"
              value={nomeNovaTurma}
              onChange={(e) => setNomeNovaTurma(e.target.value)}
              className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition text-sm"
            >
              <Plus className="w-4 h-4" /> Criar
            </button>
          </div>
        </form>

        {/* Lista das Turmas */}
        <h3 className="text-sm font-bold text-slate-600 mb-2">
          Turmas Registadas ({turmas.length})
        </h3>
        {turmas.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
            Nenhuma turma cadastrada.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                onClick={() => setTurmaSelecionadaId(turma.id)}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  turmaSelecionadaId === turma.id
                    ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {turma.nome}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {turma.alunos.length} aluno(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerTurma(turma.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
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
      <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        {!turmaAtiva ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <BookOpen className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-base font-medium">
              Selecione ou crie uma turma ao lado para gerir os seus alunos.
            </p>
          </div>
        ) : (
          <div>
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h3 className="text-2xl font-bold text-slate-800">
                Turma: {turmaAtiva.nome}
              </h3>
              <p className="text-xs text-slate-500">
                Total de {turmaAtiva.alunos.length} alunos inscritos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Adicionar 1 Aluno */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" /> Adicionar 1
                  Aluno
                </h4>
                <form onSubmit={adicionarAlunoUnico} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nome completo do aluno"
                    value={novoAlunoUnico}
                    onChange={(e) => setNovoAlunoUnico(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition"
                  >
                    Adicionar Aluno
                  </button>
                </form>
              </div>

              {/* Colar Lista Completa */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-indigo-600" /> Colar
                  Lista de Alunos
                </h4>
                <form onSubmit={colarListaAlunos} className="space-y-2">
                  <textarea
                    rows="3"
                    placeholder="Cole aqui a lista de nomes (um por linha)"
                    value={textoListaAlunos}
                    onChange={(e) => setTextoListaAlunos(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  ></textarea>
                  <button
                    type="submit"
                    className="w-full py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition"
                  >
                    Importar Lista
                  </button>
                </form>
              </div>
            </div>

            {/* Lista de Alunos Registados */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Lista de Alunos
              </h4>
              {turmaAtiva.alunos.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-lg">
                  Nenhum aluno registado nesta turma. Use as opções acima para
                  importar ou adicionar.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {turmaAtiva.alunos.map((aluno, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                    >
                      <span className="text-xs font-medium text-slate-800 truncate pr-2">
                        {idx + 1}. {aluno}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerAluno(turmaAtiva.id, aluno)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Remover Aluno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
