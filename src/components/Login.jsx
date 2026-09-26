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
  ClipboardCheck,
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Container responsivo: estreito/vertical no celular (w-[90%] max-w-[280px]) e proporcional no computador (sm:max-w-md sm:w-full) */}
      <div className="w-[92%] max-w-[280px] sm:max-w-md sm:w-full bg-white rounded-md border border-[#dbc8b6] shadow-sm overflow-hidden my-auto">
        {/* Cabeçalho */}
        <div className="pt-5 pb-4 px-4 sm:px-6 text-center border-b border-[#dbc8b6] bg-gray-50">
          <div className="inline-flex p-2.5 sm:p-3 bg-blue-500 text-white rounded-md mb-2.5 shadow-xs">
            <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-base sm:text-xl font-bold uppercase text-gray-800 tracking-wide">
            SIMULA<span className="text-red-500 font-bold">TECH</span>
          </h1>
          <div className="mt-2">
            <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider leading-snug">
              Escola Municipal José Barreto de Araújo
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleLoginSubmit}
          className="p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          {erro && (
            <div className="bg-red-50 text-red-500 text-xs font-medium p-2.5 sm:p-3 rounded-md border border-red-200 text-center leading-snug">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">
              Código do SIPAE
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setAlertaCodigoFaltando(false);
                }}
                placeholder="Ex: F12345"
                className={`w-full pl-9 pr-3 py-2 bg-white border ${
                  alertaCodigoFaltando
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-[#dbc8b6]"
                } rounded-md text-xs sm:text-sm font-medium text-gray-700 outline-none focus:border-blue-500 transition-colors uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400 shadow-xs`}
              />
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-700 outline-none focus:border-blue-500 transition-colors uppercase placeholder:normal-case placeholder:font-light placeholder:text-gray-400 shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder:font-light placeholder:text-gray-400 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isPrimeiroAcesso && (
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-white border border-[#dbc8b6] rounded-md text-xs sm:text-sm font-medium text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder:font-light placeholder:text-gray-400 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                  }
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 mt-3 shadow-xs cursor-pointer"
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
                className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 font-bold uppercase hover:underline disabled:opacity-50 transition-colors cursor-pointer tracking-wider"
              >
                Primeiro acesso?
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleVoltarLoginClick}
                className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 font-bold uppercase hover:underline disabled:opacity-50 transition-colors cursor-pointer tracking-wider"
              >
                Já possui senha? Fazer Login
              </button>
            )}
          </div>
        </form>
      </div>

      <footer className="mt-4 text-center shrink-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">
          Desenvolvido por:{" "}
          <span className="text-blue-500 font-bold">Maciel dos Santos</span>
        </p>
      </footer>
    </div>
  );
}
