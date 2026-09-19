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

    // 3. Escuta a coleção de Respostas e Notas em tempo real
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

  // --- Operações para Turmas ---
  const salvarTurma = async (turma) => {
    if (turma.id) {
      await setDoc(doc(db, "turmas", turma.id), turma, { merge: true });
    } else {
      await addDoc(collection(db, "turmas"), turma);
    }
  };

  const deletarTurma = async (id) => {
    await deleteDoc(doc(db, "turmas", id));
  };

  // --- Operações para Respostas dos Alunos ---
  const salvarRespostaAluno = async (registo) => {
    // Gera um ID único baseado no simulado, turma e aluno para evitar duplicados
    const docId = `${registo.simuladoId}_${registo.turma}_${registo.nomeAluno}`
      .replace(/\s+/g, "_")
      .toLowerCase();

    await setDoc(doc(db, "respostas_alunos", docId), registo);
  };

  return {
    simulados,
    turmas,
    respostasAlunos,
    loading,
    salvarSimulado,
    deletarSimulado,
    salvarTurma,
    deletarTurma,
    salvarRespostaAluno,
  };
}
