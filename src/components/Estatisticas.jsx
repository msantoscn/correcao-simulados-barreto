import { useState } from "react";
import {
  BarChart3,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Percent,
} from "lucide-react";

export default function Estatisticas({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [bimestreSelecionado, setBimestreSelecionado] = useState("3");
  const [subAba, setSubAba] = useState("geral"); // "geral" | "turma"

  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoFiltroTurma, setSimuladoFiltroTurma] = useState("geral"); // "geral" ou ID do simulado

  // Filtra os simulados do bimestre escolhido
  const simuladosDoBimestre = simulados.filter(
    (s) => String(s.bimestre) === String(bimestreSelecionado) || !s.bimestre,
  );
  const simuladoIdsDoBimestre = simuladosDoBimestre.map((s) => String(s.id));

  // Respostas do bimestre selecionado
  const respostasFiltradas = respostasAlunos.filter((r) => {
    const simId = String(r.simuladoId || r.idSimulado || "");
    return simuladoIdsDoBimestre.includes(simId);
  });

  const turmaAtiva = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );

  // Simulados vinculados à turma ativa no bimestre atual
  const idsSimuladosVinculadosTurma =
    turmaAtiva?.simuladosVinculados?.[bimestreSelecionado] || [];
  const simuladosVinculadosObj = simuladosDoBimestre.filter((s) =>
    idsSimuladosVinculadosTurma.includes(s.id),
  );

  // ==========================================
  // 1. DADOS DA ABA GERAL
  // ==========================================
  let melhorAlunoGeral = null;
  respostasFiltradas.forEach((r) => {
    const percentual = Number(r.percentualGeral || 0);
    if (!melhorAlunoGeral || percentual > melhorAlunoGeral.percentual) {
      melhorAlunoGeral = {
        nome: r.nomeAluno || r.aluno,
        turma: r.turma,
        percentual,
        nota: r.notaFinal || "0.0",
      };
    }
  });

  const estatisticasPorTurmaGeral = turmas.map((t) => {
    const respTurma = respostasFiltradas.filter(
      (r) =>
        String(r.turmaId) === String(t.id) ||
        String(r.turma).trim().toUpperCase() ===
          String(t.nome).trim().toUpperCase(),
    );

    if (respTurma.length === 0) {
      return {
        nome: t.nome,
        mediaAcertos: 0,
        mediaErros: 100,
        totalRespostas: 0,
      };
    }

    const somaPercentual = respTurma.reduce(
      (acc, r) => acc + Number(r.percentualGeral || 0),
      0,
    );
    const mediaAcertos = Math.round(somaPercentual / respTurma.length);
    const mediaErros = 100 - mediaAcertos;

    return {
      nome: t.nome,
      mediaAcertos,
      mediaErros,
      totalRespostas: respTurma.length,
    };
  });

  let turmaDestaqueGeral = null;
  estatisticasPorTurmaGeral.forEach((et) => {
    if (
      et.totalRespostas > 0 &&
      (!turmaDestaqueGeral || et.mediaAcertos > turmaDestaqueGeral.mediaAcertos)
    ) {
      turmaDestaqueGeral = et;
    }
  });

  // Cálculo da Média Geral de Aproveitamento da Escola no Bimestre
  const somaGeralEscola = respostasFiltradas.reduce(
    (acc, r) => acc + Number(r.percentualGeral || 0),
    0,
  );
  const mediaGeralEscola =
    respostasFiltradas.length > 0
      ? Math.round(somaGeralEscola / respostasFiltradas.length)
      : 0;

  // ==========================================
  // 2. DADOS DA ABA POR TURMA
  // ==========================================
  let respostasDaTurma = turmaAtiva
    ? respostasFiltradas.filter(
        (r) =>
          String(r.turmaId) === String(turmaAtiva.id) ||
          String(r.turma).trim().toUpperCase() ===
            String(turmaAtiva.nome).trim().toUpperCase(),
      )
    : [];

  if (simuladoFiltroTurma !== "geral") {
    respostasDaTurma = respostasDaTurma.filter(
      (r) =>
        String(r.simuladoId || r.idSimulado) === String(simuladoFiltroTurma),
    );
  }

  // Estatísticas de Disciplinas proporcionais
  const disciplinasStats = {};
  respostasDaTurma.forEach((r) => {
    if (r.detalhes) {
      Object.entries(r.detalhes).forEach(([discNome, info]) => {
        if (info) {
          if (!disciplinasStats[discNome]) {
            disciplinasStats[discNome] = {
              acertosTotais: 0,
              questoesTotais: 0,
            };
          }
          disciplinasStats[discNome].acertosTotais += Number(info.acertos || 0);
          disciplinasStats[discNome].questoesTotais += Number(info.total || 0);
        }
      });
    }
  });

  const disciplinasGrafico = Object.entries(disciplinasStats).map(
    ([discNome, stats]) => {
      const acertos =
        stats.questoesTotais > 0
          ? Math.round((stats.acertosTotais / stats.questoesTotais) * 100)
          : 0;
      return {
        nome: discNome,
        acertos,
        erros: 100 - acertos,
      };
    },
  );

  const somaTurma = respostasDaTurma.reduce(
    (acc, r) => acc + Number(r.percentualGeral || 0),
    0,
  );
  const mediaAcertosTurma =
    respostasDaTurma.length > 0
      ? Math.round(somaTurma / respostasDaTurma.length)
      : 0;
  const mediaErrosTurma = 100 - mediaAcertosTurma;

  // Função para calcular evolução em relação a bimestres anteriores
  const calcularEvolucaoAluno = (nomeAluno, bimestreAtual, percentualAtual) => {
    const bimestreAntNum = Number(bimestreAtual) - 1;
    if (bimestreAntNum < 1)
      return { tipo: "neutro", texto: "Sem base anterior" };

    const simuladosBimAnt = simulados.filter(
      (s) => String(s.bimestre) === String(bimestreAntNum),
    );
    const idsBimAnt = simuladosBimAnt.map((s) => String(s.id));

    const respostasAntigas = respostasAlunos.filter((r) => {
      const simId = String(r.simuladoId || r.idSimulado || "");
      const mesmoAluno =
        String(r.nomeAluno || r.aluno)
          .trim()
          .toUpperCase() === String(nomeAluno).trim().toUpperCase();
      return idsBimAnt.includes(simId) && mesmoAluno;
    });

    if (respostasAntigas.length === 0)
      return { tipo: "neutro", texto: "Sem dados anteriores" };

    const somaAnt = respostasAntigas.reduce(
      (acc, r) => acc + Number(r.percentualGeral || 0),
      0,
    );
    const mediaAnt = somaAnt / respostasAntigas.length;

    const diferenca = percentualAtual - mediaAnt;
    if (diferenca > 2)
      return {
        tipo: "melhora",
        texto: `+${Math.round(diferenca)}% vs ${bimestreAntNum}º Bim`,
      };
    if (diferenca < -2)
      return {
        tipo: "piora",
        texto: `${Math.round(diferenca)}% vs ${bimestreAntNum}º Bim`,
      };
    return { tipo: "neutro", texto: `Estável vs ${bimestreAntNum}º Bim` };
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-3 sm:p-5 border border-[#dbc8b6] w-full max-w-7xl mx-auto font-sans antialiased space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dbc8b6] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-500 text-white rounded-md flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-gray-800 truncate">
            ESTATÍSTICAS E{" "}
            <span className="text-red-500 font-bold">DESEMPENHO</span>
          </h2>
        </div>
      </div>

      {/* FILTRO DE BIMESTRE E AS 2 ABAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Bimestre:
          </label>
          <select
            value={bimestreSelecionado}
            onChange={(e) => setBimestreSelecionado(e.target.value)}
            className="p-1.5 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-md border border-[#dbc8b6] shadow-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubAba("geral")}
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              subAba === "geral"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Geral
          </button>
          <button
            type="button"
            onClick={() => setSubAba("turma")}
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              subAba === "turma"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Por Turma
          </button>
        </div>
      </div>

      {/* =========================================================
          ABA 1: GERAL
          ========================================================= */}
      {subAba === "geral" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Destaque Individual Geral
                </span>
                <Award className="w-5 h-5 text-blue-500" />
              </div>
              {melhorAlunoGeral ? (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm uppercase truncate mb-0.5">
                    {melhorAlunoGeral.nome}
                  </h4>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">
                    Turma:{" "}
                    <span className="text-gray-800">
                      {melhorAlunoGeral.turma}
                    </span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-600">
                      Aproveitamento: {melhorAlunoGeral.percentual}%
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                      Nota: {melhorAlunoGeral.nota}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-3">
                  Sem dados registados.
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Turma com Melhor Média
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              {turmaDestaqueGeral ? (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm uppercase truncate mb-0.5">
                    {turmaDestaqueGeral.nome}
                  </h4>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">
                    Total de Provas:{" "}
                    <span className="text-gray-800">
                      {turmaDestaqueGeral.totalRespostas}
                    </span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700">Média de Acertos</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">
                      {turmaDestaqueGeral.mediaAcertos}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-3">
                  Sem dados registados.
                </p>
              )}
            </div>

            {/* Novo Indicador Importante: Aproveitamento Geral Médio da Escola */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Aproveitamento Geral Médio
                </span>
                <Percent className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-xl tracking-tight mb-0.5">
                  {mediaGeralEscola}%{" "}
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Acertos
                  </span>
                </h4>
                <p className="text-[10px] text-gray-500 uppercase font-semibold mt-1">
                  Base:{" "}
                  <span className="text-gray-800">
                    {respostasFiltradas.length} provas avaliadas
                  </span>
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-indigo-100 text-[10px] font-bold text-indigo-900 uppercase">
                Consolidado Escolar
              </div>
            </div>
          </div>

          <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-gray-50 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Média por turma
              (%)
            </h3>
            <div className="space-y-3 bg-white p-3 rounded-md border border-[#dbc8b6]">
              {estatisticasPorTurmaGeral.map((et) => (
                <div key={et.nome} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase text-gray-800">
                    <span>{et.nome}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex border border-[#dbc8b6] relative">
                    <div
                      style={{ width: `${et.mediaAcertos}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500 relative"
                    >
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                        {et.mediaAcertos}%
                      </span>
                    </div>
                    <div
                      style={{ width: `${et.mediaErros}%` }}
                      className="bg-red-400 h-full transition-all duration-500 relative"
                    >
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                        {et.mediaErros}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: POR TURMA
          ========================================================= */}
      {subAba === "turma" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Turma:
              </label>
              <select
                value={turmaSelecionadaId}
                onChange={(e) => {
                  setTurmaSelecionadaId(e.target.value);
                  setSimuladoFiltroTurma("geral");
                }}
                className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
              >
                <option value="">Escolha a turma...</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Simulados:
              </label>
              <select
                value={simuladoFiltroTurma}
                onChange={(e) => setSimuladoFiltroTurma(e.target.value)}
                disabled={!turmaAtiva}
                className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer disabled:bg-gray-100"
              >
                <option value="geral">Geral</option>
                {simuladosVinculadosObj.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.nome || sim.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!turmaAtiva ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
              Selecione uma turma acima para analisar o desempenho detalhado.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Média Proporcional (Nome da Turma removido do título) */}
              <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-gray-50 space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Média proporcional
                </h3>
                <div className="bg-white p-3 rounded-md border border-[#dbc8b6] space-y-2">
                  <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden flex border border-[#dbc8b6] relative">
                    <div
                      style={{ width: `${mediaAcertosTurma}%` }}
                      className="bg-emerald-500 h-full transition-all relative"
                    >
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-black">
                        {mediaAcertosTurma}%
                      </span>
                    </div>
                    <div
                      style={{ width: `${mediaErrosTurma}%` }}
                      className="bg-red-400 h-full transition-all relative"
                    >
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-black">
                        {mediaErrosTurma}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. MÉDIA DE DESEMPENHO DOS ALUNOS */}
              <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-white space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Média de
                  desempenho dos alunos
                </h3>

                {respostasDaTurma.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {respostasDaTurma.map((resp, i) => {
                      const perc = Number(resp.percentualGeral || 0);
                      const erro = 100 - perc;
                      const evolucao = calcularEvolucaoAluno(
                        resp.nomeAluno || resp.aluno,
                        bimestreSelecionado,
                        perc,
                      );

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-800">
                            <span
                              className="truncate"
                              title={resp.nomeAluno || resp.aluno}
                            >
                              {resp.nomeAluno || resp.aluno}
                            </span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-emerald-700 font-bold">
                                Nota: {resp.notaFinal || "0.0"}
                              </span>
                              {evolucao.tipo === "melhora" && (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {evolucao.texto}
                                </span>
                              )}
                              {evolucao.tipo === "piora" && (
                                <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                  {evolucao.texto}
                                </span>
                              )}
                              {evolucao.tipo === "neutro" && (
                                <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  {evolucao.texto}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex border border-[#dbc8b6] relative">
                            <div
                              style={{ width: `${perc}%` }}
                              className="bg-emerald-500 h-full relative"
                            >
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                                {perc}%
                              </span>
                            </div>
                            <div
                              style={{ width: `${erro}%` }}
                              className="bg-red-400 h-full relative"
                            >
                              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                                {erro}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. MÉDIA POR DISCIPLINA */}
              <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-white space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Média por disciplina
                </h3>
                {disciplinasGrafico.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    Sem dados de disciplinas disponíveis.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disciplinasGrafico.map((disc) => (
                      <div key={disc.nome} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase text-gray-800">
                          <span className="truncate" title={disc.nome}>
                            {disc.nome}
                          </span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex border border-[#dbc8b6] relative">
                          <div
                            style={{ width: `${disc.acertos}%` }}
                            className="bg-emerald-500 h-full transition-all relative"
                            title={`Acertos: ${disc.acertos}%`}
                          >
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                              {disc.acertos}%
                            </span>
                          </div>
                          <div
                            style={{ width: `${disc.erros}%` }}
                            className="bg-red-400 h-full transition-all relative"
                            title={`Erros: ${disc.erros}%`}
                          >
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                              {disc.erros}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
