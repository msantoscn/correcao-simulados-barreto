import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Award, User, Lock, KeyRound, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  // Estados da interface
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulário
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!codigo.trim() || !senha.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isPrimeiroAcesso && senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (isPrimeiroAcesso && senha.length < 4) {
      setErro("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setLoading(true);
    const codigoUpper = codigo.trim().toUpperCase();

    try {
      // 1. Busca o utilizador no Firebase pelo código SIPAE
      const q = query(
        collection(db, "usuarios"),
        where("codigo", "==", codigoUpper),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErro(
          "Código não encontrado. Verifique se o seu acesso foi liberado pela coordenação.",
        );
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // 2. Lógica de Primeiro Acesso
      if (isPrimeiroAcesso) {
        if (userData.senha) {
          setErro(
            "Este código já possui uma senha registada. Faça o login normalmente.",
          );
          setLoading(false);
          return;
        }

        const nomeFinal =
          nome.trim() || userData.nome || `Utilizador ${codigoUpper}`;

        // Atualiza a senha e o nome no Firebase
        await updateDoc(doc(db, "usuarios", userId), {
          senha: senha,
          nome: nomeFinal,
        });

        login({
          codigo: codigoUpper,
          nome: nomeFinal,
          cargo: userData.cargo,
        });
      } else {
        // 3. Lógica de Login Normal
        if (!userData.senha) {
          setErro("Senha não cadastrada. Utilize a opção 'Primeiro Acesso'.");
          setLoading(false);
          return;
        }

        if (userData.senha !== senha) {
          setErro("Senha incorreta. Tente novamente.");
          setLoading(false);
          return;
        }

        login({
          codigo: userData.codigo,
          nome: userData.nome,
          cargo: userData.cargo,
        });
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setErro("Erro ao comunicar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/5 backdrop-blur-xs flex items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Cabeçalho */}
        <div className="pt-10 pb-6 px-8 text-center bg-gradient-to-b from-blue-50/60 to-transparent border-b border-slate-100">
          <div className="inline-flex p-3.5 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Award className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase text-slate-900">
            SIMULA<span className="text-red-600">TECH</span>
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
            Sistema de Gestão de Simulados
          </p>
        </div>

        {/* Formulário de Acesso Unificado */}
        <form onSubmit={handleLoginSubmit} className="p-8 space-y-5">
          {erro && (
            <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl border border-red-200 text-center shadow-xs">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Código do SIPAE
            </label>
            <div className="relative flex items-center">
              <User className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: F12345"
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  type="password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-xl cursor-pointer mt-3 active:scale-[0.99] flex items-center justify-center gap-2.5"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isPrimeiroAcesso ? "Cadastrar e Entrar" : "Entrar"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsPrimeiroAcesso(!isPrimeiroAcesso);
                setErro("");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-extrabold uppercase tracking-wider hover:underline cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isPrimeiroAcesso
                ? "Já possui senha? Fazer Login"
                : "Primeiro acesso?"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
