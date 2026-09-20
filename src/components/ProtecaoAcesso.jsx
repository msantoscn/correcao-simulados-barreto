import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function ProtecaoAcesso({ cargosPermitidos = [], children }) {
  const { user } = useAuth();

  // Se o cargo do utilizador não estiver na lista de cargos permitidos
  if (!user || !cargosPermitidos.includes(user.cargo)) {
    return (
      <div className="bg-white p-12 rounded-sm border border-red-200 text-center max-w-lg mx-auto mt-10 shadow-sm">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
          Acesso Restrito
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Apenas elementos da <strong>Coordenação</strong> e{" "}
          <strong>Direção</strong> têm permissão para aceder a esta página.
        </p>
      </div>
    );
  }

  return children;
}
