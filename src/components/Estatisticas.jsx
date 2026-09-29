import { useState } from "react";
import {
  BarChart3,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Filter,
  GraduationCap,
} from "lucide-react";

export default function Estatisticas({
  turmas = [],
  simulados = [],
  respostasAlunos = [],
}) {
  const [bimestreSelecionado, setBimestreSelecionado] = useState("3");
  const [visaoSelecionada, setVisaoSelecionada] = useState("geral");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [simuladoFiltroTurma, setSimuladoFiltroTurma] = useState("geral");
  const [anoSelecionadoFiltro, setAnoSelecionadoFiltro] = useState("");
  const [turmaDestaqueId, setTurmaDestaqueId] = useState("");

  const isAlunoAdaptado = (nomeAluno, nomeTurma) => {
    if (!nomeAluno || !nomeTurma) return false;
    const turmaObj = turmas.find(
      (t) =>
        String(t.nome).trim().toUpperCase() ===
        String(nomeTurma).trim().toUpperCase(),
    );
    if (!turmaObj || !Array.isArray(turmaObj.alunos)) return false;

    const alunoEncontrado = turmaObj.alunos.find((a) => {
      const nome = typeof a === "string" ? a : a.nome;
      return (
        String(nome).trim().toUpperCase() ===
        String(nomeAluno).trim().toUpperCase()
      );
    });

    return typeof alunoEncontrado === "object" && !!alunoEncontrado.adaptado;
  };

  const simuladosDoBimestre = simulados.filter((s) => {
    const matchBimestre =
      String(s.bimestre) === String(bimestreSelecionado) || !s.bimestre;
    const nomeSim = String(s.nome || s.titulo || "").toUpperCase();
    const isAdaptadoFlag = typeof s.adaptado === "boolean" && s.adaptado;
    return matchBimestre && !isAdaptadoFlag && !nomeSim.includes("ADAPTADO");
  });

  const simuladosSegundaIds = simuladosDoBimestre
    .filter((s) => {
      const nome = String(s.nome || s.titulo || "").toUpperCase();
      return (
        nome.includes("SEGUNDA") ||
        nome.includes("DIA 1") ||
        nome.includes("SIM I") ||
        (!nome.includes("TERÇA") &&
          !nome.includes("DIA 2") &&
          !nome.includes("SIM II"))
      );
    })
    .map((s) => String(s.id));

  const simuladosTercaIds = simuladosDoBimestre
    .filter((s) => {
      const nome = String(s.nome || s.titulo || "").toUpperCase();
      return (
        nome.includes("TERÇA") ||
        nome.includes("DIA 2") ||
        nome.includes("SIM II")
      );
    })
    .map((s) => String(s.id));

  const simuladoIdsDoBimestre = simuladosDoBimestre.map((s) => String(s.id));

  let idsSimuladosVisao = simuladoIdsDoBimestre;
  if (visaoSelecionada === "segunda") {
    idsSimuladosVisao = simuladosSegundaIds;
  } else if (visaoSelecionada === "terca") {
    idsSimuladosVisao = simuladosTercaIds;
  }

  let respostasFiltradas = respostasAlunos.filter((r) => {
    const simId = String(r.simuladoId || r.idSimulado || "");
    return idsSimuladosVisao.includes(simId);
  });

  const turmaAtiva = turmas.find(
    (t) => String(t.id) === String(turmaSelecionadaId),
  );

  if (visaoSelecionada === "turma" && turmaAtiva) {
    respostasFiltradas = respostasFiltradas.filter(
      (r) =>
        String(r.turmaId) === String(turmaAtiva.id) ||
        String(r.turma).trim().toUpperCase() ===
          String(turmaAtiva.nome).trim().toUpperCase(),
    );

    if (simuladoFiltroTurma !== "geral") {
      respostasFiltradas = respostasFiltradas.filter(
        (r) =>
          String(r.simuladoId || r.idSimulado) === String(simuladoFiltroTurma),
      );
    }
  }

  const idsSimuladosVinculadosTurma =
    turmaAtiva?.simuladosVinculados?.[bimestreSelecionado] || [];
  const simuladosVinculadosObj = simuladosDoBimestre.filter((s) =>
    idsSimuladosVinculadosTurma.includes(s.id),
  );

  const respostasValidasParaMedia = respostasFiltradas.filter(
    (r) => !isAlunoAdaptado(r.nomeAluno || r.aluno, r.turma),
  );

  // Mapeamento e consolidação de desempenho dos alunos (agrupando os dois simulados)
  const mapaAlunos = {};
  respostasValidasParaMedia.forEach((r) => {
    const nome = String(r.nomeAluno || r.aluno || "").trim();
    const turma = String(r.turma || "").trim();
    if (!nome) return;

    const chave = `${turma}_${nome}`.toUpperCase();
    if (!mapaAlunos[chave]) {
      mapaAlunos[chave] = {
        nome,
        turma,
        somaPercentual: 0,
        totalProvas: 0,
        ultimaNota: r.notaFinal || "0.0",
      };
    }
    mapaAlunos[chave].somaPercentual += Number(r.percentualGeral || 0);
    mapaAlunos[chave].totalProvas += 1;
    if (r.notaFinal) mapaAlunos[chave].ultimaNota = r.notaFinal;
  });

  const desempenhoAlunosMap = Object.values(mapaAlunos).map((item) => ({
    ...item,
    percentualMedio:
      item.totalProvas > 0
        ? Math.round(item.somaPercentual / item.totalProvas)
        : 0,
  }));

  let melhorAlunoGeral = null;
  desempenhoAlunosMap.forEach((aluno) => {
    if (
      !melhorAlunoGeral ||
      aluno.percentualMedio > melhorAlunoGeral.percentual
    ) {
      melhorAlunoGeral = {
        nome: aluno.nome,
        turma: aluno.turma,
        percentual: aluno.percentualMedio,
        nota: aluno.ultimaNota,
      };
    }
  });

  // Geração dos Anos/Séries formatados
  const setAnos = new Set();
  turmas.forEach((t) => {
    const nomeTurma = String(t.nome || "")
      .trim()
      .toUpperCase();

    if (nomeTurma.includes("EJA")) {
      if (nomeTurma.includes("5") || nomeTurma.includes("6")) {
        setAnos.add("5ª/6ª EJA");
        return;
      }
      if (nomeTurma.includes("7") || nomeTurma.includes("8")) {
        setAnos.add("7ª/8ª EJA");
        return;
      }
    }

    const match = nomeTurma.match(/^(\d+º?\s*(ANO|SÉRIE)?)/i);
    if (match) {
      let val = match[1].trim();
      if (val === "5") val = "5ª/6ª EJA";
      if (val === "7") val = "7ª/8ª EJA";
      setAnos.add(val);
    } else {
      const primeiraPalavra = nomeTurma.split(" ")[0];
      if (primeiraPalavra === "5") {
        setAnos.add("5ª/6ª EJA");
      } else if (primeiraPalavra === "7") {
        setAnos.add("7ª/8ª EJA");
      } else if (primeiraPalavra) {
        setAnos.add(primeiraPalavra);
      }
    }
  });
  const anosDisponiveis = Array.from(setAnos).sort();

  let melhorAlunoPorAno = null;
  if (anoSelecionadoFiltro) {
    const alunosDoAno = desempenhoAlunosMap.filter((aluno) => {
      const turmaUpper = String(aluno.turma || "").toUpperCase();
      if (anoSelecionadoFiltro === "5ª/6ª EJA") {
        return (
          turmaUpper.includes("5") &&
          turmaUpper.includes("6") &&
          turmaUpper.includes("EJA")
        );
      }
      if (anoSelecionadoFiltro === "7ª/8ª EJA") {
        return (
          turmaUpper.includes("7") &&
          turmaUpper.includes("8") &&
          turmaUpper.includes("EJA")
        );
      }
      return turmaUpper.includes(anoSelecionadoFiltro.toUpperCase());
    });

    alunosDoAno.forEach((aluno) => {
      if (
        !melhorAlunoPorAno ||
        aluno.percentualMedio > melhorAlunoPorAno.percentual
      ) {
        melhorAlunoPorAno = {
          nome: aluno.nome,
          turma: aluno.turma,
          percentual: aluno.percentualMedio,
          nota: aluno.ultimaNota,
        };
      }
    });
  }

  let melhorAlunoDaTurmaDestaque = null;
  if (turmaDestaqueId) {
    const turmaObj = turmas.find(
      (t) => String(t.id) === String(turmaDestaqueId),
    );
    if (turmaObj) {
      const alunosDaTurma = desempenhoAlunosMap.filter(
        (aluno) =>
          String(aluno.turma).trim().toUpperCase() ===
          String(turmaObj.nome).trim().toUpperCase(),
      );

      alunosDaTurma.forEach((aluno) => {
        if (
          !melhorAlunoDaTurmaDestaque ||
          aluno.percentualMedio > melhorAlunoDaTurmaDestaque.percentual
        ) {
          melhorAlunoDaTurmaDestaque = {
            nome: aluno.nome,
            percentual: aluno.percentualMedio,
            nota: aluno.ultimaNota,
          };
        }
      });
    }
  }

  const estatisticasPorTurma = turmas.map((t) => {
    const respTurmaValidas = respostasValidasParaMedia.filter(
      (r) =>
        String(r.turmaId) === String(t.id) ||
        String(r.turma).trim().toUpperCase() ===
          String(t.nome).trim().toUpperCase(),
    );

    if (respTurmaValidas.length === 0) {
      return {
        nome: t.nome,
        mediaAcertos: 0,
        mediaErros: 100,
        totalRespostas: 0,
      };
    }

    const somaPercentual = respTurmaValidas.reduce(
      (acc, r) => acc + Number(r.percentualGeral || 0),
      0,
    );
    const mediaAcertos = Math.round(somaPercentual / respTurmaValidas.length);
    const mediaErros = 100 - mediaAcertos;

    return {
      nome: t.nome,
      mediaAcertos,
      mediaErros,
      totalRespostas: respTurmaValidas.length,
    };
  });

  let turmaDestaqueGeral = null;
  estatisticasPorTurma.forEach((et) => {
    if (
      et.totalRespostas > 0 &&
      (!turmaDestaqueGeral || et.mediaAcertos > turmaDestaqueGeral.mediaAcertos)
    ) {
      turmaDestaqueGeral = et;
    }
  });

  const disciplinasStats = {};
  respostasValidasParaMedia.forEach((r) => {
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

  const somaTurma = respostasValidasParaMedia.reduce(
    (acc, r) => acc + Number(r.percentualGeral || 0),
    0,
  );
  const mediaAcertosTurma =
    respostasValidasParaMedia.length > 0
      ? Math.round(somaTurma / respostasValidasParaMedia.length)
      : 0;
  const mediaErrosTurma = 100 - mediaAcertosTurma;

  const calcularEvolucaoAluno = (nomeAluno, bimestreAtual, percentualAtual) => {
    const bimestreAntNum = Number(bimestreAtual) - 1;
    if (bimestreAntNum < 1) return null;

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

    if (respostasAntigas.length === 0) return null;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md border border-[#dbc8b6]">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Bimestre:
          </label>
          <select
            value={bimestreSelecionado}
            onChange={(e) => setBimestreSelecionado(e.target.value)}
            className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> Filtro de dados:
          </label>
          <select
            value={visaoSelecionada}
            onChange={(e) => {
              setVisaoSelecionada(e.target.value);
              setSimuladoFiltroTurma("geral");
            }}
            className="w-full p-2 bg-white border border-[#dbc8b6] rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="geral">Geral</option>
            <option value="segunda">Segunda-feira</option>
            <option value="terca">Terça-feira</option>
            <option value="turma">Por Turma</option>
          </select>
        </div>
      </div>

      {visaoSelecionada === "turma" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-md border border-amber-200">
          <div>
            <label className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-1 block">
              Selecione a Turma:
            </label>
            <select
              value={turmaSelecionadaId}
              onChange={(e) => {
                setTurmaSelecionadaId(e.target.value);
                setSimuladoFiltroTurma("geral");
              }}
              className="w-full p-2 bg-white border border-amber-300 rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none shadow-xs cursor-pointer"
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
            <label className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-1 block">
              Simulado Específico:
            </label>
            <select
              value={simuladoFiltroTurma}
              onChange={(e) => setSimuladoFiltroTurma(e.target.value)}
              disabled={!turmaAtiva}
              className="w-full p-2 bg-white border border-amber-300 rounded-md text-xs font-bold text-gray-800 uppercase focus:outline-none shadow-xs cursor-pointer disabled:bg-gray-100"
            >
              <option value="geral">Geral da Turma</option>
              {simuladosVinculadosObj.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.nome || sim.titulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Destaque Individual
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

          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />{" "}
                Destaque por Ano
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={anoSelecionadoFiltro}
                onChange={(e) => setAnoSelecionadoFiltro(e.target.value)}
                className="w-full p-1 bg-white border border-indigo-300 rounded text-[11px] font-bold text-gray-800 uppercase focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="">Selecione o ano...</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>

              {!anoSelecionadoFiltro ? (
                <p className="text-[11px] text-gray-400 italic text-center py-1">
                  Escolha um ano acima.
                </p>
              ) : melhorAlunoPorAno ? (
                <div className="pt-1">
                  <h4 className="font-bold text-gray-900 text-xs uppercase truncate">
                    {melhorAlunoPorAno.nome}
                  </h4>
                  <p className="text-[10px] text-indigo-700 font-semibold uppercase">
                    Turma: {melhorAlunoPorAno.turma}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-indigo-900">
                      {melhorAlunoPorAno.percentual}%
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                      Nota: {melhorAlunoPorAno.nota}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic text-center py-1">
                  Sem dados para este ano.
                </p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Destaque por
                Turma
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={turmaDestaqueId}
                onChange={(e) => setTurmaDestaqueId(e.target.value)}
                className="w-full p-1 bg-white border border-amber-300 rounded text-[11px] font-bold text-gray-800 uppercase focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
              >
                <option value="">Selecione a turma...</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>

              {!turmaDestaqueId ? (
                <p className="text-[11px] text-gray-400 italic text-center py-1">
                  Escolha uma turma acima.
                </p>
              ) : melhorAlunoDaTurmaDestaque ? (
                <div className="pt-1">
                  <h4 className="font-bold text-gray-900 text-xs uppercase truncate">
                    {melhorAlunoDaTurmaDestaque.nome}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-amber-800">
                      Aproveitamento: {melhorAlunoDaTurmaDestaque.percentual}%
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                      Nota: {melhorAlunoDaTurmaDestaque.nota}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic text-center py-1">
                  Sem lançamentos nesta turma.
                </p>
              )}
            </div>
          </div>
        </div>

        {visaoSelecionada !== "turma" && (
          <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-gray-50 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Média por turma
              (%) -{" "}
              {visaoSelecionada === "geral"
                ? "Geral"
                : visaoSelecionada === "segunda"
                  ? "Segunda-feira (SIM I)"
                  : "Terça-feira (SIM II)"}
            </h3>
            <div className="space-y-3 bg-white p-3 rounded-md border border-[#dbc8b6]">
              {estatisticasPorTurma.map((et) => (
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
        )}

        {visaoSelecionada === "turma" && (
          <div className="space-y-4">
            {!turmaAtiva ? (
              <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md bg-gray-50">
                Selecione uma turma acima para analisar o desempenho detalhado.
              </div>
            ) : (
              <>
                <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-gray-50 space-y-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    Média proporcional ({turmaAtiva.nome})
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

                <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-white space-y-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Média de
                    desempenho dos alunos
                  </h3>

                  {respostasFiltradas.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase border border-dashed border-[#dbc8b6] rounded-md">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {respostasFiltradas.map((resp, i) => {
                        const nomeAluno = resp.nomeAluno || resp.aluno;
                        const adaptado = isAlunoAdaptado(
                          nomeAluno,
                          turmaAtiva?.nome,
                        );
                        const perc = Number(resp.percentualGeral || 0);
                        const erro = 100 - perc;
                        const evolucao = calcularEvolucaoAluno(
                          nomeAluno,
                          bimestreSelecionado,
                          perc,
                        );

                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-800">
                              <span
                                className="truncate flex items-center gap-1.5"
                                title={nomeAluno}
                              >
                                {nomeAluno}
                                {adaptado && (
                                  <span className="bg-orange-50 text-orange-700 border border-orange-200 px-1 py-0.2 rounded text-[8px] font-bold">
                                    Adaptado
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-2 text-[10px]">
                                {evolucao && (
                                  <>
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
                                  </>
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
              </>
            )}
          </div>
        )}

        <div className="border border-[#dbc8b6] rounded-md p-3 sm:p-4 bg-white space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
            Média por disciplina (
            {visaoSelecionada === "geral"
              ? "Geral"
              : visaoSelecionada === "segunda"
                ? "Segunda-feira"
                : visaoSelecionada === "terca"
                  ? "Terça-feira"
                  : turmaAtiva?.nome || "Turma"}
            )
          </h3>
          {disciplinasGrafico.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">
              Sem dados de disciplinas disponíveis para esta seleção.
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
    </div>
  );
}
