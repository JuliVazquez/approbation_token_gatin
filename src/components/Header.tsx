// src/components/Header.tsx
import React from "react";

interface HeaderProps {
  account: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ account, onConnect, onDisconnect }) => {
  return (
    <header className="w-full py-4 border-b border-gray-700 text-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-2">Approbation Token Gating dApp</h1>
      {account ? (
        <div className="flex flex-col items-center">
          <span className="text-sm mb-1">Conectado: {account}</span>
          <button
            className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded"
            onClick={onDisconnect}
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded"
          onClick={onConnect}
        >
          Conectar Metamask
        </button>
      )}
    </header>
  );
};

export default Header;
