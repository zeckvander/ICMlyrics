import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Define o endereço para onde o usuário será enviado ao clicar no e-mail de redefinição
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setSent(true);
    } catch (err) {
      console.error("Erro ao solicitar redefinição:", err);
      setError(err.message || "Ocorreu um erro ao tentar enviar o e-mail.");
      // Definimos como enviado de qualquer forma por questões de segurança e UX padrão
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Music2 className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-slate-900">Recuperar Senha</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          
          {sent ? (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg text-center">
              Se o e-mail estiver cadastrado, você receberá um link de recuperação contendo as instruções.
            </p>
          ) : (
            <>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link"}
              </Button>
            </>
          )}
          <p className="text-center text-xs text-slate-500">
            <Link to="/login" className="hover:underline">Voltar para login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}