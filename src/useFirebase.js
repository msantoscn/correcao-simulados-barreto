import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

export function useFirebase() {
  const [simulados, setSimulados] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [respostasAlunos, setRespostasAlunos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Escuta a coleção de Simulados em tempo real
    const unsubSimulados = onSnapshot(
      collection(db, "simulados"),
      (snapshot) => {
        setSimulados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );

    // 2. Escuta a coleção de Turmas em tempo real
    const unsubTurmas = onSnapshot(collection(db, "turmas"), (snapshot) => {
      setTurmas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 3. Escuta a coleção de Usuários (Acessos) em tempo real
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      setUsuarios(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 4. Escuta a coleção de Respostas e Notas em tempo real
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

  // --- Operações para Simulados ---
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

  // --- Operações para Turmas (Agora salva o professor vinculado) ---
  const salvarTurma = async (turmasAtualizadas) => {
    if (Array.isArray(turmasAtualizadas)) {
      for (const turma of turmasAtualizadas) {
        const turmaRef = doc(db, "turmas", String(turma.id));
        await setDoc(
          turmaRef,
          {
            nome: turma.nome,
            alunos: turma.alunos || [],
            professorVinculadoCodigo: turma.professorVinculadoCodigo || null,
            professorVinculadoNome: turma.professorVinculadoNome || null,
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
          professorVinculadoCodigo:
            turmasAtualizadas.professorVinculadoCodigo || null,
          professorVinculadoNome:
            turmasAtualizadas.professorVinculadoNome || null,
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

  // Nova função específica para vincular o professor à turma livre
  const vincularTurma = async (turmaId, professor) => {
    try {
      const turmaRef = doc(db, "turmas", String(turmaId));
      await setDoc(
        turmaRef,
        {
          professorVinculadoCodigo: professor.codigo,
          professorVinculadoNome: professor.nome,
        },
        { merge: true },
      );
      console.log(
        `Turma ${turmaId} vinculada com sucesso ao professor ${professor.nome}`,
      );
    } catch (error) {
      console.error("Erro ao vincular turma:", error);
      throw error;
    }
  };

  const deletarTurma = async (id) => {
    await deleteDoc(doc(db, "turmas", String(id)));
  };

  // --- Operações para Usuários (Lista VIP) ---
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

  // --- Operações para Respostas dos Alunos ---
  const salvarRespostaAluno = async (registo) => {
    try {
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
      console.error("Erro detalhado ao salvar no Firebase:", error);
      alert("Erro ao gravar no Firebase: " + error.message);
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
    vincularTurma, // <--- Exportado aqui
    deletarTurma,
    salvarUsuarios,
    deletarUsuario,
    salvarRespostaAluno,
  };
}
