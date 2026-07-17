import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Realiza o login utilizando o Supabase
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (loginError) throw loginError;

      // Se der tudo certo, redireciona o usuário para a página inicial
      navigate("/");
    } catch (err) {
      console.error("Erro na autenticação:", err);
      setError(err.message || "Falha ao entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const { error: providerError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin, // Redireciona de volta ao seu app após o login
        },
      });

      if (providerError) throw providerError;
    } catch (err) {
      console.error("Erro no login social:", err);
      setError(err.message || "Não foi possível conectar ao Google.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music2 className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900">icmlyrics_user</h1>
          </div>
          <p className="text-sm text-slate-500">Gerenciamento de Louvor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <div>
            <Label>Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="seu@email.com" 
              disabled={loading}
            />
          </div>
          
          <div>
            <Label>Senha</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Entrar com Google
          </Button>
          
          <div className="flex justify-between text-xs text-slate-500">
            <Link to="/register" className="hover:underline">Criar conta</Link>
            <Link to="/forgot-password" className="hover:underline">Esqueci a senha</Link>
          </div>
        </form>
      </div>
    </div>
  );
}