import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserCheck,
  Award,
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

  // Alterado de "1" para "" para iniciar vazio com a mensagem de escolha
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
      const simuladoObj = simulados.find((s) => s.id === idSimulado);
      const confirmar = window.confirm(
        `Deseja assumir a aplicação do simulado "${simuladoObj?.nome || "Selecionado"}" para a turma ${turmaAtiva.nome}?`,
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
        alert("Erro ao vincular aplicador. Tente novamente.");
        return;
      }
    }

    setSimuladoSelecionadoId(idSimulado);
  };

  const handleDesvincularSimulado = async (
    e,
    idSimulado,
    nomeSimulado,
    nomeAplicador,
  ) => {
    e.stopPropagation();
    if (!onVincularTurmaSimulado || !turmaAtiva) return;

    const confirmar = window.confirm(
      `DESVINCULAR PROFESSOR:\n\n• Professor: [ ${(
        nomeAplicador || "ATUAL"
      ).toUpperCase()} ]\n• Simulado: [ ${nomeSimulado.toUpperCase()} ]\n\nDeseja realmente liberar este simulado?`,
    );

    if (!confirmar) return;

    try {
      await onVincularTurmaSimulado(turmaAtiva.id, idSimulado, null);
      alert("Simulado liberado com sucesso.");
    } catch (error) {
      console.error("Erro ao desvincular:", error);
      alert("Erro ao liberar simulado. Verifique os dados.");
    }
  };

  const handleVoltarAosSimulados = () => {
    setSimuladoSelecionadoId("");
    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  const handleSelecionarAluno = (nomeAluno) => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) {
      return;
    }

    setAlunoAtivo(nomeAluno);

    const respostaExistente = respostasAlunos.find(
      (r) =>
        String(r.simuladoId) === String(simuladoAtivo?.id) &&
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

    if (
      window.confirm(
        `Tem a certeza que deseja limpar as repostas atuais de ${alunoAtivo}?`,
      )
    ) {
      setRespostasProfessor({});
    }
  };

  const handleExcluirRespostaAluno = async (registoId, nomeAluno) => {
    if (!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId)) {
      return;
    }

    if (
      window.confirm(
        `ATENÇÃO: Deseja apagar definitivamente o gabarito e nota de ${nomeAluno}?`,
      )
    ) {
      if (onExcluirResposta) {
        await onExcluirResposta(registoId);
        alert(`Registo de ${nomeAluno} excluído com sucesso.`);
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
      return alert("Preencha pelo menos uma resposta antes de salvar.");
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
        professorAplicador: isGestao ? "GESTÃO" : user.nome,
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
        `Respostas salvas com sucesso! ${alunoAtivo}: ${calculo.percentualGeral}% de acertos`,
      );
      setAlunoAtivo(null);
      setRespostasProfessor({});
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5 lg:p-6 border border-slate-200/80 w-full overflow-x-hidden">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0">
            <UserCheck className="text-slate-600 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-800 leading-tight truncate">
              Lançamento de <span className="text-[#4b82f6]">Notas</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {user.nome} {isGestao && "(Gestão)"}
            </p>
          </div>
        </div>

        {simuladoSelecionadoId && (
          <button
            onClick={handleVoltarAosSimulados}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            &larr; Voltar aos Simulados
          </button>
        )}
      </div>

      {/* SELETORES NO TOPO (DROPDOWNS: BIMESTRE E TURMA) */}
      {!simuladoSelecionadoId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Bimestre
            </label>
            <select
              value={bimestreSelecionado}
              onChange={(e) => setBimestreSelecionado(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:outline-none focus:border-[#4b82f6] shadow-xs cursor-pointer"
            >
              <option value="">Escolha o bimestre...</option>
              <option value="1">1º Bimestre</option>
              <option value="2">2º Bimestre</option>
              <option value="3">3º Bimestre</option>
              <option value="4">4º Bimestre</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Turma
            </label>
            <select
              value={turmaSelecionadaId}
              onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:outline-none focus:border-[#4b82f6] shadow-xs cursor-pointer"
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
          <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            Selecione o bimestre acima para continuar.
          </div>
        ) : !turmaAtiva ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            Selecione uma turma acima para exibir os simulados.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4b82f6]" />
                <span>Turma: {turmaAtiva.nome}</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 uppercase">
                {bimestreSelecionado}º Bimestre
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {(() => {
                const idsSimuladosDoBimestre =
                  turmaAtiva?.simuladosVinculados?.[bimestreSelecionado] || [];

                if (idsSimuladosDoBimestre.length === 0) {
                  return (
                    <div className="col-span-full text-center py-10 text-orange-500 text-xs font-bold uppercase border-2 border-dashed border-orange-200 bg-orange-50 rounded-2xl">
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
                    !codigoTurmaSimulado ||
                    codigoTurmaSimulado === codigoUsuario ||
                    isGestao;

                  return (
                    <div
                      key={simId}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-colors space-y-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-black text-slate-800 uppercase tracking-wide text-xs sm:text-sm truncate">
                            {simObj?.nome || "Simulado Desconhecido"}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {codigoTurmaSimulado ? (
                              <>
                                {meuDono ? (
                                  <Lock
                                    className="w-4 h-4 text-blue-500"
                                    title="Sua aplicação neste simulado"
                                  />
                                ) : (
                                  <Lock
                                    className="w-4 h-4 text-red-400"
                                    title="Aplicado por outro colega"
                                  />
                                )}
                                {isGestao && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleDesvincularSimulado(
                                        e,
                                        simId,
                                        simObj?.nome || "Simulado",
                                        aplicadorSimulado?.nome,
                                      )
                                    }
                                    className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Desvincular Professor"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <Unlock
                                className="w-4 h-4 text-emerald-400"
                                title="Simulado Livre"
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                          Aplicador:{" "}
                          <span
                            className={
                              aplicadorSimulado?.nome
                                ? "text-slate-700"
                                : "text-emerald-600"
                            }
                          >
                            {aplicadorSimulado?.nome || "Livre"}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleEntrarNoSimulado(simId)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                          meuDono
                            ? "bg-[#4b82f6] hover:bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {meuDono ? (
                          <>
                            <Edit3 className="w-4 h-4" /> add Notas
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 text-slate-500" /> Ver Notas
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
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Turma:{" "}
                <strong className="text-slate-700">{turmaAtiva?.nome}</strong>{" "}
                {!temPermissaoEdicao(turmaAtiva, simuladoSelecionadoId) && (
                  <span className="text-red-500 font-bold">
                    (Modo Apenas Leitura)
                  </span>
                )}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wide truncate">
                Simulado:{" "}
                <span className="text-[#4b82f6]">{simuladoAtivo?.nome}</span>
              </h3>
            </div>
          </div>

          {!alunoAtivo ? (
            <div>
              {!turmaAtiva?.alunos || turmaAtiva.alunos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Nenhum aluno cadastrado nesta turma.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
                  <table className="w-full min-w-[650px] text-left border-collapse text-xs table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">
                        <th className="p-3 border-r border-slate-200 w-[26%] sm:w-[22%] align-middle">
                          Aluno
                        </th>

                        {simuladoAtivo?.disciplinas.map((disc) => {
                          const qtdQ = disc.gabarito?.length || 0;
                          return (
                            <th
                              key={disc.nome}
                              className="p-2 border-r border-slate-200 text-center whitespace-normal break-words align-middle"
                            >
                              <span
                                className="block text-slate-700 font-bold leading-tight truncate max-w-[90px] mx-auto"
                                title={disc.nome}
                              >
                                {disc.nome}
                              </span>
                              <span className="text-[9px] text-slate-400 font-normal block mt-0.5">
                                ({qtdQ} Q)
                              </span>
                            </th>
                          );
                        })}

                        <th className="p-2 border-r border-slate-200 text-center bg-blue-50/40 whitespace-normal break-words align-middle">
                          <span className="block text-blue-700 font-bold leading-tight">
                            Total
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal block mt-0.5">
                            ({totalQuestoesSimulado} Q)
                          </span>
                        </th>

                        <th className="p-3 text-center w-[100px] sm:w-[110px] align-middle">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {turmaAtiva.alunos.map((aluno, idx) => {
                        const registo = respostasAlunos.find(
                          (r) =>
                            String(r.simuladoId) ===
                              String(simuladoAtivo?.id) &&
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
                        const temPermissao = temPermissaoEdicao(
                          turmaAtiva,
                          simuladoSelecionadoId,
                        );

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-blue-50/25 transition-colors"
                          >
                            <td className="p-3 font-bold text-slate-700 border-r border-slate-200 uppercase whitespace-normal break-words align-middle text-xs">
                              <div className="flex items-start gap-1.5">
                                <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 mt-0.5">
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
                                      <span className="font-bold text-slate-700 text-[11px] sm:text-xs">
                                        {infoDisc.acertos}/{infoDisc.total}{" "}
                                        <span className="text-blue-600 font-semibold">
                                          ({infoDisc.percentagem}%)
                                        </span>
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
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

                            <td className="p-2 border-r border-slate-200 text-center bg-blue-50/15 uppercase align-middle">
                              {concluido ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="font-bold text-slate-700 text-[11px] sm:text-xs">
                                    {dadosCalculados.totalAcertos}/
                                    {dadosCalculados.totalQuestoes}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-600">
                                    ({dadosCalculados.percentualGeral}%)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Pendente
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelecionarAluno(aluno)}
                                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                                    temPermissao
                                      ? concluido
                                        ? "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60"
                                      : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
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
                                    <Eye className="w-4 h-4 text-slate-500" />
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
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-slate-200/60"
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
              className="space-y-4 p-3.5 sm:p-5 lg:p-6 bg-slate-50 border border-slate-200 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2 min-w-0">
                  <Award className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">
                    Gabarito de:{" "}
                    <span className="text-[#4b82f6]">{alunoAtivo}</span>
                  </span>
                </h3>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={handleLimparRespostas}
                    className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1 flex-1 sm:flex-initial justify-center"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlunoAtivo(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                  >
                    Voltar
                  </button>
                </div>
              </div>

              {simuladoAtivo?.disciplinas.map((d) => {
                const gabaritoDisc = d.gabarito || [];
                const alternativas = ["A", "B", "C", "D", "E"];

                return (
                  <div
                    key={d.nome}
                    className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs font-bold uppercase gap-1 border-b border-slate-100 pb-2">
                      <span className="text-slate-800">{d.nome}</span>
                      <span className="text-slate-400 text-[10px] tracking-wider">
                        {gabaritoDisc.length} Questões
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {gabaritoDisc.map((_, qIdx) => {
                        const valAtual =
                          respostasProfessor[d.nome]?.[qIdx] || "";

                        return (
                          <div
                            key={qIdx}
                            className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100"
                          >
                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider w-8">
                              Q{String(qIdx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex gap-1 sm:gap-1.5">
                              {alternativas.map((alt) => {
                                const selecionada = valAtual === alt;
                                return (
                                  <button
                                    key={alt}
                                    type="button"
                                    onClick={() =>
                                      handleRespostaClick(d.nome, qIdx, alt)
                                    }
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center active:scale-90 shadow-xs cursor-pointer ${
                                      selecionada
                                        ? "bg-[#4b82f6] text-white border-transparent scale-115 shadow-blue-500/20"
                                        : "bg-white text-slate-400 border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                    }`}
                                  >
                                    {alt}
                                  </button>
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

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-xl text-xs shadow-xs shadow-blue-500/20 cursor-pointer transition-all active:scale-95"
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
