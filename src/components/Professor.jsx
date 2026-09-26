import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserCheck,
  Edit3,
  PlusCircle,
  Eye,
  Trash2,
  Eraser,
  Lock,
  Unlock,
  Calendar,
  Users,
  UserX,
  ArrowLeft,
} from "lucide-react";

export default function Professor({
  simulados = [],
  turmas = [],
  respostasAlunos = [],
  onSalvarResposta,
  onExcluirResposta,
  onVincularTurmaSimulado,
}) {
  const { user, isGestao } = useAuth();

  const [bimestreSelecionado, setBimestreSelecionado] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState("");
  const [alunoAtivo, setAlunoAtivo] = useState(null);
  const [respostasProfessor, setRespostasProfessor] = useState({});

  const turmaAtiva = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );

  const simuladoAtivo = simulados.find(
    (s) => String(s.id) === String(simuladoSelecionadoId),
  );

  const totalQuestoesSimulado =
    simuladoAtivo?.disciplinas?.reduce(
      (acc, d) => acc + (d.gabarito?.length || 0),
      0,
    ) || 0;

  const temPermissaoEdicao = (turma, idSimulado) => {
    if (isGestao) return true;
    if (!turma || !idSimulado) return false;

    const aplicadorSimulado = turma.aplicadoresPorSimulado?.[idSimulado];
    const codigoTurmaSimulado = aplicadorSimulado?.codigo
      ? String(aplicadorSimulado.codigo).trim().toUpperCase()
      : "";

    const codigoUsuario = user?.codigo
      ? String(user.codigo).trim().toUpperCase()
      : "";

    if (!codigoTurmaSimulado) {
      return true;
    }

    return codigoTurmaSimulado === codigoUsuario;
  };

  const handleEntrarNoSimulado = async (idSimulado) => {
    const aplicadorSimulado = turmaAtiva?.aplicadoresPorSimulado?.[idSimulado];
    const codigoTurmaSimulado = aplicadorSimulado?.codigo
      ? String(aplicadorSimulado.codigo).trim().toUpperCase()
      : "";

    if (!codigoTurmaSimulado && !isGestao && onVincularTurmaSimulado) {
      const confirmar = window.confirm(
        "Deseja assumir a aplicação desta turma?",
      );

      if (!confirmar) {
        return;
      }

      try {
        await onVincularTurmaSimulado(turmaAtiva.id, idSimulado, {
          codigo: user.codigo,
          nome: user.nome,
        });
      } catch (error) {
        console.error("Erro ao vincular aplicador:", error);
        alert("Erro ao assumir turma.");
        return;
      }
    }

    setSimuladoSelecionadoId(idSimulado);
  };

  const handleDesvincularSimulado = async (e, idSimulado) => {
    e.stopPropagation();
    if (!onVincularTurmaSimulado || !turmaAtiva) return;

    const confirmar = window.confirm("Deseja liberar este simulado?");

    if (!confirmar) return;

    try {
      await onVincularTurmaSimulado(turmaAtiva.id, idSimulado, null);
    } catch (error) {
      console.error("Erro ao desvincular:", error);
      alert("Erro ao liberar simulado.");
    }
  };

  const handleVoltarAosSimulados = () => {
    setSimuladoSelecionadoId("");
    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  const encontrarRegistoAluno = (nomeAluno) => {
    if (!simuladoAtivo || !turmaAtiva || !Array.isArray(respostasAlunos))
      return null;

    const idSimuladoStr = String(simuladoAtivo.id).trim();
    const nomeSimuladoStr = String(
      simuladoAtivo.nome || simuladoAtivo.titulo || "",
    )
      .trim()
      .toUpperCase();

    const idTurmaStr = String(turmaAtiva.id).trim();
    const nomeTurmaStr = String(turmaAtiva.nome || "")
      .trim()
      .toUpperCase();
    const nomeAlunoStr = String(nomeAluno).trim().toUpperCase();

    return respostasAlunos.find((r) => {
      const rSimId = String(r.simuladoId || r.idSimulado || "").trim();
      const rSimNome = String(r.simuladoNome || r.simulado || "")
        .trim()
        .toUpperCase();
      const matchSimulado =
        rSimId === idSimuladoStr ||
        (nomeSimuladoStr && rSimNome === nomeSimuladoStr);

      const rTurmaId = String(r.turmaId || r.idTurma || "").trim();
      const rTurmaNome = String(r.turma || r.turmaNome || "")
        .trim()
        .toUpperCase();
      const matchTurma =
        rTurmaId === idTurmaStr ||
        (nomeTurmaStr && rTurmaNome === nomeTurmaStr);

      const rAluno = String(r.nomeAluno || r.aluno || "")
        .trim()
        .toUpperCase();
      const matchAluno = rAluno === nomeAlunoStr;

      return matchSimulado && matchTurma && matchAluno;
    });
  };

  const handleSelecionarAluno = (nomeAluno) => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) {
      return;
    }

    setAlunoAtivo(nomeAluno);

    const respostaExistente = encontrarRegistoAluno(nomeAluno);

    if (
      respostaExistente &&
      respostaExistente.gabaritoBruto &&
      Object.keys(respostaExistente.gabaritoBruto).length > 0
    ) {
      setRespostasProfessor(respostaExistente.gabaritoBruto);
    } else {
      setRespostasProfessor({});
    }
  };

  const handleRespostaClick = (disciplinaNome, index, alternativa) => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) return;

    setRespostasProfessor((prev) => {
      const respostaAtual = prev[disciplinaNome]?.[index];
      const novaResposta = respostaAtual === alternativa ? "" : alternativa;

      return {
        ...prev,
        [disciplinaNome]: {
          ...(prev[disciplinaNome] || {}),
          [index]: novaResposta,
        },
      };
    });
  };

  const handleLimparRespostas = () => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) return;

    if (window.confirm("Deseja limpar as respostas atuais?")) {
      setRespostasProfessor({});
    }
  };

  const handleExcluirRespostaAluno = async (registoId, nomeAluno) => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) {
      return;
    }

    if (window.confirm(`Deseja apagar o registo de ${nomeAluno}?`)) {
      if (onExcluirResposta) {
        await onExcluirResposta(registoId);
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

    if (!temAlgumaRespostaValida) return null;

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

    if (!temPermissaoEdicao(turmaAtiva, simuladoAtivo.id)) {
      return;
    }

    const calculo = calcularDesempenhoAluno(respostasProfessor);

    if (!calculo) {
      return alert("Preencha pelo menos uma resposta.");
    }

    const registoExistente = encontrarRegistoAluno(alunoAtivo);

    try {
      const dadosRegisto = {
        ...(registoExistente?.id ? { id: registoExistente.id } : {}),
        simuladoId: simuladoAtivo.id,
        simuladoNome: simuladoAtivo.nome || simuladoAtivo.titulo,
        turmaId: turmaAtiva.id,
        turma: turmaAtiva.nome,
        nomeAluno: alunoAtivo,
        professorAplicador: isGestao ? "GESTÃO" : user.nome,
        totalAcertos: calculo.totalAcertos,
        totalQuestoes: calculo.totalQuestoes,
        percentualGeral: calculo.percentualGeral,
        notaFinal: calculo.notaFinal,
        detalhes: calculo.detalhes,
        gabaritoBruto: respostasProfessor,
        dataRegisto: new Date().toLocaleDateString("pt-PT"),
      };

      await onSalvarResposta(dadosRegisto, user, turmas);
      setAlunoAtivo(null);
      setRespostasProfessor({});
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-3 sm:p-5 border border-[#dbc8b6] w-full max-w-7xl mx-auto overflow-x-hidden font-sans antialiased">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dbc8b6] mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-500 text-white rounded-md flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-gray-800 truncate">
            LANÇAMENTO DE <span className="text-red-500 font-bold">NOTAS</span>
          </h2>
        </div>

        {simuladoSelecionadoId && (
          <button
            onClick={handleVoltarAosSimulados}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-[#dbc8b6] rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 flex-shrink-0 shadow-xs focus:outline-none focus:ring-0"
          >
            &larr; Voltar
          </button>
        )}
      </div>

      {/* SELETORES NO TOPO */}
      {!simuladoSelecionadoId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Bimestre
            </label>
            <select
              value={bimestreSelecionado}
              onChange={(e) => setBimestreSelecionado(e.target.value)}
              className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="">Escolha o bimestre...</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Turma
            </label>
            <select
              value={turmaSelecionadaId}
              onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="">Selecione uma turma...</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* EXIBIÇÃO APÓS ESCOLHER A TURMA E O BIMESTRE */}
      {!simuladoSelecionadoId ? (
        !bimestreSelecionado ? (
          <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
            Selecione o bimestre acima para continuar.
          </div>
        ) : !turmaAtiva ? (
          <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
            Selecione uma turma acima para exibir os simulados.
          </div>
        ) : (
          <div className="border border-[#dbc8b6] rounded-md p-3 bg-gray-50 shadow-xs space-y-3">
            <div className="pb-2 border-b border-[#dbc8b6]">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <span className="truncate">
                  {turmaAtiva.nome} - {bimestreSelecionado}º Bimestre
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(() => {
                const idsSimuladosDoBimestre =
                  turmaAtiva?.simuladosVinculados?.[bimestreSelecionado] || [];

                if (idsSimuladosDoBimestre.length === 0) {
                  return (
                    <div className="col-span-full text-center py-6 text-orange-600 text-xs font-bold uppercase border border-dashed border-orange-200 bg-orange-50 rounded-md">
                      Nenhum simulado vinculado a esta turma no{" "}
                      {bimestreSelecionado}º Bimestre.
                    </div>
                  );
                }

                return idsSimuladosDoBimestre.map((simId) => {
                  const simObj = simulados.find((s) => s.id === simId);
                  const aplicadorSimulado =
                    turmaAtiva?.aplicadoresPorSimulado?.[simId];
                  const codigoTurmaSimulado = aplicadorSimulado?.codigo
                    ? String(aplicadorSimulado.codigo).trim().toUpperCase()
                    : "";
                  const codigoUsuario = user?.codigo
                    ? String(user.codigo).trim().toUpperCase()
                    : "";

                  const meuDono =
                    isGestao ||
                    !codigoTurmaSimulado ||
                    codigoTurmaSimulado === codigoUsuario;

                  return (
                    <div
                      key={simId}
                      className="border border-[#dbc8b6] rounded-md p-3 bg-white flex flex-col justify-between hover:bg-amber-50/20 transition-all space-y-2.5 shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-gray-800 uppercase tracking-wide text-xs truncate">
                            {simObj?.nome || "Simulado Desconhecido"}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {codigoTurmaSimulado ? (
                              <>
                                {meuDono ? (
                                  <Lock
                                    className="w-4 h-4 text-blue-500"
                                    title="Sua aplicação neste simulado"
                                  />
                                ) : (
                                  <Lock
                                    className="w-4 h-4 text-red-500"
                                    title="Aplicado por outro colega"
                                  />
                                )}
                                {isGestao && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleDesvincularSimulado(e, simId)
                                    }
                                    className="p-1 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-colors cursor-pointer focus:outline-none focus:ring-0"
                                    title="Desvincular Professor"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <Unlock
                                className="w-4 h-4 text-emerald-500"
                                title="Simulado Livre"
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase truncate">
                          Aplicador:{" "}
                          <span
                            className={
                              aplicadorSimulado?.nome
                                ? "text-gray-800 font-semibold"
                                : "text-emerald-600 font-semibold"
                            }
                          >
                            {aplicadorSimulado?.nome || "Livre"}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleEntrarNoSimulado(simId)}
                        className={`w-full py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-0 ${
                          meuDono
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-[#dbc8b6]"
                        }`}
                      >
                        {meuDono ? (
                          <>
                            <Edit3 className="w-4 h-4" /> Lançar Notas
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 text-gray-500" /> Ver Notas
                            (Leitura)
                          </>
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )
      ) : (
        /* LANÇAMENTO DE NOTAS DOS ALUNOS (QUANDO UM SIMULADO É SELECIONADO) */
        <div className="space-y-3">
          <div className="border-b border-[#dbc8b6] pb-2 mb-2 space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-gray-800 uppercase tracking-wide leading-tight">
              {turmaAtiva?.nome} - {bimestreSelecionado}º Bimestre
            </h3>
            <h4 className="text-base sm:text-lg font-black text-blue-600 uppercase tracking-wide leading-tight">
              {simuladoAtivo?.nome}
            </h4>
          </div>

          {!alunoAtivo ? (
            <div>
              {!turmaAtiva?.alunos || turmaAtiva.alunos.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-[#dbc8b6] border-dashed">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nenhum aluno cadastrado nesta turma.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto border border-[#dbc8b6] rounded-md shadow-xs bg-white">
                  <table className="w-full min-w-[650px] text-left border-collapse text-xs table-fixed">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#dbc8b6] font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                        <th className="p-2.5 border-r border-[#dbc8b6] w-[26%] sm:w-[22%] align-middle">
                          Aluno
                        </th>

                        {simuladoAtivo?.disciplinas.map((disc) => {
                          const qtdQ = disc.gabarito?.length || 0;
                          return (
                            <th
                              key={disc.nome}
                              className="p-2 border-r border-[#dbc8b6] text-center whitespace-normal break-words align-middle"
                            >
                              <span
                                className="block text-gray-700 font-bold leading-tight truncate max-w-[90px] mx-auto"
                                title={disc.nome}
                              >
                                {disc.nome}
                              </span>
                              <span className="text-[9px] text-gray-400 font-normal block mt-0.5">
                                ({qtdQ} Q)
                              </span>
                            </th>
                          );
                        })}

                        <th className="p-2 border-r border-[#dbc8b6] text-center bg-blue-50/40 whitespace-normal break-words align-middle">
                          <span className="block text-blue-700 font-bold leading-tight">
                            Total
                          </span>
                          <span className="text-[9px] text-gray-400 font-normal block mt-0.5">
                            ({totalQuestoesSimulado} Q)
                          </span>
                        </th>

                        <th className="p-2.5 text-center w-[100px] sm:w-[110px] align-middle">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbc8b6]">
                      {turmaAtiva.alunos.map((aluno, idx) => {
                        const registo = encontrarRegistoAluno(aluno);

                        const dadosCalculados =
                          registo && registo.gabaritoBruto
                            ? calcularDesempenhoAluno(registo.gabaritoBruto)
                            : null;
                        const concluido = dadosCalculados !== null;
                        const temPermissao = temPermissaoEdicao(
                          turmaAtiva,
                          simuladoSelecionadoId,
                        );

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-amber-50/20 transition-colors"
                          >
                            <td className="p-2.5 font-bold text-gray-800 border-r border-[#dbc8b6] uppercase whitespace-normal break-words align-middle text-xs">
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 mt-0.5">
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
                                  className="p-2 border-r border-[#dbc8b6] text-center uppercase align-middle"
                                >
                                  {concluido && infoDisc ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <span className="font-bold text-gray-800 text-xs">
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
                                    <span className="text-gray-300 font-bold">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="p-2 border-r border-[#dbc8b6] text-center bg-blue-50/20 uppercase align-middle">
                              {concluido ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="font-bold text-gray-800 text-xs">
                                    {dadosCalculados.totalAcertos}/
                                    {dadosCalculados.totalQuestoes}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-600">
                                    ({dadosCalculados.percentualGeral}%)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Pendente
                                </span>
                              )}
                            </td>

                            <td className="p-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelecionarAluno(aluno)}
                                  className={`p-2 rounded-md transition-all cursor-pointer focus:outline-none focus:ring-0 ${
                                    temPermissao
                                      ? concluido
                                        ? "bg-white text-gray-700 hover:bg-gray-100 border border-[#dbc8b6] shadow-xs"
                                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-300 shadow-xs"
                                      : "bg-gray-100 text-gray-400 border border-[#dbc8b6] hover:bg-gray-200"
                                  }`}
                                  title={
                                    temPermissao
                                      ? concluido
                                        ? "Editar Notas"
                                        : "Lançar Notas"
                                      : "Ver Notas (Apenas Leitura)"
                                  }
                                >
                                  {temPermissao ? (
                                    concluido ? (
                                      <Edit3 className="w-4 h-4" />
                                    ) : (
                                      <PlusCircle className="w-4 h-4" />
                                    )
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>

                                {concluido && temPermissao && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleExcluirRespostaAluno(
                                        registo.id,
                                        aluno,
                                      )
                                    }
                                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-[#dbc8b6] shadow-xs focus:outline-none focus:ring-0"
                                    title="Excluir Resposta"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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
              className="space-y-3 p-3 sm:p-4 bg-gray-50 border border-[#dbc8b6] rounded-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#dbc8b6]">
                {/* Nome do aluno à esquerda */}
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide whitespace-normal break-words leading-snug">
                  <span className="text-blue-600 font-bold">{alunoAtivo}</span>
                </h3>

                {/* Botões em ícones à direita */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleLimparRespostas}
                    className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-all cursor-pointer active:scale-95 shadow-xs border border-orange-200 focus:outline-none focus:ring-0"
                    title="Limpar Respostas Atuais"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlunoAtivo(null)}
                    className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 border border-[#dbc8b6] rounded-md transition-all cursor-pointer active:scale-95 shadow-xs focus:outline-none focus:ring-0"
                    title="Voltar para a Lista de Alunos"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DISPOSIÇÃO VERTICAL DAS QUESTÕES COM 4 ALTERNATIVAS USANDO DIVS (ELIMINA 100% O FOCO FANTASMA DO MOBILE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {simuladoAtivo?.disciplinas.map((d) => {
                  const gabaritoDisc = d.gabarito || [];
                  const alternativas = ["A", "B", "C", "D"];

                  return (
                    <div
                      key={d.nome}
                      className="bg-white border border-[#dbc8b6] rounded-md p-3 shadow-xs flex flex-col"
                    >
                      {/* Cabeçalho da Disciplina */}
                      <div className="text-center font-bold text-gray-800 text-xs uppercase bg-gray-100 py-1.5 px-2 rounded border border-[#dbc8b6] mb-2 tracking-wider">
                        {d.nome}{" "}
                        <span className="text-[10px] text-gray-500 font-normal">
                          ({gabaritoDisc.length}Q)
                        </span>
                      </div>

                      {/* Lista Vertical de Questões */}
                      <div className="space-y-1.5">
                        {gabaritoDisc.map((_, qIdx) => {
                          const valAtual =
                            respostasProfessor[d.nome]?.[qIdx] || "";
                          const isAlternada = qIdx % 2 === 1;

                          return (
                            <div
                              key={qIdx}
                              className={`flex items-center justify-between px-3 py-2 rounded border border-[#dbc8b6] ${
                                isAlternada ? "bg-amber-50/20" : "bg-white"
                              }`}
                            >
                              <span className="text-xs font-bold text-gray-700 font-mono tracking-wider">
                                {String(qIdx + 1).padStart(2, "0")}
                              </span>
                              <div className="flex gap-2.5">
                                {alternativas.map((alt) => {
                                  const selecionada = valAtual === alt;
                                  return (
                                    <div
                                      key={alt}
                                      onClick={() =>
                                        handleRespostaClick(d.nome, qIdx, alt)
                                      }
                                      className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full text-sm font-bold transition-all flex items-center justify-center active:scale-90 shadow-xs cursor-pointer select-none ${
                                        selecionada
                                          ? "bg-blue-600 text-white border-transparent scale-105 shadow-blue-500/30"
                                          : "bg-white text-gray-700 border border-[#dbc8b6] hover:border-blue-400 hover:bg-blue-50"
                                      }`}
                                    >
                                      {alt}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de salvar fixo no final normal */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-md text-xs shadow-sm cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-0"
                >
                  Salvar Respostas do Aluno
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
