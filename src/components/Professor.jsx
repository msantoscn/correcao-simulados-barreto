import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserCheck,
  ArrowLeft,
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
} from "lucide-react";

export default function Professor({
  simulados = [],
  turmas = [],
  respostasAlunos = [],
  onSalvarResposta,
  onExcluirResposta,
  onVincularTurma,
}) {
  const { user, isGestao } = useAuth();

  const [bimestreSelecionado, setBimestreSelecionado] = useState(null);
  const [passo, setPasso] = useState(1);
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

  // Função centralizada, rigorosa e normalizada para permissão de edição
  const temPermissaoEdicao = (turma) => {
    if (isGestao) return true;
    if (!turma) return false;

    const codigoTurma = turma.professorVinculadoCodigo
      ? String(turma.professorVinculadoCodigo).trim().toUpperCase()
      : "";

    const codigoUsuario = user?.codigo
      ? String(user.codigo).trim().toUpperCase()
      : "";

    // Se não tem professor vinculado, está livre (pode assumir)
    if (!codigoTurma) {
      return true;
    }

    // Só tem permissão se o código do usuário logado for exatamente o vinculado
    return codigoTurma === codigoUsuario;
  };

  // Ao clicar para entrar na turma
  const handleEntrarNaTurma = async (turma, idSimulado) => {
    const codigoTurma = turma.professorVinculadoCodigo
      ? String(turma.professorVinculadoCodigo).trim().toUpperCase()
      : "";
    const codigoUsuario = user?.codigo
      ? String(user.codigo).trim().toUpperCase()
      : "";

    const temDonoOutro =
      codigoTurma !== "" && codigoTurma !== codigoUsuario && !isGestao;

    // Se já pertence a outro professor, avisa e entra em MODO DE LEITURA
    if (temDonoOutro) {
      alert(
        `Esta turma pertence ao aplicador ${turma.professorVinculadoNome || "outro colega"}. Apenas visualização de notas permitida.`,
      );
      setTurmaSelecionadaId(turma.id);
      setSimuladoSelecionadoId(idSimulado);
      setPasso(2);
      return;
    }

    // Se a turma está LIVRE e o usuário é um professor, vincula definitivamente
    if (!codigoTurma && !isGestao && onVincularTurma) {
      const confirmar = window.confirm(
        `Deseja assumir a turma ${turma.nome}? A partir de agora, ela ficará vinculada a si e apenas você poderá lançar notas nela.`,
      );

      if (!confirmar) {
        return;
      }

      try {
        await onVincularTurma(turma.id, {
          codigo: user.codigo,
          nome: user.nome,
        });
      } catch (error) {
        console.error("Erro ao vincular turma:", error);
        alert("Erro ao vincular a turma. Tente novamente.");
        return;
      }
    }

    setTurmaSelecionadaId(turma.id);
    setSimuladoSelecionadoId(idSimulado);
    setPasso(2);
  };

  const handleVoltarSelecao = () => {
    setPasso(1);
    setTurmaSelecionadaId("");
    setSimuladoSelecionadoId("");
    setAlunoAtivo(null);
    setRespostasProfessor({});
  };

  const handleSelecionarAluno = (nomeAluno) => {
    // BLOQUEIO RIGOROSO: Se não tiver permissão, impede absolutamente de abrir para edição
    if (!temPermissaoEdicao(turmaAtiva)) {
      alert(
        "Acesso negado. Esta turma pertence a outro aplicador e está em modo apenas leitura.",
      );
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
    if (!temPermissaoEdicao(turmaAtiva)) return;

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
    if (!temPermissaoEdicao(turmaAtiva)) return;

    if (
      window.confirm(
        `Tem a certeza que deseja limpar as marcações atuais de ${alunoAtivo}?`,
      )
    ) {
      setRespostasProfessor({});
    }
  };

  const handleExcluirRespostaAluno = async (registoId, nomeAluno) => {
    if (!temPermissaoEdicao(turmaAtiva)) {
      alert("Não tem permissão para excluir registos desta turma.");
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

    // BLOQUEIO RIGOROSO NO SUBMIT
    if (!temPermissaoEdicao(turmaAtiva)) {
      alert(
        "Ação negada! Você não tem permissão para lançar ou salvar notas nesta turma.",
      );
      return;
    }

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
        `Respostas guardadas com sucesso! ${alunoAtivo}: ${calculo.percentualGeral}% de acertos`,
      );
      setAlunoAtivo(null);
      setRespostasProfessor({});
    } catch (error) {
      console.error("Erro ao guardar respostas:", error);
    }
  };

  if (!bimestreSelecionado) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 border border-slate-200/80 max-w-3xl mx-auto mt-4 sm:mt-8 w-full">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border border-blue-100">
            <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-[#4b82f6]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-wide">
            Selecione o Bimestre
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 sm:mt-2">
            Identificado como: {user.nome} {isGestao && "(Gestão)"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {["1", "2", "3", "4"].map((b) => (
            <button
              key={b}
              onClick={() => setBimestreSelecionado(b)}
              className="p-5 sm:p-6 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-[#4b82f6] hover:bg-blue-50 transition-all group flex flex-col items-center cursor-pointer active:scale-[0.98]"
            >
              <span className="text-2xl sm:text-3xl font-black text-slate-700 group-hover:text-[#4b82f6] transition-colors">
                {b}º
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-[#4b82f6]">
                Bimestre
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5 lg:p-6 border border-slate-200/80 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0">
            <UserCheck className="text-slate-600 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-800 leading-tight truncate">
              Lançamento de <span className="text-[#4b82f6]">Notas</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                {bimestreSelecionado}º BIMESTRE
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">
                {user.nome} {isGestao && "(Gestão)"}
              </span>
            </div>
          </div>
        </div>

        {passo === 1 && (
          <button
            onClick={() => setBimestreSelecionado(null)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trocar Bimestre
          </button>
        )}
      </div>

      {passo === 1 && (
        <div className="space-y-4">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Selecione uma Turma e um Simulado</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {turmas.map((turma) => {
              const idsSimuladosDoBimestre =
                turma.simuladosVinculados?.[bimestreSelecionado] || [];

              const codigoTurma = turma.professorVinculadoCodigo
                ? String(turma.professorVinculadoCodigo).trim().toUpperCase()
                : "";
              const codigoUsuario = user?.codigo
                ? String(user.codigo).trim().toUpperCase()
                : "";

              const meuDono =
                !codigoTurma || codigoTurma === codigoUsuario || isGestao;

              return (
                <div
                  key={turma.id}
                  className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-colors"
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <h4 className="font-black text-slate-800 uppercase tracking-wide text-xs sm:text-sm truncate">
                        {turma.nome}
                      </h4>
                      {codigoTurma ? (
                        meuDono ? (
                          <Lock
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 ml-1"
                            title="Sua Turma"
                          />
                        ) : (
                          <Lock
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0 ml-1"
                            title="Turma de Outro Aplicador (Apenas Leitura)"
                          />
                        )
                      ) : (
                        <Unlock
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0 ml-1"
                          title="Turma Livre"
                        />
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">
                      Aplicador:{" "}
                      <span
                        className={
                          turma.professorVinculadoNome
                            ? "text-slate-700"
                            : "text-emerald-600"
                        }
                      >
                        {turma.professorVinculadoNome || "Livre"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-200/60 pt-3 mt-auto">
                    {idsSimuladosDoBimestre.length === 0 ? (
                      <p className="text-[9px] sm:text-[10px] font-bold text-orange-500 uppercase bg-orange-50 p-2 rounded text-center border border-orange-100">
                        Nenhum simulado no {bimestreSelecionado}º Bim
                      </p>
                    ) : (
                      idsSimuladosDoBimestre.map((simId) => {
                        const simObj = simulados.find((s) => s.id === simId);
                        return (
                          <button
                            key={simId}
                            onClick={() => handleEntrarNaTurma(turma, simId)}
                            className={`w-full py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                              meuDono
                                ? "bg-[#4b82f6] hover:bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          >
                            <span className="truncate">
                              {simObj?.nome || "Simulado Desconhecido"}
                            </span>
                            {meuDono ? (
                              <Edit3 className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <Eye
                                className="w-3.5 h-3.5 flex-shrink-0 text-slate-500"
                                title="Apenas Leitura"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {turmas.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-400 text-xs font-bold uppercase border-2 border-dashed border-slate-200 rounded-xl">
                Nenhuma turma cadastrada.
              </div>
            )}
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Turma Ativa{" "}
                {!temPermissaoEdicao(turmaAtiva) && (
                  <span className="text-red-500 font-bold">
                    (Modo Apenas Leitura)
                  </span>
                )}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-wide truncate">
                {turmaAtiva?.nome}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5 flex-wrap">
                Simulado:{" "}
                <strong className="text-[#4b82f6] bg-blue-50 px-2 py-0.5 rounded truncate max-w-[200px] sm:max-w-none">
                  {simuladoAtivo?.nome}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleVoltarSelecao}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] sm:text-[11px] shadow-xs w-full sm:w-auto cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar às Turmas
            </button>
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
                        const temPermissao = temPermissaoEdicao(turmaAtiva);

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
                  Guardar Respostas do Aluno
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
