import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Award,
  GraduationCap,
  Building2,
  ArrowLeft,
  User,
  Lock,
  KeyRound,
  ChevronRight,
} from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  // Estados da interface
  const [perfilSelecionado, setPerfilSelecionado] = useState(null); // 'PROFESSOR' ou 'GESTAO'
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);

  // Formulário
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErro("");

    if (!codigo.trim() || !senha.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isPrimeiroAcesso) {
      if (senha !== confirmarSenha) {
        setErro("As senhas não coincidem.");
        return;
      }
      if (senha.length < 4) {
        setErro("A senha deve ter pelo menos 4 caracteres.");
        return;
      }

      const chavePrimeiroAcesso = `senha_${perfilSelecionado}_${codigo.trim().toLowerCase()}`;
      localStorage.setItem(chavePrimeiroAcesso, senha);
    } else {
      const chavePrimeiroAcesso = `senha_${perfilSelecionado}_${codigo.trim().toLowerCase()}`;
      const senhaSalva = localStorage.getItem(chavePrimeiroAcesso);

      if (senhaSalva && senhaSalva !== senha) {
        setErro("Senha incorreta. Tente novamente.");
        return;
      }
    }

    const cargoFinal =
      perfilSelecionado === "PROFESSOR" ? "PROFESSOR" : "COORDENACAO";

    login({
      codigo: codigo.trim().toUpperCase(),
      nome:
        nome.trim() ||
        (perfilSelecionado === "PROFESSOR"
          ? `Prof. ${codigo.toUpperCase()}`
          : `Gestor ${codigo.toUpperCase()}`),
      cargo: cargoFinal,
    });
  };

  const voltarSelecao = () => {
    setPerfilSelecionado(null);
    setIsPrimeiroAcesso(false);
    setCodigo("");
    setSenha("");
    setConfirmarSenha("");
    setNome("");
    setErro("");
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
        </div>

        {/* ECRÃ 1: SELEÇÃO DE PERFIL */}
        {!perfilSelecionado ? (
          <div className="p-6 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
              Selecione o perfil
            </p>

            {/* Opção Professor */}
            <button
              onClick={() => setPerfilSelecionado("PROFESSOR")}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-[#4b82f6] bg-white hover:bg-blue-50/50 flex items-center justify-between transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-blue-500 text-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">
                  Área do Professor
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4b82f6] group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Opção Direção / Coordenação */}
            <button
              onClick={() => setPerfilSelecionado("GESTAO")}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 flex items-center justify-between transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-slate-800 text-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">
                  Direção / Coordenação
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        ) : (
          /* ECRÃ 2: FORMULÁRIO DE LOGIN */
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <button
              type="button"
              onClick={voltarSelecao}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#4b82f6] uppercase tracking-wider transition cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              {perfilSelecionado === "PROFESSOR" ? (
                <>
                  <GraduationCap className="w-4 h-4 text-[#4b82f6]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Área do Professor
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-slate-800" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Direção / Coordenação
                  </span>
                </>
              )}
            </div>

            {erro && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-200 text-center">
                {erro}
              </div>
            )}

            {/* Login / Cód. SIPAE */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {perfilSelecionado === "PROFESSOR"
                  ? "Cód. do SIPAE"
                  : "Usuário"}
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder={
                    perfilSelecionado === "PROFESSOR"
                      ? "Ex: SIPAE-1024"
                      : "Ex: coord.maria"
                  }
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal"
                />
              </div>
            </div>

            {/* Nome (Apenas Primeiro Acesso) */}
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
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#4b82f6] focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:normal-case placeholder:font-normal"
                  />
                </div>
              </div>
            )}

            {/* Senha */}
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

            {/* Confirmar Senha (Apenas Primeiro Acesso) */}
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

            {/* Botão Entrar / Cadastrar */}
            <button
              type="submit"
              className="w-full py-3 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer mt-2 active:scale-[0.99]"
            >
              {isPrimeiroAcesso ? "Cadastrar e Entrar" : "Entrar"}
            </button>

            {/* Link Primeiro Acesso */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsPrimeiroAcesso(!isPrimeiroAcesso);
                  setErro("");
                }}
                className="text-[11px] text-[#4b82f6] font-bold uppercase tracking-wider hover:underline cursor-pointer"
              >
                {isPrimeiroAcesso
                  ? "Já possui senha? Fazer Login"
                  : "Primeiro acesso? Cadastre sua senha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
