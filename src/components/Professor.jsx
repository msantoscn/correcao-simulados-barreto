import { useState } from "react";
import {
  UserCheck,
  CheckCircle,
  ArrowLeft,
  User,
  Award,
  Check,
  AlertCircle,
} from "lucide-react";

export default function Professor({
  simulados,
  turmas,
  respostasAlunos,
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

  // Função auxiliar para verificar se o registo do aluno está desatualizado em relação ao simulado editado
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

  // Tratar entradas do gabarito e focar no próximo campo
  const handleRespostaProfessor = (disciplinaNome, index, valor) => {
    const val = valor.toUpperCase();
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
      if (proximoCampo) proximoCampo.focus();
    }
  };

  // Salvar respostas do aluno com cálculos de notas/percentuais por disciplina
  const submeterRespostasAluno = (e) => {
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

    const novoRegisto = {
      id: crypto.randomUUID(),
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

    const filtrados = respostasAlunos.filter(
      (r) =>
        !(
          r.simuladoId === simuladoAtivo.id &&
          r.turma === turmaAtiva.nome &&
          r.nomeAluno === alunoAtivo
        ),
    );

    const listaAtualizada = [...filtrados, novoRegisto];
    setRespostasAlunos(listaAtualizada);
    localStorage.setItem("respostas_alunos", JSON.stringify(listaAtualizada));

    alert(
      `Respostas guardadas! ${alunoAtivo}: ${percentualGeral}% de acertos (Geral: ${notaGeral}/10)`,
    );

    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <UserCheck className="text-indigo-600" /> Aplicação e Correção de
        Simulados
      </h2>

      {/* ---------------- PASSO 1: Seleção ---------------- */}
      {passo === 1 && (
        <form onSubmit={handleEntrarNaTurma} className="space-y-6 mt-4">
          <p className="text-slate-500 text-sm">
            Selecione o simulado, a turma e informe o aplicador para gerenciar
            os alunos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Simulado
              </label>
              <select
                value={simuladoSelecionadoId}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turma
              </label>
              <select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professor Aplicador
              </label>
              <input
                type="text"
                placeholder="Ex: Prof. Carlos Santos"
                value={professorAplicador}
                onChange={(e) => setProfessorAplicador(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow flex items-center justify-center gap-2 transition"
          >
            Adicionar respostas →
          </button>
        </form>
      )}

      {/* ---------------- PASSO 2: Painel da Turma ---------------- */}
      {passo === 2 && (
        <div className="space-y-6 mt-4">
          <div className="flex flex-wrap justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900 text-lg">
                  {turmaAtiva?.nome}
                </span>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                  {simuladoAtivo?.nome}
                </span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                Aplicador: <strong>{professorAplicador}</strong>
              </p>
            </div>
            <button
              onClick={handleVoltarSelecao}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-2 rounded-lg border border-indigo-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Trocar Turma / Simulado
            </button>
          </div>

          {!alunoAtivo ? (
            /* Lista completa de Alunos da Turma */
            <div className="space-y-3">
              <h3 className="text-md font-bold text-slate-700 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" /> Lista de Alunos da
                Turma (Clique para adicionar/editar respostas)
              </h3>

              {!turmaAtiva?.alunos || turmaAtiva.alunos.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
                  Nenhum aluno cadastrado nesta turma. Adicione alunos na aba
                  **Turmas**.
                </div>
              ) : (
                <div className="space-y-3">
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
                      <div
                        key={idx}
                        onClick={() => handleSelecionarAluno(aluno)}
                        className={`p-4 rounded-xl border cursor-pointer transition shadow-sm hover:shadow-md flex flex-col gap-3 ${
                          concluido
                            ? "bg-green-50/50 border-green-200 hover:bg-green-100/60"
                            : temRespostas && desatualizado
                              ? "bg-amber-50/60 border-amber-200 hover:bg-amber-100/70"
                              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">
                                {aluno}
                              </p>
                              <span className="text-xs">
                                {concluido ? (
                                  <span className="text-green-600 font-medium">
                                    Concluído
                                  </span>
                                ) : temRespostas && desatualizado ? (
                                  <span className="text-amber-700 font-medium">
                                    Pendente (Simulado foi atualizado/editado)
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    Pendente (Sem respostas)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {concluido ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-200/80 px-3 py-1.5 rounded-full">
                                <Check className="w-3.5 h-3.5" /> Geral:{" "}
                                {registo.percentualGeral}% (Nota:{" "}
                                {registo.notaFinal})
                              </span>
                            ) : temRespostas && desatualizado ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300">
                                <AlertCircle className="w-3.5 h-3.5" />{" "}
                                Atualizar Respostas
                              </span>
                            ) : (
                              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                + Adicionar respostas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detalhes por disciplina (só aparecem se houver respostas lançadas e válidas) */}
                        {concluido && registo.detalhes && (
                          <div className="mt-2 pt-3 border-t border-green-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(registo.detalhes).map(
                              ([discNome, info]) => (
                                <div
                                  key={discNome}
                                  className="bg-white/90 p-2.5 rounded border border-green-100 shadow-xs"
                                >
                                  <p className="font-bold text-slate-800 mb-1">
                                    {discNome}
                                  </p>
                                  <div className="flex justify-between text-slate-600">
                                    <span>
                                      Acertos:{" "}
                                      <strong>
                                        {info.acertos}/{info.total}
                                      </strong>
                                    </span>
                                    <span className="font-semibold text-indigo-700">
                                      {info.percentagem}%
                                    </span>
                                  </div>
                                  <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between text-slate-700">
                                    <span>Nota:</span>
                                    <strong className="text-indigo-800">
                                      {info.nota} / 10
                                    </strong>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Formulário de Digitação de Gabarito */
            <form
              onSubmit={submeterRespostasAluno}
              className="space-y-6 bg-slate-50 p-5 rounded-xl border border-slate-200"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-800">
                    Lançando gabarito de:{" "}
                    <span className="text-indigo-600">{alunoAtivo}</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-md border border-slate-300"
                >
                  Voltar à lista
                </button>
              </div>

              {simuladoAtivo.disciplinas.map((d) => (
                <div
                  key={d.nome}
                  className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-indigo-900 text-sm">
                      {d.nome}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {d.qtdQuestoes} Questões (Cada questão vale{" "}
                      {(10 / d.qtdQuestoes).toFixed(2)} pts)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {d.gabarito.map((_, qIdx) => (
                      <div key={qIdx} className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold mb-0.5">
                          Q{qIdx + 1}
                        </span>
                        <input
                          id={`prof-q-${d.nome}-${qIdx}`}
                          type="text"
                          maxLength="1"
                          value={respostasProfessor[d.nome]?.[qIdx] || ""}
                          onChange={(e) =>
                            handleRespostaProfessor(
                              d.nome,
                              qIdx,
                              e.target.value,
                            )
                          }
                          className="w-9 h-9 text-center font-bold uppercase border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle className="w-5 h-5" /> Salvar Respostas de{" "}
                  {alunoAtivo}
                </button>
                <button
                  type="button"
                  onClick={() => setAlunoAtivo(null)}
                  className="px-5 py-3.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition text-sm"
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
