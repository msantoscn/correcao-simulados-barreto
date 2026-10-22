import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Save, Filter, BarChart2, Eye } from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const todasDisciplinas = [
  "Língua Portuguesa",
  "História",
  "Geografia",
  "Arte",
  "Língua Inglesa",
  "Matemática",
  "Ciências",
  "Ensino Religioso",
  "Educação Musical",
  "Educação Física",
];

export default function RiscoReprovacao({ turmas = [], usuarioLogado }) {
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [disciplinaManual, setDisciplinaManual] = useState("");
  const [alunosRisco, setAlunosRisco] = useState({});
  const [todosDadosRiscoTurma, setTodosDadosRiscoTurma] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const cargoUsuario = String(
    usuarioLogado?.cargo || usuarioLogado?.tipo || usuarioLogado?.perfil || "",
  )
    .trim()
    .toUpperCase();
  const isGestao =
    !usuarioLogado ||
    cargoUsuario.includes("ADMIN") ||
    cargoUsuario.includes("COORD") ||
    cargoUsuario.includes("DIRETOR") ||
    cargoUsuario.includes("GESTAO") ||
    cargoUsuario.includes("SECRET");

  const [modoRelatorioCruzado, setModoRelatorioCruzado] = useState(isGestao);

  const turmasDisponiveisParaUsuario = useMemo(() => {
    return isGestao
      ? turmas
      : turmas.filter((t) => {
          const profsVinculados = t.professoresVinculados || [];
          return profsVinculados.some(
            (p) =>
              String(p.professorId) ===
                String(
                  usuarioLogado.id || usuarioLogado.codigo || usuarioLogado.uid,
                ) ||
              String(p.codigoProfessor).trim().toUpperCase() ===
                String(usuarioLogado.codigo).trim().toUpperCase(),
          );
        });
  }, [isGestao, turmas, usuarioLogado]);

  const turmaAtiva = useMemo(() => {
    return turmas.find((t) => String(t.id) === String(turmaSelecionadaId));
  }, [turmas, turmaSelecionadaId]);

  const listaAlunos = useMemo(() => {
    if (!turmaAtiva || !Array.isArray(turmaAtiva.alunos)) return [];
    return turmaAtiva.alunos
      .map((a) => (typeof a === "string" ? a : a.nome))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [turmaAtiva]);

  const disciplinasDaTurmaSelecionada = useMemo(() => {
    if (!turmaAtiva) return [];
    if (isGestao) return todasDisciplinas;

    const profsVinculados = turmaAtiva.professoresVinculados || [];
    const minhasDiscs = [];

    profsVinculados.forEach((p) => {
      if (
        String(p.professorId) ===
          String(
            usuarioLogado.id || usuarioLogado.codigo || usuarioLogado.uid,
          ) ||
        String(p.codigoProfessor).trim().toUpperCase() ===
          String(usuarioLogado.codigo).trim().toUpperCase()
      ) {
        if (p.disciplina && !minhasDiscs.includes(p.disciplina)) {
          minhasDiscs.push(p.disciplina);
        }
      }
    });

    return minhasDiscs;
  }, [turmaAtiva, isGestao, usuarioLogado]);

  const disciplinaSelecionada = useMemo(() => {
    if (!turmaSelecionadaId) return "";
    if (!isGestao && disciplinasDaTurmaSelecionada.length === 1) {
      return disciplinasDaTurmaSelecionada[0];
    }
    return disciplinaManual;
  }, [
    turmaSelecionadaId,
    isGestao,
    disciplinasDaTurmaSelecionada,
    disciplinaManual,
  ]);

  // Carrega os dados de risco salvos para a turma e disciplina selecionada
  useEffect(() => {
    async function carregarDadosRisco() {
      if (
        !turmaSelecionadaId ||
        !disciplinaSelecionada ||
        listaAlunos.length === 0
      ) {
        setAlunosRisco({});
        return;
      }

      try {
        const q = query(
          collection(db, "alunosRisco"),
          where("turmaId", "==", String(turmaSelecionadaId)),
        );

        const querySnapshot = await getDocs(q);
        const mapRisco = {};

        listaAlunos.forEach((nome) => {
          mapRisco[nome] = false;
        });

        const discSelecionadaUpper = String(disciplinaSelecionada)
          .trim()
          .toUpperCase();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const discDocUpper = String(data.disciplina || "")
            .trim()
            .toUpperCase();

          if (discDocUpper === discSelecionadaUpper && data.alunos) {
            Object.keys(data.alunos).forEach((nome) => {
              if (data.alunos[nome] === true) {
                mapRisco[nome] = true;
              }
            });
          }
        });

        setAlunosRisco(mapRisco);
      } catch (error) {
        console.error("Erro ao carregar alunos em risco:", error);
      }
    }

    carregarDadosRisco();
  }, [turmaSelecionadaId, disciplinaSelecionada, listaAlunos]);

  // Carrega todos os registros de risco da turma para a Visão Geral
  useEffect(() => {
    async function carregarCruzamentoTurma() {
      if (!turmaSelecionadaId) {
        setTodosDadosRiscoTurma([]);
        return;
      }

      try {
        const q = query(
          collection(db, "alunosRisco"),
          where("turmaId", "==", String(turmaSelecionadaId)),
        );

        const querySnapshot = await getDocs(q);
        const registros = [];
        querySnapshot.forEach((docSnap) => {
          registros.push(docSnap.data());
        });
        setTodosDadosRiscoTurma(registros);
      } catch (error) {
        console.error("Erro ao carregar cruzamento da turma:", error);
      }
    }

    carregarCruzamentoTurma();
  }, [turmaSelecionadaId, salvando]);

  const handleToggleAluno = (nomeAluno) => {
    if (isGestao) return;
    setAlunosRisco((prev) => ({
      ...prev,
      [nomeAluno]: !prev[nomeAluno],
    }));
  };

  const handleSalvar = async () => {
    if (isGestao) return;

    if (!turmaAtiva || !disciplinaSelecionada) {
      alert("Selecione a turma e a disciplina antes de salvar.");
      return;
    }

    setSalvando(true);

    try {
      const discSanitizada = String(disciplinaSelecionada).replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const docId = `${turmaSelecionadaId}_${discSanitizada}`;

      const alunosSanitizados = {};
      listaAlunos.forEach((nome) => {
        alunosSanitizados[nome] = !!alunosRisco[nome];
      });

      const dadosParaSalvar = {
        turmaId: String(turmaSelecionadaId),
        turmaNome: String(turmaAtiva.nome || ""),
        disciplina: String(disciplinaSelecionada),
        professor: String(
          usuarioLogado?.nome || usuarioLogado?.codigo || "Professor",
        ),
        alunos: alunosSanitizados,
        atualizadoEm: new Date().toISOString(),
      };

      await setDoc(doc(db, "alunosRisco", docId), dadosParaSalvar);

      // Reseta os campos para ocultar a lista e retornar à seleção de turma
      setTurmaSelecionadaId("");
      setDisciplinaManual("");
      setAlunosRisco({});
    } catch (error) {
      console.error("Erro detalhado ao salvar no Firebase:", error);
      alert("Erro ao salvar no servidor: " + (error.message || error));
    } finally {
      setSalvando(false);
    }
  };

  const totalAlunosTurma = listaAlunos.length;
  const totalRiscoCount = Object.values(alunosRisco).filter(Boolean).length;
  const percentualRisco =
    totalAlunosTurma > 0
      ? ((totalRiscoCount / totalAlunosTurma) * 100).toFixed(1)
      : "0.0";

  const relatorioCruzadoAlunos = useMemo(() => {
    return listaAlunos.map((nomeAluno) => {
      const disciplinasEmRisco = [];
      todosDadosRiscoTurma.forEach((reg) => {
        if (reg.alunos && reg.alunos[nomeAluno] === true) {
          disciplinasEmRisco.push(reg.disciplina);
        }
      });
      return {
        nome: nomeAluno,
        totalRisco: disciplinasEmRisco.length,
        disciplinas: disciplinasEmRisco,
      };
    });
  }, [listaAlunos, todosDadosRiscoTurma]);

  const totalAlunosComRiscoGeral = relatorioCruzadoAlunos.filter(
    (a) => a.totalRisco > 0,
  ).length;
  const percentualRiscoGeralTurma =
    totalAlunosTurma > 0
      ? ((totalAlunosComRiscoGeral / totalAlunosTurma) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="bg-white rounded-md shadow-sm p-3 sm:p-5 border border-[#dbc8b6] w-full max-w-7xl mx-auto font-sans antialiased space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#dbc8b6] gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-amber-500 text-white rounded-md flex-shrink-0">
            {isGestao ? (
              <Eye className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-gray-800 truncate">
            {isGestao ? "RELATÓRIO DE " : "PREVISÃO DE "}
            <span className="text-red-500 font-bold">REPROVAÇÃO</span>
          </h2>
        </div>

        {isGestao && turmaSelecionadaId && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setModoRelatorioCruzado(true)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                modoRelatorioCruzado
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Visão Geral
            </button>
            <button
              onClick={() => setModoRelatorioCruzado(false)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${
                !modoRelatorioCruzado
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Filtrar por Disciplina
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
        <div
          className={
            isGestao && modoRelatorioCruzado
              ? "sm:col-span-2"
              : disciplinasDaTurmaSelecionada.length <= 1 && !isGestao
                ? "sm:col-span-2"
                : ""
          }
        >
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-500" /> Turma:
          </label>
          <select
            value={turmaSelecionadaId}
            onChange={(e) => {
              setTurmaSelecionadaId(e.target.value);
              setDisciplinaManual("");
            }}
            className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
          >
            <option value="">Selecione a turma...</option>
            {turmasDisponiveisParaUsuario.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>

        {((isGestao && !modoRelatorioCruzado) ||
          (!isGestao && disciplinasDaTurmaSelecionada.length > 1)) && (
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" /> Disciplina:
            </label>
            <select
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaManual(e.target.value)}
              className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
            >
              <option value="">Selecione a disciplina...</option>
              {(isGestao
                ? todasDisciplinas
                : disciplinasDaTurmaSelecionada
              ).map((disc, idx) => (
                <option key={idx} value={disc}>
                  {disc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!turmaSelecionadaId ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
          Selecione uma Turma acima para começar.
        </div>
      ) : isGestao && modoRelatorioCruzado ? (
        <div className="border border-[#dbc8b6] rounded-md bg-white overflow-hidden space-y-3">
          <div className="bg-purple-50 p-3 border-b border-[#dbc8b6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-xs font-bold text-purple-900 uppercase">
              Previsão de Reprovação — Turma: {turmaAtiva?.nome}
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200 uppercase">
              Alunos em risco: {totalAlunosComRiscoGeral} / {totalAlunosTurma} (
              {percentualRiscoGeralTurma}%)
            </span>
          </div>

          <div className="overflow-x-auto p-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-[#dbc8b6] text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">Aluno</th>
                  <th className="p-2.5 text-center">Disciplinas em Risco</th>
                  <th className="p-2.5">Disciplinas Apontadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbc8b6] text-xs">
                {relatorioCruzadoAlunos.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 ${item.totalRisco > 0 ? "bg-red-50/30" : ""}`}
                  >
                    <td className="p-2.5 text-center font-bold text-gray-400">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="p-2.5 font-bold uppercase text-gray-800">
                      {item.nome}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          item.totalRisco === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : item.totalRisco <= 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800 font-black"
                        }`}
                      >
                        {item.totalRisco}{" "}
                        {item.totalRisco === 1 ? "disciplina" : "disciplinas"}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {item.disciplinas.length === 0 ? (
                        <span className="text-gray-400 italic">
                          Nenhum risco apontado
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.disciplinas.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-200"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!disciplinaSelecionada ? (
            <div className="text-center py-10 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
              Selecione uma Disciplina para visualizar/editar os lançamentos.
            </div>
          ) : listaAlunos.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
              Esta turma não possui alunos cadastrados.
            </div>
          ) : (
            <div className="border border-[#dbc8b6] rounded-md bg-white overflow-hidden">
              <div className="bg-amber-50 p-3 border-b border-[#dbc8b6] flex justify-between items-center">
                <span className="text-xs font-bold text-amber-900 uppercase">
                  Turma: {turmaAtiva?.nome} | Disciplina:{" "}
                  {disciplinaSelecionada}
                </span>
                <span className="text-[11px] font-bold text-red-600 uppercase">
                  Total em risco: {totalRiscoCount} / {totalAlunosTurma} (
                  {percentualRisco}%)
                </span>
              </div>

              <div className="divide-y divide-[#dbc8b6]">
                {listaAlunos.map((nomeAluno, index) => {
                  const emRisco = !!alunosRisco[nomeAluno];
                  return (
                    <div
                      key={index}
                      onClick={() => handleToggleAluno(nomeAluno)}
                      className={`flex items-center justify-between p-3 transition-colors ${
                        isGestao ? "cursor-default" : "cursor-pointer"
                      } ${
                        emRisco
                          ? "bg-red-50/70 hover:bg-red-100/70"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-6 text-right">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase ${emRisco ? "text-red-700" : "text-gray-800"}`}
                        >
                          {nomeAluno}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={emRisco}
                          disabled={isGestao}
                          onChange={() => handleToggleAluno(nomeAluno)}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-5 h-5 text-red-600 rounded focus:ring-red-500 ${
                            isGestao
                              ? "opacity-75 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isGestao && (
                <div className="p-3 bg-gray-50 border-t border-[#dbc8b6] flex justify-end">
                  <button
                    onClick={handleSalvar}
                    disabled={salvando}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold uppercase transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />{" "}
                    {salvando ? "A salvar..." : "Salvar Previsão"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
