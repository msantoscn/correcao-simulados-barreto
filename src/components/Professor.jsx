import { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle,
  ArrowLeft,
  User,
  Award,
  Edit3,
  PlusCircle,
} from "lucide-react";

export default function Professor({
  simulados = [],
  turmas = [],
  respostasAlunos = [],
  onSalvarResposta,
}) {
  const [passo, setPasso] = useState(1);
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [professorAplicador, setProfessorAplicador] = useState("");
  const [alunoAtivo, setAlunoAtivo] = useState(null);
  const [respostasProfessor, setRespostasProfessor] = useState({});

  const simuladoAtivo = simulados.find(
    (s) => String(s.id) === String(simuladoSelecionadoId),
  );
  const turmaAtiva = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );

  const totalQuestoesSimulado =
    simuladoAtivo?.disciplinas?.reduce(
      (acc, d) => acc + (d.gabarito?.length || 0),
      0,
    ) || 0;

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

  const handleVoltarSelecao = () => {
    setPasso(1);
    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  const handleSelecionarAluno = (nomeAluno) => {
    setAlunoAtivo(nomeAluno);

    const respostaExistente = respostasAlunos.find(
      (r) =>
        String(r.simuladoId) === String(simuladoSelecionadoId) &&
        String(r.turma).trim().toUpperCase() ===
          String(turmaAtiva?.nome).trim().toUpperCase() &&
        String(r.nomeAluno).trim().toUpperCase() ===
          String(nomeAluno).trim().toUpperCase(),
    );

    if (respostaExistente && respostaExistente.gabaritoBruto) {
      setRespostasProfessor(respostaExistente.gabaritoBruto);
    } else {
      setRespostasProfessor({});
    }

    if (window.innerWidth < 1024) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

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

  const handleRespostaProfessor = (disciplinaNome, index, valor, e) => {
    const val = valor.toUpperCase();

    if (e?.nativeEvent?.inputType === "deleteContentBackward" && !val) {
      setRespostasProfessor((prev) => ({
        ...prev,
        [disciplinaNome]: {
          ...(prev[disciplinaNome] || {}),
          [index]: "",
        },
      }));
      if (index > 0) {
        const campoAnterior = document.getElementById(
          `prof-q-${disciplinaNome}-${index - 1}`,
        );
        if (campoAnterior) campoAnterior.focus();
      }
      return;
    }

    if (val && !["A", "B", "C", "D", "E"].includes(val)) {
      return;
    }

    setRespostasProfessor((prev) => ({
      ...prev,
      [disciplinaNome]: {
        ...(prev[disciplinaNome] || {}),
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

  const disciplinaTemRespostas = (respAlunoDisc) => {
    if (!respAlunoDisc) return false;
    return Object.values(respAlunoDisc).some(
      (val) => val !== undefined && val !== null && String(val).trim() !== "",
    );
  };

  const calcularDesempenhoAluno = (gabaritoBrutoDoAluno) => {
    let totalAcertosGeral = 0;
    let totalQGeral = 0;
    let temAlgumaRespostaValida = false;
    const resultadoPorDisciplina = {};

    simuladoAtivo.disciplinas.forEach((d) => {
      const respAlunoDisc = gabaritoBrutoDoAluno[d.nome] || {};
      const gabaritoOficial = d.gabarito || [];
      const qtdQ = gabaritoOficial.length;

      if (!disciplinaTemRespostas(respAlunoDisc)) {
        resultadoPorDisciplina[d.nome] = null;
        return;
      }

      temAlgumaRespostaValida = true;
      let acertosDisc = 0;

      gabaritoOficial.forEach((correta, idx) => {
        totalQGeral++;
        if (respAlunoDisc[idx] && respAlunoDisc[idx] === correta) {
          acertosDisc++;
          totalAcertosGeral++;
        }
      });

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

    if (!temAlgumaRespostaValida) {
      return null;
    }

    const percentualGeral =
      totalQGeral > 0 ? Math.round((totalAcertosGeral / totalQGeral) * 100) : 0;
    const notaGeral =
      totalQGeral > 0
        ? ((totalAcertosGeral / totalQGeral) * 10).toFixed(1)
        : "0.0";

    return {
      totalAcertos: totalAcertosGeral,
      totalQuestoes: totalQGeral,
      percentualGeral,
      notaFinal: notaGeral,
      detalhes: resultadoPorDisciplina,
    };
  };

  const submeterRespostasAluno = async (e) => {
    e.preventDefault();
    if (!alunoAtivo || !simuladoAtivo || !turmaAtiva) return;

    const calculo = calcularDesempenhoAluno(respostasProfessor);

    if (!calculo) {
      return alert("Preencha pelo menos uma resposta antes de guardar.");
    }

    const registoExistente = respostasAlunos.find(
      (r) =>
        String(r.simuladoId) === String(simuladoAtivo.id) &&
        String(r.turma).trim().toUpperCase() ===
          String(turmaAtiva.nome).trim().toUpperCase() &&
        String(r.nomeAluno).trim().toUpperCase() ===
          String(alunoAtivo).trim().toUpperCase(),
    );

    try {
      const dadosRegisto = {
        ...(registoExistente?.id ? { id: registoExistente.id } : {}),
        simuladoId: simuladoAtivo.id,
        simuladoNome: simuladoAtivo.nome,
        turma: turmaAtiva.nome,
        nomeAluno: alunoAtivo,
        professorAplicador: professorAplicador.trim(),
        totalAcertos: calculo.totalAcertos,
        totalQuestoes: calculo.totalQuestoes,
        percentualGeral: calculo.percentualGeral,
        notaFinal: calculo.notaFinal,
        detalhes: calculo.detalhes,
        gabaritoBruto: respostasProfessor,
        dataRegisto: new Date().toLocaleDateString("pt-PT"),
      };

      await onSalvarResposta(dadosRegisto);

      alert(
        `Respostas guardadas com sucesso! ${alunoAtivo}: ${calculo.percentualGeral}% de acertos`,
      );

      setAlunoAtivo(null);
      setRespostasProfessor({});
    } catch (error) {
      console.error("Erro ao guardar respostas:", error);
      alert(
        "Erro ao guardar respostas. Verifique a consola para mais detalhes.",
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 lg:p-6 border border-slate-200/80">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
          <UserCheck className="text-slate-600 w-5 h-5" />
        </div>
        <h2 className="text-lg font-black tracking-wide uppercase text-slate-800">
          Aplicação e Correção de{" "}
          <span className="text-[#4b82f6]">Simulados</span>
        </h2>
      </div>

      {passo === 1 && (
        <form onSubmit={handleEntrarNaTurma} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Simulado
              </label>
              <select
                value={simuladoSelecionadoId}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-sm font-medium outline-none transition-all uppercase"
                required
              >
                <option value="">-- Selecione o Simulado --</option>
                {simulados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Turma
              </label>
              <select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-sm font-medium outline-none transition-all uppercase"
                required
              >
                <option value="">-- Selecione a Turma --</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Professor Aplicador
              </label>
              <input
                type="text"
                placeholder="Ex: Prof. Carlos Santos"
                value={professorAplicador}
                onChange={(e) =>
                  setProfessorAplicador(e.target.value.toUpperCase())
                }
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-sm font-medium outline-none transition-all uppercase placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 lg:py-3 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-sm shadow-blue-500/20 cursor-pointer active:scale-[0.98]"
          >
            Acessar Lista da Turma
          </button>
        </form>
      )}

      {passo === 2 && (
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Turma Ativa
              </span>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">
                {turmaAtiva?.nome}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex flex-wrap items-center gap-2">
                <span>
                  Simulado:{" "}
                  <strong className="text-slate-700">
                    {simuladoAtivo?.nome}
                  </strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  Aplicador:{" "}
                  <strong className="text-slate-700">
                    {professorAplicador}
                  </strong>
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleVoltarSelecao}
              className="px-4 py-3 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] shadow-sm w-full sm:w-auto cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Trocar Turma / Simulado
            </button>
          </div>

          {!alunoAtivo ? (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" /> Resumo de Desempenho
                da Turma
              </h3>

              {!turmaAtiva?.alunos || turmaAtiva.alunos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Nenhum aluno cadastrado nesta turma.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                  <table className="w-full min-w-[700px] text-left border-collapse text-xs table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        <th className="p-3.5 border-r border-slate-200 w-[28%] sm:w-[22%] align-middle">
                          Aluno
                        </th>

                        {simuladoAtivo?.disciplinas.map((disc) => {
                          const qtdQ = disc.gabarito?.length || 0;
                          return (
                            <th
                              key={disc.nome}
                              className="p-2 border-r border-slate-200 text-center whitespace-normal break-words align-middle"
                            >
                              <span className="block text-slate-700 font-bold leading-tight break-words">
                                {disc.nome}
                              </span>
                              <span className="text-[9px] text-slate-400 font-normal block mt-0.5">
                                ({qtdQ} Q)
                              </span>
                            </th>
                          );
                        })}

                        <th className="p-2 border-r border-slate-200 text-center bg-blue-50/40 whitespace-normal break-words align-middle">
                          <span className="block text-blue-700 font-bold leading-tight break-words">
                            Geral (Total)
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal block mt-0.5">
                            ({totalQuestoesSimulado} Q)
                          </span>
                        </th>

                        <th className="p-3.5 text-center w-[110px] sm:w-[95px] align-middle">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {turmaAtiva.alunos.map((aluno, idx) => {
                        const registo = respostasAlunos.find(
                          (r) =>
                            String(r.simuladoId) === String(simuladoAtivo.id) &&
                            String(r.turma).trim().toUpperCase() ===
                              String(turmaAtiva.nome).trim().toUpperCase() &&
                            String(r.nomeAluno).trim().toUpperCase() ===
                              String(aluno).trim().toUpperCase(),
                        );

                        const dadosCalculados =
                          registo && registo.gabaritoBruto
                            ? calcularDesempenhoAluno(registo.gabaritoBruto)
                            : null;

                        const concluido = dadosCalculados !== null;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-blue-50/30 transition-colors"
                          >
                            <td className="p-3.5 font-bold text-slate-700 border-r border-slate-200 uppercase whitespace-normal break-words align-middle text-xs">
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="break-words">{aluno}</span>
                              </div>
                            </td>

                            {simuladoAtivo?.disciplinas.map((disc) => {
                              const infoDisc =
                                dadosCalculados?.detalhes?.[disc.nome];

                              return (
                                <td
                                  key={disc.nome}
                                  className="p-2 border-r border-slate-200 text-center uppercase align-middle"
                                >
                                  {concluido && infoDisc ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <span className="font-bold text-slate-700 text-xs">
                                        {infoDisc.acertos}/{infoDisc.total}{" "}
                                        <span className="text-blue-600 font-semibold">
                                          ({infoDisc.percentagem}%)
                                        </span>
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        Nota: {infoDisc.nota}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-bold">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="p-2 border-r border-slate-200 text-center bg-blue-50/20 uppercase align-middle">
                              {concluido ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="font-bold text-slate-700 text-xs">
                                    {dadosCalculados.totalAcertos}/
                                    {dadosCalculados.totalQuestoes}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-600">
                                    ({dadosCalculados.percentualGeral}%)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Pendente
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => handleSelecionarAluno(aluno)}
                                className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 w-full cursor-pointer active:scale-95 shadow-sm ${
                                  concluido
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-slate-100"
                                    : "bg-[#4b82f6] hover:bg-blue-600 text-white shadow-blue-500/20"
                                }`}
                              >
                                {concluido ? (
                                  <>
                                    <Edit3 className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                                    <span>Editar</span>
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="w-3.5 h-3.5 flex-shrink-0 text-blue-100" />
                                    <span>Lançar</span>
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
              className="space-y-4 p-4 sm:p-5 lg:p-6 bg-slate-50 border border-slate-200 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">
                    Lançando Gabarito:{" "}
                    <span className="text-red-600">{alunoAtivo}</span>
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="px-4 py-2.5 sm:px-3 sm:py-1.5 w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Voltar à Tabela
                </button>
              </div>

              {simuladoAtivo.disciplinas.map((d) => {
                const gabaritoDisc = d.gabarito || [];
                const qtdQ = gabaritoDisc.length;
                const valorQuestao = qtdQ > 0 ? (10 / qtdQ).toFixed(2) : "0.00";

                return (
                  <div
                    key={d.nome}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs font-bold uppercase gap-1">
                      <span className="text-slate-800">{d.nome}</span>
                      <span className="text-slate-400 text-[10px] tracking-wider">
                        {qtdQ} Questões (Valor por Questão: {valorQuestao} pts)
                      </span>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                      {gabaritoDisc.map((_, qIdx) => {
                        const valAtual =
                          respostasProfessor[d.nome]?.[qIdx] || "";
                        const invalido =
                          valAtual !== "" &&
                          !["A", "B", "C", "D", "E"].includes(valAtual);

                        return (
                          <div
                            key={qIdx}
                            className="flex flex-col items-center gap-1"
                          >
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
                              className={`w-11 h-11 sm:w-10 sm:h-10 text-center font-bold uppercase border rounded-xl outline-none text-base sm:text-sm transition-all shadow-sm ${
                                invalido
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 lg:py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider rounded-xl shadow-sm shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <CheckCircle className="w-4 h-4" /> Salvar Respostas
                </button>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="px-6 py-3.5 lg:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xl transition-all text-xs cursor-pointer active:scale-[0.98]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
