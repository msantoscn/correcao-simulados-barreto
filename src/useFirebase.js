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
  const salvarTurma = async (turmasAtualizadas) => {
    if (Array.isArray(turmasAtualizadas)) {
      for (const turma of turmasAtualizadas) {
        const turmaRef = doc(db, "turmas", String(turma.id));
        await setDoc(
          turmaRef,
          {
            nome: turma.nome,
            alunos: turma.alunos || [],
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
        },
        { merge: true },
      );
    }
  };

  const deletarTurma = async (id) => {
    await deleteDoc(doc(db, "turmas", String(id)));
  };

  // --- Operações para Respostas dos Alunos ---
  const salvarRespostaAluno = async (registo) => {
    try {
      // Limpa e remove acentos ou caracteres especiais do ID para evitar rejeição do Firestore
      const idLimpo =
        `${registo.simuladoId}_${registo.turma}_${registo.nomeAluno}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();

      // Remove valores 'undefined' recursivamente para o Firestore aceitar o objeto
      const dadosSanitizados = JSON.parse(JSON.stringify(registo));

      // Salva ou atualiza na coleção 'respostas_alunos'
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
    loading,
    salvarSimulado,
    deletarSimulado,
    salvarTurma,
    deletarTurma,
    salvarRespostaAluno,
  };
}
