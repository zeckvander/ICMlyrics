import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await base44.auth.resetPasswordRequest(email); } catch {}
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Music2 className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-slate-900">Recuperar Senha</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          {sent ? (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg text-center">Se o email estiver cadastrado, você receberá um link de recuperação.</p>
          ) : (
            <>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar Link"}</Button>
            </>
          )}
          <p className="text-center text-xs text-slate-500"><Link to="/login" className="hover:underline">Voltar para login</Link></p>
        </form>
      </div>
    </div>
  );
}