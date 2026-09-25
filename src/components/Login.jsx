import { useState } from "react";
import { UserCog, Plus, Trash2, Edit3, Key, Shield, User } from "lucide-react";

export default function Usuarios({
  usuarios = [],
  onSalvarUsuarios,
  onDeletarUsuario,
}) {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("PROFESSOR");
  const [senhaPadrao, setSenhaPadrao] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!codigo.trim() || !nome.trim()) {
      alert("Preencha o Código SIPAE e o Nome do utilizador.");
      return;
    }

    // Força o nome inteiramente em maiúsculas ao salvar
    const nomeMaiusculo = nome.trim().toUpperCase();
    const codigoUpper = codigo.trim().toUpperCase();

    const novoUsuario = {
      ...(editandoId ? { id: editandoId } : { id: Date.now() }),
      codigo: codigoUpper,
      nome: nomeMaiusculo,
      cargo: cargo,
      ...(senhaPadrao.trim() ? { senha: senhaPadrao.trim() } : {}),
    };

    try {
      await onSalvarUsuarios(novoUsuario);
      alert(
        editandoId
          ? "Acesso atualizado com sucesso!"
          : "Acesso liberado com sucesso!",
      );

      // Limpar formulário
      setCodigo("");
      setNome("");
      setCargo("PROFESSOR");
      setSenhaPadrao("");
      setEditandoId(null);
    } catch (error) {
      console.error("Erro ao salvar utilizador:", error);
      alert("Erro ao guardar o acesso. Tente novamente.");
    }
  };

  const handleEditar = (user) => {
    setEditandoId(user.id);
    setCodigo(user.codigo || "");
    setNome(user.nome || "");
    setCargo(user.cargo || "PROFESSOR");
    setSenhaPadrao(user.senha || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExcluir = async (id, nomeUser) => {
    if (
      window.confirm(
        `Tem a certeza que deseja revogar o acesso de ${nomeUser}?`,
      )
    ) {
      try {
        await onDeletarUsuario(id);
        alert("Acesso revogado com sucesso.");
      } catch (error) {
        console.error("Erro ao excluir utilizador:", error);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-200/80 w-full">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 flex-shrink-0">
          <UserCog className="text-[#4b82f6] w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-800 leading-tight">
            Gestão de <span className="text-[#4b82f6]">Acessos</span>
          </h2>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Liberar e gerir credenciais do SIPAE (Professores e Gestão)
          </p>
        </div>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-8 space-y-4"
      >
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#4b82f6]" />
          <span>
            {editandoId
              ? "Editar Credencial de Acesso"
              : "Adicionar Novo Acesso"}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Código SIPAE
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: F12345"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase outline-none focus:border-[#4b82f6] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nome Completo
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                required
                value={nome}
                // Aplica a classe uppercase e garante visualmente que o texto fica maiúsculo ao digitar
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                placeholder="Nome do profissional"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase outline-none focus:border-[#4b82f6] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cargo / Permissão
            </label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase outline-none focus:border-[#4b82f6] transition-all cursor-pointer"
            >
              <option value="PROFESSOR">Professor / Aplicador</option>
              <option value="GESTAO">Gestão / Direção</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Senha (Opcional p/ redefinir)
            </label>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={senhaPadrao}
                onChange={(e) => setSenhaPadrao(e.target.value)}
                placeholder="Deixe em branco se mantiver"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#4b82f6] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          {editandoId && (
            <button
              type="button"
              onClick={() => {
                setEditandoId(null);
                setCodigo("");
                setNome("");
                setCargo("PROFESSOR");
                setSenhaPadrao("");
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-xl text-xs shadow-xs shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {editandoId ? "Atualizar Acesso" : "Liberar Acesso"}
          </button>
        </div>
      </form>

      {/* Tabela de Utilizadores Cadastrados */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Utilizadores com Acesso Liberado ({usuarios.length})
        </h3>

        <div className="w-full overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
          <table className="w-full min-w-[600px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">
                <th className="p-3">Código SIPAE</th>
                <th className="p-3">Nome Completo</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Senha Definida</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-blue-50/20 transition-colors"
                >
                  <td className="p-3 font-bold font-mono text-slate-600 uppercase">
                    {u.codigo}
                  </td>
                  <td className="p-3 font-bold text-slate-800 uppercase">
                    {u.nome}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        u.cargo === "GESTAO"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {u.cargo}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {u.senha ? (
                      "••••••"
                    ) : (
                      <span className="text-orange-500 font-bold text-[10px]">
                        Pendente (1º Acesso)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditar(u)}
                        className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(u.id, u.nome)}
                        className="p-1.5 bg-slate-50 text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8 text-slate-400 text-xs font-bold uppercase"
                  >
                    Nenhum utilizador cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
