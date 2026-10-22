import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  deleteField,
} from "firebase/firestore";

export function useFirebase() {
  const [simulados, setSimulados] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [respostasAlunos, setRespostasAlunos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSimulados = onSnapshot(
      collection(db, "simulados"),
      (snapshot) => {
        setSimulados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Erro ao carregar simulados:", error),
    );

    const unsubTurmas = onSnapshot(
      collection(db, "turmas"),
      (snapshot) => {
        setTurmas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Erro ao carregar turmas:", error),
    );

    const unsubUsuarios = onSnapshot(
      collection(db, "usuarios"),
      (snapshot) => {
        setUsuarios(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Erro ao carregar usuários:", error),
    );

    const unsubRespostas = onSnapshot(
      collection(db, "respostas_alunos"),
      (snapshot) => {
        setRespostasAlunos(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar respostas dos alunos:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubSimulados();
      unsubTurmas();
      unsubUsuarios();
      unsubRespostas();
    };
  }, []);

  const salvarSimulado = async (simulado) => {
    try {
      if (simulado.id) {
        await setDoc(doc(db, "simulados", String(simulado.id)), simulado, {
          merge: true,
        });
      } else {
        await addDoc(collection(db, "simulados"), simulado);
      }
    } catch (error) {
      console.error("Erro ao salvar simulado:", error);
      throw error;
    }
  };

  const deletarSimulado = async (id) => {
    try {
      await deleteDoc(doc(db, "simulados", String(id)));
    } catch (error) {
      console.error("Erro ao deletar simulado:", error);
      throw error;
    }
  };

  const salvarTurma = async (turmasAtualizadas) => {
    try {
      const listaTurmas = Array.isArray(turmasAtualizadas)
        ? turmasAtualizadas
        : [turmasAtualizadas];

      const promessas = listaTurmas
        .filter((turma) => turma && turma.id)
        .map(async (turma) => {
          const turmaRef = doc(db, "turmas", String(turma.id));
          const dadosTurma = {
            nome: turma.nome || "",
            alunos: turma.alunos || [],
            professoresVinculados: turma.professoresVinculados || [],
            aplicadoresPorSimulado: turma.aplicadoresPorSimulado || {},
            simuladosVinculados: turma.simuladosVinculados || {
              1: [],
              2: [],
              3: [],
              4: [],
            },
          };
          await setDoc(turmaRef, dadosTurma, { merge: true });
        });

      await Promise.all(promessas);
    } catch (error) {
      console.error("Erro ao salvar turma(s):", error);
      throw error;
    }
  };

  const vincularTurmaSimulado = async (turmaId, simuladoId, professor) => {
    try {
      const turmaRef = doc(db, "turmas", String(turmaId));

      if (!professor) {
        await setDoc(
          turmaRef,
          {
            aplicadoresPorSimulado: {
              [simuladoId]: deleteField(),
            },
          },
          { merge: true },
        );
      } else {
        const turmaAtual = turmas.find((t) => String(t.id) === String(turmaId));
        const aplicadoresAtuais = turmaAtual?.aplicadoresPorSimulado || {};

        const novosAplicadores = {
          ...aplicadoresAtuais,
          [simuladoId]: {
            codigo: professor.codigo,
            nome: professor.nome,
          },
        };

        await setDoc(
          turmaRef,
          {
            aplicadoresPorSimulado: novosAplicadores,
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.error("Erro ao vincular/desvincular aplicador:", error);
      throw error;
    }
  };

  const deletarTurma = async (id) => {
    try {
      await deleteDoc(doc(db, "turmas", String(id)));
    } catch (error) {
      console.error("Erro ao deletar turma:", error);
      throw error;
    }
  };

  const salvarUsuarios = async (usuariosAtualizados) => {
    try {
      const listaUsuarios = Array.isArray(usuariosAtualizados)
        ? usuariosAtualizados
        : [usuariosAtualizados];

      const promessas = listaUsuarios
        .filter((usuario) => usuario && usuario.id)
        .map(async (usuario) => {
          const userRef = doc(db, "usuarios", String(usuario.id));
          const dadosUsuario = {
            codigo: usuario.codigo,
            nome: usuario.nome || "",
            cargo: usuario.cargo || "PROFESSOR",
            senha: usuario.senha || "",
          };
          await setDoc(userRef, dadosUsuario, { merge: true });
        });

      await Promise.all(promessas);
    } catch (error) {
      console.error("Erro ao salvar usuário(s):", error);
      throw error;
    }
  };

  const deletarUsuario = async (id) => {
    try {
      await deleteDoc(doc(db, "usuarios", String(id)));
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      throw error;
    }
  };

  const salvarRespostaAluno = async (registo, userLogado, turmasAtuais) => {
    try {
      const cargoUpper = String(userLogado?.cargo || "")
        .trim()
        .toUpperCase();
      const isCargoGestao =
        cargoUpper === "GESTAO" ||
        cargoUpper === "ADMIN" ||
        cargoUpper === "DIRETOR" ||
        cargoUpper === "COORDENADOR";

      if (userLogado && !isCargoGestao && turmasAtuais) {
        const turmaCorrespondente = turmasAtuais.find(
          (t) =>
            String(t.nome).trim().toUpperCase() ===
            String(registo.turma).trim().toUpperCase(),
        );

        if (turmaCorrespondente && turmaCorrespondente.aplicadoresPorSimulado) {
          const dadosAplicadorSimulado =
            turmaCorrespondente.aplicadoresPorSimulado[registo.simuladoId];

          if (dadosAplicadorSimulado && dadosAplicadorSimulado.codigo) {
            const donoCodigo = String(dadosAplicadorSimulado.codigo)
              .trim()
              .toUpperCase();
            const meuCodigo = String(userLogado.codigo).trim().toUpperCase();

            if (donoCodigo !== meuCodigo) {
              throw new Error(
                "Acesso negado: Este simulado nesta turma pertence a outro aplicador.",
              );
            }
          }
        }
      }

      const idLimpo =
        `${registo.simuladoId}_${registo.turma}_${registo.nomeAluno}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();

      const dadosSanitizados = JSON.parse(JSON.stringify(registo));
      const docRef = doc(db, "respostas_alunos", idLimpo);
      await setDoc(docRef, dadosSanitizados, { merge: true });
    } catch (error) {
      console.error("Erro de permissão ou salvamento:", error);
      throw error;
    }
  };

  const deletarRespostaAluno = async (id) => {
    try {
      await deleteDoc(doc(db, "respostas_alunos", String(id)));
    } catch (error) {
      console.error("Erro ao deletar resposta do aluno:", error);
      throw error;
    }
  };

  return {
    simulados,
    turmas,
    respostasAlunos,
    usuarios,
    loading,
    salvarSimulado,
    deletarSimulado,
    salvarTurma,
    vincularTurmaSimulado,
    deletarTurma,
    salvarUsuarios,
    deletarUsuario,
    salvarRespostaAluno,
    deletarRespostaAluno,
  };
}
