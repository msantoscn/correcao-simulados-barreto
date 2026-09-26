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
    );

    const unsubTurmas = onSnapshot(collection(db, "turmas"), (snapshot) => {
      setTurmas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      setUsuarios(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubRespostas = onSnapshot(
      collection(db, "respostas_alunos"),
      (snapshot) => {
        setRespostasAlunos(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
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
    if (simulado.id) {
      await setDoc(doc(db, "simulados", simulado.id), simulado, {
        merge: true,
      });
    } else {
      await addDoc(collection(db, "simulados"), simulado);
    }
  };

  const deletarSimulado = async (id) => {
    await deleteDoc(doc(db, "simulados", id));
  };

  const salvarTurma = async (turmasAtualizadas) => {
    if (Array.isArray(turmasAtualizadas)) {
      for (const turma of turmasAtualizadas) {
        const turmaRef = doc(db, "turmas", String(turma.id));
        await setDoc(
          turmaRef,
          {
            nome: turma.nome,
            alunos: turma.alunos || [],
            aplicadoresPorSimulado: turma.aplicadoresPorSimulado || {},
            simuladosVinculados: turma.simuladosVinculados || {
              1: [],
              2: [],
              3: [],
              4: [],
            },
          },
          { merge: true },
        );
      }
    } else if (turmasAtualizadas && turmasAtualizadas.id) {
      const turmaRef = doc(db, "turmas", String(turmasAtualizadas.id));
      await setDoc(
        turmaRef,
        {
          nome: turmasAtualizadas.nome,
          alunos: turmasAtualizadas.alunos || [],
          aplicadoresPorSimulado:
            turmasAtualizadas.aplicadoresPorSimulado || {},
          simuladosVinculados: turmasAtualizadas.simuladosVinculados || {
            1: [],
            2: [],
            3: [],
            4: [],
          },
        },
        { merge: true },
      );
    }
  };

  // Vincula ou Desvincula o aplicador especificamente à Turma + Simulado
  const vincularTurmaSimulado = async (turmaId, simuladoId, professor) => {
    try {
      const turmaRef = doc(db, "turmas", String(turmaId));

      if (!professor) {
        // Se professor for null ou indefinido, desvincula utilizando deleteField() do Firestore
        await setDoc(
          turmaRef,
          {
            aplicadoresPorSimulado: {
              [simuladoId]: deleteField(),
            },
          },
          { merge: true },
        );
        console.log(
          `Simulado ${simuladoId} desvinculado com sucesso da turma ${turmaId}`,
        );
      } else {
        // Se for para vincular um professor
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
        console.log(
          `Turma ${turmaId} vinculada no simulado ${simuladoId} ao aplicador ${professor.nome}`,
        );
      }
    } catch (error) {
      console.error(
        "Erro ao vincular/desvincular aplicador ao simulado:",
        error,
      );
      throw error;
    }
  };

  const deletarTurma = async (id) => {
    await deleteDoc(doc(db, "turmas", String(id)));
  };

  const salvarUsuarios = async (usuariosAtualizados) => {
    if (Array.isArray(usuariosAtualizados)) {
      for (const usuario of usuariosAtualizados) {
        const userRef = doc(db, "usuarios", String(usuario.id));
        await setDoc(
          userRef,
          {
            codigo: usuario.codigo,
            nome: usuario.nome || "",
            cargo: usuario.cargo || "PROFESSOR",
            senha: usuario.senha || "",
          },
          { merge: true },
        );
      }
    } else if (usuariosAtualizados && usuariosAtualizados.id) {
      const userRef = doc(db, "usuarios", String(usuariosAtualizados.id));
      await setDoc(
        userRef,
        {
          codigo: usuariosAtualizados.codigo,
          nome: usuariosAtualizados.nome || "",
          cargo: usuariosAtualizados.cargo || "PROFESSOR",
          senha: usuariosAtualizados.senha || "",
        },
        { merge: true },
      );
    }
  };

  const deletarUsuario = async (id) => {
    await deleteDoc(doc(db, "usuarios", String(id)));
  };

  const salvarRespostaAluno = async (registo, userLogado, turmasAtuais) => {
    try {
      // Verificação inteligente e flexível do cargo de gestão/administração
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

      console.log("Sucesso absoluto! Gravado no Firestore com ID:", idLimpo);
    } catch (error) {
      console.error("Erro de permissão ao salvar no Firebase:", error);
      alert("Operação bloqueada: " + error.message);
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
