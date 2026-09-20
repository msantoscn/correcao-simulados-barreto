/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Ler o localStorage diretamente na inicialização do estado (sem useEffect)
  const [user, setUser] = useState(() => {
    try {
      const usuarioSalvo = localStorage.getItem("simulatech_user");
      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch (error) {
      console.error("Erro ao ler utilizador do localStorage:", error);
      return null;
    }
  });

  const login = (dadosUsuario) => {
    setUser(dadosUsuario);
    localStorage.setItem("simulatech_user", JSON.stringify(dadosUsuario));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("simulatech_user");
  };

  const isProfessor = user?.cargo === "PROFESSOR";
  const isGestao = user?.cargo === "COORDENACAO" || user?.cargo === "DIRECAO";

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
