import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ShieldAlert, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLoginAdmin = async (e) => {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha.trim(),
      });

      if (error) {
        setErro("E-mail ou senha incorretos.");
        setCarregando(false);
        return;
      }

      const nomeExibicao = data.user?.user_metadata?.nome_exibicao || "Administrador";
      
      const roleDoUsuario = data.user?.user_metadata?.role || "church_admin";

      localStorage.setItem("icmlyrics_user", nomeExibicao);
      localStorage.setItem("icmlyrics_user_nuvem", email.trim().toLowerCase());
      localStorage.setItem("icmlyrics_role", roleDoUsuario); 

      onOpenChange(false);
      navigate("/dashboard"); 
      window.location.reload(); 

    } catch (err) {
      setErro("Falha de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-950 font-bold">
            <KeyRound className="w-5 h-5 text-amber-500" />
            Portal do Administrador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLoginAdmin} className="space-y-4 my-2">
          {erro && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail do Admin</label>
            <Input 
              type="email"
              placeholder="exemplo@icmlyrics.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="h-10 mt-1 text-sm"
              disabled={carregando}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Senha Admin</label>
            <div className="relative mt-1">
              <Input 
                type={mostrarSenha ? "text" : "password"} 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                className="h-10 pr-10 text-sm"
                disabled={carregando}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={carregando}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {carregando ? "Autenticando..." : "Entrar como Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}