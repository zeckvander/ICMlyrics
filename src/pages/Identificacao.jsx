import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users, Settings } from "lucide-react";
import AdminLoginModal from "@/components/AdminLoginModal";
// Importa a imagem colorida da sua pasta assets
import imagemFundo from "../assets/Tromb_mundo.jpg";

const STORAGE_KEY = "icmtools_musico";

export default function Identificacao() {
  const navigate = useNavigate();
  const [nome, setNome] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);

  const handleEntrar = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("Digite seu nome para continuar.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, nome.trim());
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-slate-950">
      {/* Background image - Configurada para nitidez máxima e 50% de opacidade */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('${imagemFundo}')`,
          opacity: 0.50 // Exatamente 50% de opacidade
        }} 
      />

      {/* Admin gear icon */}
      <button
        onClick={() => setAdminOpen(true)}
        className="absolute top-5 right-5 text-white/40 hover:text-white/80 transition-colors z-10"
        aria-label="Acesso administrador"
      >
        <Settings className="w-5 h-5" />
      </button>
      <AdminLoginModal open={adminOpen} onOpenChange={setAdminOpen} />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            ICM<span className="text-amber-400">lyrics</span>
          </h1>
          <p className="text-slate-400 text-sm">ICM Heliópolis - Gus</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEntrar} className="space-y-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Seu nome:</span>
          </div>
          <Input
            id="nome"
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setError("");
            }}
            placeholder="Seu nome"
            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-base"
            autoFocus 
          />
          
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-base transition-all">
            Entrar no App
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        {/* Texto bíblico com sombra para garantir a leitura sobre a imagem nítida */}
        <p className="text-center max-w-sm mx-auto whitespace-pre-line text-xs text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
          "Celebrai com júbilo ao Senhor, todas as terras. 
          Servi ao Senhor com alegria; e entrai diante dele com canto." 
          Salmo 100:1-2
        </p>
      </div>
    </div>
  );
}