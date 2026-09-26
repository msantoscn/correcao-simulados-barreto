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
import {
  ClipboardCheck, // O ícone da prancheta de correção com o "Certo"
  User,
  Lock,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  // Estados da interface
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Estado para alertar se tentou abrir o primeiro acesso sem código
  const [alertaCodigoFaltando, setAlertaCodigoFaltando] = useState(false);

  // Formulário
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const handlePrimeiroAcessoClick = async () => {
    setErro("");

    // Só deve abrir se tiver código digitado. Se não, alerta e vermelho.
    if (!codigo.trim()) {
      setAlertaCodigoFaltando(true);
      setErro("Digite o codigo do SIPAE!");
      return;
    }

    setAlertaCodigoFaltando(false);
    setLoading(true);
    const codigoUpper = codigo.trim().toUpperCase();

    try {
      // Busca o nome do banco de dados automaticamente
      const q = query(
        collection(db, "usuarios"),
        where("codigo", "==", codigoUpper),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErro("Código não encontrado. Verifique com a coordenação.");
        setLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();

      if (userData.senha) {
        setErro("Este código já possui senha. Faça o login normalmente.");
        setLoading(false);
        return;
      }

      // Preenche o nome puxado do banco (ou deixa vazio se não houver)
      setNome(userData.nome || "");
      setIsPrimeiroAcesso(true);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setErro("Erro ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoltarLoginClick = () => {
    setIsPrimeiroAcesso(false);
    setErro("");
    setAlertaCodigoFaltando(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setAlertaCodigoFaltando(false);

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        {/* Cabeçalho */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-gray-200">
          <div className="inline-flex p-3 bg-blue-500 text-white rounded-md mb-4">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold uppercase text-gray-800 tracking-wide">
            SIMULA<span className="text-red-500">TECH</span>
          </h1>
          <div className="mt-4">
            <p className="text-base font-semibold text-gray-700 uppercase">
              Escola Municipal José Barreto de Araújo
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLoginSubmit} className="p-8 space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-500 text-xs font-medium p-3 rounded-md border border-red-200 text-center">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Código do SIPAE
            </label>
            <div className="relative flex items-center">
              <User className="w-5 h-5 text-gray-400 absolute left-3" />
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setAlertaCodigoFaltando(false);
                }}
                placeholder="Ex: F12345"
                className={`w-full pl-10 pr-3 py-2 bg-white border ${alertaCodigoFaltando ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"} rounded-md text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400`}
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3" />
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:font-light placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {mostrarSenha ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3" />
                <input
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:font-light placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                  }
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold text-sm uppercase rounded-md transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPrimeiroAcesso ? "Cadastrar e Entrar" : "Entrar"}
          </button>

          <div className="text-center pt-2">
            {!isPrimeiroAcesso ? (
              <button
                type="button"
                disabled={loading}
                onClick={handlePrimeiroAcessoClick}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium uppercase hover:underline disabled:opacity-50 transition-colors"
              >
                Primeiro acesso?
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleVoltarLoginClick}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium uppercase hover:underline disabled:opacity-50 transition-colors"
              >
                Já possui senha? Fazer Login
              </button>
            )}
          </div>
        </form>
      </div>

      <footer className="mt-6 text-center">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">
          Desenvolvido por:{" "}
          <span className="text-blue-500">Maciel dos Santos</span>
        </p>
      </footer>
    </div>
  );
}
