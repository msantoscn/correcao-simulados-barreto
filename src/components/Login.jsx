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

  // Função auxiliar para capitalizar as iniciais corretamente (ex: "francisca maria" -> "Francisca Maria")
  const formatarNomeProprio = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .split(" ")
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  };

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

        const nomeFormatado = formatarNomeProprio(
          nome.trim() || userData.nome || `Utilizador ${codigoUpper}`,
        );

        // Atualiza a senha e o nome formatado no Firebase
        await updateDoc(doc(db, "usuarios", userId), {
          senha: senha,
          nome: nomeFormatado,
        });

        login({
          codigo: codigoUpper,
          nome: nomeFormatado,
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

        // Se porventura o nome já gravado no banco estiver em minúsculas, já o entregamos formatado
        const nomeFormatado = formatarNomeProprio(
          userData.nome || `Utilizador ${codigoUpper}`,
        );

        login({
          codigo: userData.codigo,
          nome: nomeFormatado,
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
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden transition-all duration-300">
        {/* Cabeçalho */}
        <div className="pt-8 pb-6 px-6 text-center border-b border-slate-100">
          <div className="inline-flex p-3 bg-blue-50 text-[#4b82f6] rounded-2xl mb-3 shadow-sm border border-blue-100/50">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase text-slate-800">
            SIMULA<span className="text-red-600">TECH</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Sistema de Gestão de Simulados
          </p>
        </div>

        {/* Formulário de Acesso Unificado */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-200 text-center">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Código do SIPAE
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: F12345"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4b82f6] hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer mt-2 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPrimeiroAcesso ? "Cadastrar e Entrar" : "Entrar"}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsPrimeiroAcesso(!isPrimeiroAcesso);
                setErro("");
              }}
              className="text-[11px] text-[#4b82f6] font-bold uppercase tracking-wider hover:underline cursor-pointer disabled:opacity-50"
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
