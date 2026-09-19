import { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle,
  ArrowLeft,
  User,
  Award,
  AlertCircle,
  Edit3,
  PlusCircle,
} from "lucide-react";
// Importações do Firestore (ajuste o caminho do arquivo conforme a estrutura do seu projeto)
import { db } from "../services/firebaseConnection";
import { collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";

export default function Professor({
  simulados = [],
  turmas = [],
  respostasAlunos = [],
  setRespostasAlunos,
}) {
  // Passos: 1 = Seleção, 2 = Lista de Alunos / Formulário
  const [passo, setPasso] = useState(1);

  // Seleções principais
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [professorAplicador, setProfessorAplicador] = useState("");

  // Aluno e Gabarito
  const [alunoAtivo, setAlunoAtivo] = useState(null);
  const [respostasProfessor, setRespostasProfessor] = useState({});

  const simuladoAtivo = simulados.find((s) => s.id === simuladoSelecionadoId);
  const turmaAtiva = turmas.find((t) => t.id === turmaSelecionadaId);

  // Cálculo do total de questões de todas as disciplinas do simulado
  const totalQuestoesSimulado =
    simuladoAtivo?.disciplinas?.reduce(
      (acc, d) => acc + (d.qtdQuestoes || d.gabarito?.length || 0),
      0,
    ) || 0;

  // Função auxiliar para verificar se o registo do aluno está desatualizado
  const verificarSeRegistoEstaDesatualizado = (registo) => {
    if (!registo || !simuladoAtivo) return true;

    const disciplinasRegistradas = Object.keys(registo.detalhes || {});
    const disciplinasAtuais = simuladoAtivo.disciplinas.map((d) => d.nome);

    if (disciplinasRegistradas.length !== disciplinasAtuais.length) return true;

    for (const d of simuladoAtivo.disciplinas) {
      const detalheAluno = registo.detalhes[d.nome];
      if (
        !detalheAluno ||
        detalheAluno.total !== (d.qtdQuestoes || d.gabarito.length)
      ) {
        return true;
      }
    }

    return false;
  };

  // Avançar para a turma
  const handleEntrarNaTurma = (e) => {
    e.preventDefault();
    if (
      !simuladoSelecionadoId ||
      !turmaSelecionadaId ||
      !professorAplicador.trim()
    ) {
      return alert(
        "Preencha o Simulado, a Turma e o Nome do Professor Aplicador.",
      );
    }
    setPasso(2);
  };

  // Voltar para a seleção
  const handleVoltarSelecao = () => {
    setPasso(1);
    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  // Selecionar aluno para digitação
  const handleSelecionarAluno = (nomeAluno) => {
    setAlunoAtivo(nomeAluno);

    const respostaExistente = respostasAlunos.find(
      (r) =>
        r.simuladoId === simuladoSelecionadoId &&
        r.turma === turmaAtiva?.nome &&
        r.nomeAluno === nomeAluno,
    );

    if (
      respostaExistente &&
      respostaExistente.gabaritoBruto &&
      !verificarSeRegistoEstaDesatualizado(respostaExistente)
    ) {
      setRespostasProfessor(respostaExistente.gabaritoBruto);
    } else {
      setRespostasProfessor({});
    }
  };

  // Foco automático no primeiro campo quando seleciona aluno
  useEffect(() => {
    if (alunoAtivo && simuladoAtivo?.disciplinas?.[0]) {
      const primeiraDisc = simuladoAtivo.disciplinas[0].nome;
      setTimeout(() => {
        const primeiroInput = document.getElementById(
          `prof-q-${primeiraDisc}-0`,
        );
        if (primeiroInput) primeiroInput.focus();
      }, 100);
    }
  }, [alunoAtivo, simuladoAtivo]);

  // Tratar entradas do gabarito, navegação por teclas
  const handleRespostaProfessor = (disciplinaNome, index, valor, e) => {
    const val = valor.toUpperCase();

    if (e?.nativeEvent?.inputType === "deleteContentBackward" && !val) {
      if (index > 0) {
        const campoAnterior = document.getElementById(
          `prof-q-${disciplinaNome}-${index - 1}`,
        );
        if (campoAnterior) campoAnterior.focus();
      }
      return;
    }

    setRespostasProfessor((prev) => ({
      ...prev,
      [disciplinaNome]: {
        ...prev[disciplinaNome],
        [index]: val,
      },
    }));

    if (["A", "B", "C", "D", "E"].includes(val)) {
      const proximoCampo = document.getElementById(
        `prof-q-${disciplinaNome}-${index + 1}`,
      );
      if (proximoCampo) {
        proximoCampo.focus();
      } else {
        const discIndex = simuladoAtivo.disciplinas.findIndex(
          (d) => d.nome === disciplinaNome,
        );
        if (
          discIndex !== -1 &&
          discIndex + 1 < simuladoAtivo.disciplinas.length
        ) {
          const proximaDisc = simuladoAtivo.disciplinas[discIndex + 1].nome;
          const primeiroCampoProximaDisc = document.getElementById(
            `prof-q-${proximaDisc}-0`,
          );
          if (primeiroCampoProximaDisc) primeiroCampoProximaDisc.focus();
        }
      }
    }
  };

  // Salvar respostas do aluno no Firestore
  const submeterRespostasAluno = async (e) => {
    e.preventDefault();

    if (!alunoAtivo || !simuladoAtivo || !turmaAtiva) return;

    let totalAcertosGeral = 0;
    let totalQuestoesGeral = 0;
    const resultadoPorDisciplina = {};

    simuladoAtivo.disciplinas.forEach((d) => {
      let acertosDisc = 0;
      const respAlunoDisc = respostasProfessor[d.nome] || {};

      d.gabarito.forEach((correta, idx) => {
        totalQuestoesGeral++;
        if (respAlunoDisc[idx] && respAlunoDisc[idx] === correta) {
          acertosDisc++;
          totalAcertosGeral++;
        }
      });

      const qtdQ = d.qtdQuestoes || d.gabarito.length;
      const percentualDisc =
        qtdQ > 0 ? Math.round((acertosDisc / qtdQ) * 100) : 0;
      const notaDisc =
        qtdQ > 0 ? ((acertosDisc / qtdQ) * 10).toFixed(1) : "0.0";

      resultadoPorDisciplina[d.nome] = {
        acertos: acertosDisc,
        total: qtdQ,
        percentagem: percentualDisc,
        nota: notaDisc,
      };
    });

    const percentualGeral =
      totalQuestoesGeral > 0
        ? Math.round((totalAcertosGeral / totalQuestoesGeral) * 100)
        : 0;

    const notaGeral =
      totalQuestoesGeral > 0
        ? ((totalAcertosGeral / totalQuestoesGeral) * 10).toFixed(1)
        : "0.0";

    // Verifica se já existe um registo prévio para este aluno neste simulado/turma
    const registoExistente = respostasAlunos.find(
      (r) =>
        r.simuladoId === simuladoAtivo.id &&
        r.turma === turmaAtiva.nome &&
        r.nomeAluno === alunoAtivo,
    );

    try {
      let dadosRegisto;

      if (registoExistente && registoExistente.id) {
        // Atualiza o documento existente no Firestore
        dadosRegisto = {
          ...registoExistente,
          professorAplicador: professorAplicador.trim(),
          totalAcertos: totalAcertosGeral,
          totalQuestoes: totalQuestoesGeral,
          percentualGeral,
          notaFinal: notaGeral,
          detalhes: resultadoPorDisciplina,
          gabaritoBruto: respostasProfessor,
          dataRegisto: new Date().toLocaleDateString("pt-PT"),
        };
        const docRef = doc(db, "respostas_alunos", registoExistente.id);
        await setDoc(docRef, dadosRegisto);
      } else {
        // Cria um novo documento no Firestore
        dadosRegisto = {
          simuladoId: simuladoAtivo.id,
          simuladoNome: simuladoAtivo.nome,
          turma: turmaAtiva.nome,
          nomeAluno: alunoAtivo,
          professorAplicador: professorAplicador.trim(),
          totalAcertos: totalAcertosGeral,
          totalQuestoes: totalQuestoesGeral,
          percentualGeral,
          notaFinal: notaGeral,
          detalhes: resultadoPorDisciplina,
          gabaritoBruto: respostasProfessor,
          dataRegisto: new Date().toLocaleDateString("pt-PT"),
        };
        const docRef = await addDoc(
          collection(db, "respostas_alunos"),
          dadosRegisto,
        );
        dadosRegisto.id = docRef.id;
      }

      // Atualiza o estado local com a lista modificada
      const filtrados = respostasAlunos.filter(
        (r) =>
          !(
            r.simuladoId === simuladoAtivo.id &&
            r.turma === turmaAtiva.nome &&
            r.nomeAluno === alunoAtivo
          ),
      );

      const listaAtualizada = [...filtrados, dadosRegisto];
      setRespostasAlunos(listaAtualizada);

      alert(
        `Respostas guardadas com sucesso no Firebase! ${alunoAtivo}: ${percentualGeral}% de acertos`,
      );

      setAlunoAtivo(null);
      setRespostasProfessor({});
    } catch (error) {
      console.error("Erro ao guardar respostas no Firebase:", error);
      alert("Erro ao guardar respostas. Verifique a consola.");
    }
  };

  return (
    <div className="bg-white rounded-sm shadow-sm p-6 border border-gray-200">
      {/* Cabeçalho do Painel */}
      <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2 pb-2 border-b border-gray-100 mb-6">
        <UserCheck className="text-gray-700 w-6 h-6" /> APLICAÇÃO E CORREÇÃO DE{" "}
        <span className="text-red-600">SIMULADOS</span>
      </h2>

      {/* ---------------- PASSO 1: Seleção ---------------- */}
      {passo === 1 && (
        <form onSubmit={handleEntrarNaTurma} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                SIMULADO
              </label>
              <select
                value={simuladoSelecionadoId}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 text-sm outline-none bg-white uppercase"
                required
              >
                <option value="">-- SELECIONE O SIMULADO --</option>
                {simulados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                TURMA
              </label>
              <select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 text-sm outline-none bg-white uppercase"
                required
              >
                <option value="">-- SELECIONE A TURMA --</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                PROFESSOR APLICADOR
              </label>
              <input
                type="text"
                placeholder="EX: PROF. CARLOS SANTOS"
                value={professorAplicador}
                onChange={(e) =>
                  setProfessorAplicador(e.target.value.toUpperCase())
                }
                className="w-full p-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-blue-500 text-sm outline-none bg-white uppercase"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase rounded-sm flex items-center justify-center gap-1.5 transition text-xs shadow-sm cursor-pointer"
          >
            ACESSAR LISTA DA TURMA
          </button>
        </form>
      )}

      {/* ---------------- PASSO 2: Painel da Turma ---------------- */}
      {passo === 2 && (
        <div className="space-y-6">
          {/* Cabeçalho da Turma */}
          <div className="border-b border-gray-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 uppercase">
                TURMA: <span className="text-red-600">{turmaAtiva?.nome}</span>
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                SIMULADO:{" "}
                <strong className="text-gray-800">{simuladoAtivo?.nome}</strong>{" "}
                | APLICADOR:{" "}
                <strong className="text-gray-800">{professorAplicador}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleVoltarSelecao}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold uppercase rounded-sm flex items-center gap-1.5 transition text-xs shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> TROCAR TURMA / SIMULADO
            </button>
          </div>

          {!alunoAtivo ? (
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-700" /> RESUMO DE DESEMPENHO
                DA TURMA
              </h3>

              {!turmaAtiva?.alunos || turmaAtiva.alunos.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6 bg-[#f8f9fa] rounded-sm border border-gray-200 uppercase">
                  Nenhum aluno cadastrado nesta turma.
                </p>
              ) : (
                <div className="w-full border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse bg-white text-[11px] table-fixed">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 font-bold text-gray-700 uppercase">
                        <th className="p-2 border-r border-gray-200 w-[22%] align-middle">
                          ALUNO
                        </th>

                        {simuladoAtivo?.disciplinas.map((disc) => (
                          <th
                            key={disc.nome}
                            className="p-1.5 border-r border-gray-200 text-center whitespace-normal break-words align-middle"
                          >
                            <span className="block text-gray-800 font-bold leading-tight break-words">
                              {disc.nome}
                            </span>
                            <span className="text-[9px] text-gray-400 font-normal block mt-0.5">
                              ({disc.qtdQuestoes} Q)
                            </span>
                          </th>
                        ))}

                        <th className="p-1.5 border-r border-gray-200 text-center bg-blue-50/50 whitespace-normal break-words align-middle">
                          <span className="block text-gray-800 font-bold leading-tight break-words">
                            GERAL (TOTAL)
                          </span>
                          <span className="text-[9px] text-gray-400 font-normal block mt-0.5">
                            ({totalQuestoesSimulado} Q)
                          </span>
                        </th>

                        <th className="p-2 text-center w-[85px] align-middle">
                          AÇÃO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {turmaAtiva.alunos.map((aluno, idx) => {
                        const registo = respostasAlunos.find(
                          (r) =>
                            r.simuladoId === simuladoAtivo.id &&
                            r.turma === turmaAtiva.nome &&
                            r.nomeAluno === aluno,
                        );

                        const desatualizado =
                          verificarSeRegistoEstaDesatualizado(registo);
                        const temRespostas = registo !== undefined;
                        const concluido = temRespostas && !desatualizado;

                        return (
                          <tr
                            key={idx}
                            className="odd:bg-white even:bg-gray-50/80 hover:bg-blue-50/30 transition"
                          >
                            <td className="p-2 font-bold text-gray-800 border-r border-gray-200 uppercase whitespace-normal break-words align-middle">
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="break-words">{aluno}</span>
                              </div>
                            </td>

                            {simuladoAtivo?.disciplinas.map((disc) => {
                              const infoDisc = registo?.detalhes?.[disc.nome];

                              return (
                                <td
                                  key={disc.nome}
                                  className="p-1.5 border-r border-gray-200 text-center uppercase align-middle"
                                >
                                  {concluido && infoDisc ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <span className="font-bold text-gray-800 text-[10px]">
                                        {infoDisc.acertos}/{infoDisc.total}{" "}
                                        <span className="text-blue-600 font-semibold">
                                          ({infoDisc.percentagem}%)
                                        </span>
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-sm border border-emerald-200">
                                        NOTA: {infoDisc.nota}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 font-bold">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="p-1.5 border-r border-gray-200 text-center bg-blue-50/20 uppercase align-middle">
                              {concluido ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="font-bold text-gray-800 text-[10px]">
                                    {registo.totalAcertos}/
                                    {registo.totalQuestoes}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-600">
                                    ({registo.percentualGeral}%)
                                  </span>
                                </div>
                              ) : temRespostas && desatualizado ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1 py-0.5 rounded-sm">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600" />{" "}
                                  EDITADO
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400">
                                  PENDENTE
                                </span>
                              )}
                            </td>

                            <td className="p-1.5 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => handleSelecionarAluno(aluno)}
                                className={`px-1.5 py-1 rounded-sm text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 w-full cursor-pointer ${
                                  concluido
                                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                    : "bg-[#4b82f6] hover:bg-blue-600 text-white shadow-sm"
                                }`}
                              >
                                {concluido ? (
                                  <>
                                    <Edit3 className="w-3 h-3 flex-shrink-0" />
                                    <span>EDITAR</span>
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>LANÇAR</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={submeterRespostasAluno}
              className="space-y-4 p-4 bg-[#f8f9fa] border border-gray-200 rounded-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-700" /> LANÇANDO GABARITO:{" "}
                  <span className="text-red-600">{alunoAtivo}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-sm transition cursor-pointer"
                >
                  VOLTAR À TABELA
                </button>
              </div>

              {simuladoAtivo.disciplinas.map((d) => (
                <div
                  key={d.nome}
                  className="p-3 bg-white border border-gray-200 rounded-sm space-y-2"
                >
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span className="text-gray-800">{d.nome}</span>
                    <span className="text-gray-500">
                      {d.qtdQuestoes} QUESTÕES (VALOR Q:{" "}
                      {(10 / d.qtdQuestoes).toFixed(2)} PTS)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {d.gabarito.map((_, qIdx) => {
                      const valAtual = respostasProfessor[d.nome]?.[qIdx] || "";
                      const invalido =
                        valAtual !== "" &&
                        !["A", "B", "C", "D", "E"].includes(valAtual);

                      return (
                        <div
                          key={qIdx}
                          className="flex flex-col items-center gap-1"
                        >
                          <span className="text-[10px] text-gray-500 font-bold uppercase">
                            Q{qIdx + 1}
                          </span>
                          <input
                            id={`prof-q-${d.nome}-${qIdx}`}
                            type="text"
                            maxLength="1"
                            value={valAtual}
                            onChange={(e) =>
                              handleRespostaProfessor(
                                d.nome,
                                qIdx,
                                e.target.value,
                                e,
                              )
                            }
                            className={`w-10 h-10 text-center font-bold uppercase border rounded-sm outline-none text-sm transition ${
                              invalido
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-gray-300 bg-white text-gray-800 focus:ring-1 focus:ring-blue-500"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#84cc16] hover:bg-lime-600 text-white font-bold uppercase rounded-sm shadow-sm transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> GUARDAR RESPOSTAS DE{" "}
                  {alunoAtivo}
                </button>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold uppercase rounded-sm transition text-xs cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
