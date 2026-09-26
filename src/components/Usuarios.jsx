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

  // Função auxiliar para garantir que o código comece com F
  const formatarCodigoSipae = (codigoBruto) => {
    let codigo = codigoBruto.trim().toUpperCase();
    if (codigo && !codigo.startsWith("F")) {
      codigo = "F" + codigo;
    }
    return codigo;
  };

  const adicionarUsuarioUnico = async (e) => {
    e.preventDefault();
    if (!novoCodigo.trim() || !novoNome.trim()) {
      alert("Preencha o código e o nome completo.");
      return;
    }

    const codigoFormatado = formatarCodigoSipae(novoCodigo);

    if (usuarios.some((u) => u.codigo === codigoFormatado)) {
      alert("Já existe um usuário com este código.");
      return;
    }

    const novo = {
      id: Date.now().toString(),
      codigo: codigoFormatado,
      nome: novoNome.trim().toUpperCase(),
      cargo: novoCargo,
      senha: "",
    };

    await atualizarEPersistir([...usuarios, novo]);
    setNovoCodigo("");
    setNovoNome("");
    setNovoCargo("PROFESSOR");
  };

  const colarListaUsuarios = async (e) => {
    e.preventDefault();
    if (!textoListaCodigos.trim()) return;

    // Divide o texto colado por linhas
    const linhas = textoListaCodigos
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

    if (linhas.length === 0) return;

    let adicionados = 0;
    const listaAtualizada = [...usuarios];

    linhas.forEach((linha) => {
      const partes = linha.split(/\s+/);
      if (partes.length === 0) return;

      const codigoBruto = partes[0];
      const codigoFormatado = formatarCodigoSipae(codigoBruto);

      const nomeBruto = partes.slice(1).join(" ").trim();
      const nomeFormatado = nomeBruto ? nomeBruto.toUpperCase() : "";

      if (
        codigoFormatado.length > 1 &&
        nomeFormatado &&
        !listaAtualizada.some((u) => u.codigo === codigoFormatado)
      ) {
        listaAtualizada.push({
          id: Date.now().toString() + Math.random(),
          codigo: codigoFormatado,
          nome: nomeFormatado,
          cargo: "PROFESSOR",
          senha: "",
        });
        adicionados++;
      }
    });

    if (adicionados > 0) {
      await atualizarEPersistir(listaAtualizada);
      setTextoListaCodigos("");
      setMostrarAddMassa(false);
      alert(`${adicionados} usuário(s) importado(s) com sucesso!`);
    } else {
      alert(
        "Nenhum usuário novo foi adicionado (todos já existiam ou formato inválido).",
      );
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
    if (!editCodigo.trim() || !editNome.trim()) {
      alert("O código e o nome são obrigatórios.");
      return;
    }

    const codigoFormatado = formatarCodigoSipae(editCodigo);

    if (usuarios.some((u) => u.codigo === codigoFormatado && u.id !== editId)) {
      alert("Este código já está em uso por outro usuário.");
      return;
    }

    const listaAtualizada = usuarios.map((u) => {
      if (u.id === editId) {
        return {
          ...u,
          codigo: codigoFormatado,
          nome: editNome.trim().toUpperCase(),
          cargo: editCargo,
          senha: editSenha,
        };
      }
      return u;
    });

    await atualizarEPersistir(listaAtualizada);
    setEditId(null);
  };

  const formatarCargoExibicao = (cargo) => {
    switch (cargo) {
      case "COORDENACAO":
        return {
          texto: "Coordenador(a)",
          classe: "bg-blue-100 text-blue-700",
        };
      case "DIRECAO":
        return {
          texto: "Diretor(a)",
          classe: "bg-orange-100 text-orange-700",
        };
      case "ADMIN":
        return {
          texto: "Dev",
          classe: "bg-red-100 text-red-700",
        };
      default:
        return {
          texto: "Professor(a)",
          classe: "bg-gray-100 text-gray-700",
        };
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.codigo.includes(buscaUsuario.trim().toUpperCase()) ||
      u.nome.toUpperCase().includes(buscaUsuario.trim().toUpperCase()),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 font-sans antialiased">
      {/* =========================================================
          COLUNA ESQUERDA: ADICIONAR USUÁRIOS
          ========================================================= */}
      <div className="lg:col-span-4 bg-white rounded-md p-4 sm:p-5 lg:p-6 border border-gray-200 h-fit shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-5">
          <div className="p-2 bg-blue-500 text-white rounded-md">
            <UserCog className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold tracking-wide uppercase text-gray-800">
            GERIR <span className="text-red-500">ACESSOS</span>
          </h2>
        </div>

        {/* Formulário: Adicionar Único */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-3">
            <UserPlus className="w-4 h-4" /> Adicionar Individual
          </h3>
          <form onSubmit={adicionarUsuarioUnico} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Cód. SIPAE (Ex: 12345)"
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium outline-none transition-colors uppercase placeholder:text-gray-400 placeholder:font-light"
                required
              />
            </div>
            <div>
              {/* Nome Completo obrigatório */}
              <input
                type="text"
                placeholder="Nome Completo *"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium outline-none transition-colors uppercase placeholder:text-gray-400 placeholder:font-light"
                required
              />
            </div>
            <div>
              <select
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700 outline-none transition-colors uppercase"
              >
                <option value="PROFESSOR">Professor(a)</option>
                <option value="COORDENACAO">Coordenador(a)</option>
                <option value="DIRECAO">Diretor(a)</option>
                <option value="ADMIN">Desenvolvedor (Admin)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-wider rounded-md transition-colors text-xs flex items-center justify-center mt-2"
            >
              Registar Acesso
            </button>
          </form>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={() => setMostrarAddMassa(!mostrarAddMassa)}
            className={`w-full py-2.5 font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors text-xs border ${
              mostrarAddMassa
                ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                : "bg-green-500 text-white border-green-500 hover:bg-green-600"
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

          {/* Formulário: Adicionar em Massa com exemplo limpo */}
          {mostrarAddMassa && (
            <form onSubmit={colarListaUsuarios} className="mt-4 space-y-3">
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200 font-medium">
                Cole a lista no formato <strong>12345 NOME DO USUÁRIO</strong>{" "}
                (um por linha)[cite: 4]. O "F" será adicionado automaticamente
                ao código e o nome preenchido.
              </div>
              <textarea
                rows="4"
                placeholder="12345 NOME DO USUÁRIO 1&#10;67890 NOME DO USUÁRIO 2"
                value={textoListaCodigos}
                onChange={(e) => setTextoListaCodigos(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm font-medium outline-none transition-colors uppercase placeholder:text-gray-400 resize-none placeholder:font-light"
              ></textarea>
              <button
                type="submit"
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Confirmar Importação
              </button>
            </form>
          )}
        </div>
      </div>

      {/* =========================================================
          COLUNA DIREITA: LISTA SIMPLIFICADA DE USUÁRIOS
          ========================================================= */}
      <div className="lg:col-span-8 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col h-fit lg:min-h-[500px]">
        {/* Cabeçalho e Busca */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              USUÁRIOS <span className="text-red-500">REGISTADOS</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-md font-medium">
                {usuarios.length}
              </span>
            </h3>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar código ou nome..."
              value={buscaUsuario}
              onChange={(e) => setBuscaUsuario(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase placeholder:text-gray-400 placeholder:normal-case placeholder:font-light"
            />
          </div>
        </div>

        {/* Tabela de Usuários Simplificada */}
        <div className="flex-1 overflow-x-auto">
          {usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nenhum usuário encontrado.
              </p>
            </div>
          ) : (
            <div className="min-w-[600px] w-full">
              {/* Header Tabela */}
              <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-200">
                <div className="col-span-3">Código</div>
                <div className="col-span-4">Nome</div>
                <div className="col-span-2">Cargo</div>
                <div className="col-span-1 text-center">Senha</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => {
                  const infoCargo = formatarCargoExibicao(usuario.cargo);

                  return (
                    <div
                      key={usuario.id}
                      className={`grid grid-cols-12 gap-3 px-6 py-3 items-center transition-colors group text-xs ${
                        editId === usuario.id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
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
                              className="w-full p-2 bg-white border border-blue-300 rounded-md text-xs font-medium outline-none uppercase focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={editNome}
                              onChange={(e) =>
                                setEditNome(e.target.value.toUpperCase())
                              }
                              placeholder="Nome..."
                              className="w-full p-2 bg-white border border-blue-300 rounded-md text-xs font-medium outline-none uppercase focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <select
                              value={editCargo}
                              onChange={(e) => setEditCargo(e.target.value)}
                              className="w-full p-2 bg-white border border-blue-300 rounded-md text-xs font-medium uppercase outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="PROFESSOR">Professor(a)</option>
                              <option value="COORDENACAO">
                                Coordenador(a)
                              </option>
                              <option value="DIRECAO">Diretor(a)</option>
                              <option value="ADMIN">Dev</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={editSenha}
                              onChange={(e) => setEditSenha(e.target.value)}
                              placeholder="Nova senha..."
                              className="w-full p-2 bg-white border border-blue-300 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        /* MODO DE VISUALIZAÇÃO SIMPLIFICADO */
                        <>
                          <div className="col-span-3 font-medium text-gray-800">
                            {usuario.codigo}
                          </div>
                          <div className="col-span-4 font-medium text-gray-700 uppercase truncate">
                            {usuario.nome || (
                              <span className="text-gray-400 font-light normal-case">
                                Não definido
                              </span>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${infoCargo.classe}`}
                            >
                              {infoCargo.texto}
                            </span>
                          </div>
                          <div className="col-span-1 text-center">
                            {usuario.senha ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold uppercase">
                                Sim
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold uppercase">
                                Não
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <button
                              onClick={() => iniciarEdicao(usuario)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
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
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
