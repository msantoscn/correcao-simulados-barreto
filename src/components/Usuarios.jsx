import { useState } from "react";
import {
  UserCog,
  UserPlus,
  ClipboardList,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  ShieldAlert,
} from "lucide-react";

export default function Usuarios({
  usuarios = [],
  onSalvarUsuarios,
  onDeletarUsuario,
}) {
  // Estados para Adição Individual
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoCargo, setNovoCargo] = useState("PROFESSOR");

  // Estados para Adição em Massa
  const [textoListaCodigos, setTextoListaCodigos] = useState("");
  const [mostrarAddMassa, setMostrarAddMassa] = useState(false);

  // Estados para Visualização e Busca
  const [buscaUsuario, setBuscaUsuario] = useState("");

  // Estados para Edição
  const [editId, setEditId] = useState(null);
  const [editCodigo, setEditCodigo] = useState("");
  const [editSenha, setEditSenha] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editCargo, setEditCargo] = useState("PROFESSOR");

  // =========================================================================
  // FUNÇÕES DE MANIPULAÇÃO
  // =========================================================================

  const atualizarEPersistir = async (novaLista) => {
    try {
      await onSalvarUsuarios(novaLista);
    } catch (error) {
      console.error("Erro ao sincronizar usuários com o Firebase:", error);
      alert("Erro ao guardar as alterações.");
    }
  };

  const adicionarUsuarioUnico = async (e) => {
    e.preventDefault();
    if (!novoCodigo.trim()) return;

    const codigoFormatado = novoCodigo.trim().toUpperCase();

    if (usuarios.some((u) => u.codigo === codigoFormatado)) {
      alert("Já existe um usuário com este código.");
      return;
    }

    const novo = {
      id: Date.now().toString(),
      codigo: codigoFormatado,
      nome: novoNome.trim(),
      cargo: novoCargo,
      senha: "", // Senha vazia, será definida no primeiro acesso
    };

    await atualizarEPersistir([...usuarios, novo]);
    setNovoCodigo("");
    setNovoNome("");
    setNovoCargo("PROFESSOR");
  };

  const colarListaUsuarios = async (e) => {
    e.preventDefault();
    if (!textoListaCodigos.trim()) return;

    const novosCodigos = textoListaCodigos
      .split("\n")
      .map((linha) => linha.trim().toUpperCase())
      .filter((linha) => linha.length > 0);

    if (novosCodigos.length === 0) return;

    let adicionados = 0;
    const listaAtualizada = [...usuarios];

    novosCodigos.forEach((codigo) => {
      if (!listaAtualizada.some((u) => u.codigo === codigo)) {
        listaAtualizada.push({
          id: Date.now().toString() + Math.random(),
          codigo: codigo,
          nome: "", // Fica em branco para o professor preencher (ou a escola editar depois)
          cargo: "PROFESSOR", // Padrão da importação em massa
          senha: "",
        });
        adicionados++;
      }
    });

    if (adicionados > 0) {
      await atualizarEPersistir(listaAtualizada);
      setTextoListaCodigos("");
      setMostrarAddMassa(false);
      alert(`${adicionados} código(s) importado(s) com sucesso!`);
    } else {
      alert("Nenhum código novo foi adicionado (todos já existiam).");
    }
  };

  const removerUsuario = async (id, nomeOuCodigo) => {
    if (!confirm(`Remover permanentemente o acesso de ${nomeOuCodigo}?`))
      return;
    try {
      await onDeletarUsuario(id);
    } catch (error) {
      console.error("Erro ao eliminar usuário:", error);
      alert("Erro ao eliminar usuário.");
    }
  };

  const iniciarEdicao = (usuario) => {
    setEditId(usuario.id);
    setEditCodigo(usuario.codigo || "");
    setEditNome(usuario.nome || "");
    setEditCargo(usuario.cargo || "PROFESSOR");
    setEditSenha(usuario.senha || "");
  };

  const cancelarEdicao = () => {
    setEditId(null);
  };

  const salvarEdicao = async () => {
    if (!editCodigo.trim()) {
      alert("O código é obrigatório.");
      return;
    }

    const codigoFormatado = editCodigo.trim().toUpperCase();

    // Verifica se o novo código já existe em OUTRO usuário
    if (usuarios.some((u) => u.codigo === codigoFormatado && u.id !== editId)) {
      alert("Este código já está em uso por outro usuário.");
      return;
    }

    const listaAtualizada = usuarios.map((u) => {
      if (u.id === editId) {
        return {
          ...u,
          codigo: codigoFormatado,
          nome: editNome.trim(),
          cargo: editCargo,
          senha: editSenha, // Permite à direção redefinir/apagar a senha
        };
      }
      return u;
    });

    await atualizarEPersistir(listaAtualizada);
    setEditId(null);
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.codigo.includes(buscaUsuario.trim().toUpperCase()) ||
      u.nome.toUpperCase().includes(buscaUsuario.trim().toUpperCase()),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* =========================================================
          COLUNA ESQUERDA: ADICIONAR USUÁRIOS
          ========================================================= */}
      <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm p-4 sm:p-5 lg:p-6 border border-slate-200/80 h-fit">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
            <UserCog className="text-slate-600 w-5 h-5" />
          </div>
          <h2 className="text-lg font-black tracking-wide uppercase text-slate-800">
            Gerir <span className="text-[#4b82f6]">Acessos</span>
          </h2>
        </div>

        {/* Formulário: Adicionar Único */}
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <UserPlus className="w-3.5 h-3.5" /> Adicionar Individual
          </h3>
          <form onSubmit={adicionarUsuarioUnico} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Cód. SIPAE (Ex: SIPAE-1024)"
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())}
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium outline-none transition-all uppercase placeholder:text-slate-400 placeholder:normal-case"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Nome Completo (Opcional)"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <select
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                className="w-full p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-slate-600 outline-none transition-all uppercase"
              >
                <option value="PROFESSOR">Professor</option>
                <option value="COORDENACAO">Coordenação / Direção</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 lg:py-2.5 bg-[#4b82f6] hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-xl transition-all text-[11px] shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              Registar Acesso
            </button>
          </form>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setMostrarAddMassa(!mostrarAddMassa)}
            className={`w-full py-3 lg:py-2.5 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] shadow-sm active:scale-95 cursor-pointer ${
              mostrarAddMassa
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {mostrarAddMassa ? (
              <>
                <X className="w-4 h-4" /> Cancelar Importação
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" /> Importar Lista de Códigos
              </>
            )}
          </button>

          {/* Formulário: Adicionar em Massa */}
          {mostrarAddMassa && (
            <form
              onSubmit={colarListaUsuarios}
              className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2"
            >
              <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                Cole os códigos (um por linha). Todos serão registados como{" "}
                <strong>PROFESSOR</strong>. O nome e a senha poderão ser
                definidos no primeiro acesso.
              </div>
              <textarea
                rows="4"
                placeholder="SIPAE-101&#10;SIPAE-102&#10;SIPAE-103"
                value={textoListaCodigos}
                onChange={(e) => setTextoListaCodigos(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono outline-none transition-all uppercase placeholder:text-slate-400 resize-none"
              ></textarea>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Confirmar Importação
              </button>
            </form>
          )}
        </div>
      </div>

      {/* =========================================================
          COLUNA DIREITA: LISTA DE USUÁRIOS E EDIÇÃO
          ========================================================= */}
      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-fit lg:min-h-[500px]">
        {/* Cabeçalho e Busca */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              Usuários Registados
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-md">
                {usuarios.length}
              </span>
            </h3>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar código ou nome..."
              value={buscaUsuario}
              onChange={(e) => setBuscaUsuario(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all uppercase placeholder:text-slate-400 placeholder:normal-case"
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="flex-1 overflow-x-auto">
          {usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <ShieldAlert className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nenhum usuário encontrado.
              </p>
            </div>
          ) : (
            <div className="min-w-[600px] w-full">
              {/* Header Tabela */}
              <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <div className="col-span-3">Código</div>
                <div className="col-span-4">Nome</div>
                <div className="col-span-2">Cargo</div>
                <div className="col-span-1 text-center">Senha</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-slate-100">
                {usuariosFiltrados.map((usuario) => (
                  <div
                    key={usuario.id}
                    className={`grid grid-cols-12 gap-3 px-6 py-4 items-center transition-colors group ${
                      editId === usuario.id
                        ? "bg-blue-50/50"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* MODO DE EDIÇÃO */}
                    {editId === usuario.id ? (
                      <>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={editCodigo}
                            onChange={(e) =>
                              setEditCodigo(e.target.value.toUpperCase())
                            }
                            className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold outline-none uppercase"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            placeholder="Nome..."
                            className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-medium outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={editCargo}
                            onChange={(e) => setEditCargo(e.target.value)}
                            className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold uppercase outline-none"
                          >
                            <option value="PROFESSOR">Prof</option>
                            <option value="COORDENACAO">Coord</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={editSenha}
                            onChange={(e) => setEditSenha(e.target.value)}
                            placeholder="Nova senha..."
                            className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-medium outline-none"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end gap-1">
                          <button
                            onClick={salvarEdicao}
                            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelarEdicao}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* MODO DE VISUALIZAÇÃO */
                      <>
                        <div className="col-span-3 text-sm font-black text-slate-700">
                          {usuario.codigo}
                        </div>
                        <div className="col-span-4 text-xs font-bold text-slate-600 uppercase truncate">
                          {usuario.nome || (
                            <span className="text-slate-300 font-medium italic normal-case">
                              Nome pendente
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              usuario.cargo === "COORDENACAO"
                                ? "bg-slate-800 text-white"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {usuario.cargo === "COORDENACAO" ? "Coord" : "Prof"}
                          </span>
                        </div>
                        <div className="col-span-1 text-center">
                          {usuario.senha ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase">
                              Sim
                            </span>
                          ) : (
                            <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold uppercase border border-red-100">
                              Não
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <button
                            onClick={() => iniciarEdicao(usuario)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            title="Editar Usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              removerUsuario(
                                usuario.id,
                                usuario.nome || usuario.codigo,
                              )
                            }
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            title="Eliminar Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
