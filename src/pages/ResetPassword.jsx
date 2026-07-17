import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) { 
      setError("As senhas não coincidem."); 
      return; 
    }

    setLoading(true);

    try {
      // O Supabase atualiza o usuário logado atualmente (pelo link de recuperação de senha)
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });

      if (resetError) throw resetError;

      setSucesso(true);
      
      // Pequeno delay para o usuário ler a mensagem de sucesso antes de ir ao login
      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (err) {
      setError(err.message || "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Music2 className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-slate-900">Nova Senha</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          
          {sucesso ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-lg text-center font-medium">
              Senha redefinida com sucesso! Redirecionando...
            </div>
          ) : (
            <>
              <div>
                <Label>Nova Senha</Label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Confirmar Senha</Label>
                <Input 
                  type="password" 
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)} 
                  required 
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}