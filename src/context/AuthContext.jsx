/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const usuarioSalvo = sessionStorage.getItem("simulatech_user");
      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch (error) {
      console.error("Erro ao ler utilizador do sessionStorage:", error);
      return null;
    }
  });

  const login = (dadosUsuario) => {
    setUser(dadosUsuario);
    sessionStorage.setItem("simulatech_user", JSON.stringify(dadosUsuario));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("simulatech_user");
  };

  const isProfessor = user?.cargo === "PROFESSOR";
  const isGestao =
    user?.cargo === "COORDENACAO" ||
    user?.cargo === "DIRECAO" ||
    user?.cargo === "ADMIN" ||
    user?.cargo === "GESTAO" ||
    user?.cargo === "COORDENADOR" ||
    user?.cargo === "DIRETOR";

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isProfessor, isGestao }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
