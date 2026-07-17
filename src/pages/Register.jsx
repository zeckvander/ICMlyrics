import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { 
      setError("As senhas não coincidem."); 
      return; 
    }
    setLoading(true);
    try {
      // Registra o usuário diretamente no serviço de autenticação do Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // Avança para a etapa de verificação do código OTP enviado por e-mail
      setStep("otp");
    } catch (err) {
      setError(err.message || "Falha ao registrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Verifica o código OTP utilizando o Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      // Com o e-mail verificado, direciona o usuário ao painel inicial
      navigate("/");
    } catch (err) {
      setError(err.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (resendError) throw resendError;
      alert("Código reenviado com sucesso!");
    } catch (err) {
      setError(err.message || "Erro ao reenviar o código.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const { error: providerError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (providerError) throw providerError;
    } catch (err) {
      setError(err.message || "Falha no login com o Google.");
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
          <p className="text-sm text-slate-500">{step === "register" ? "Criar conta" : "Verificar email"}</p>
        </div>

        {step === "register" ? (
          <form onSubmit={handleRegister} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <div><Label>Confirmar Senha</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar Conta"}</Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>Registrar com Google</Button>
            <p className="text-center text-xs text-slate-500">Já tem conta? <Link to="/login" className="hover:underline">Entrar</Link></p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
            <p className="text-sm text-slate-600 text-center">Enviamos um código para <strong>{email}</strong></p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>{loading ? "Verificando..." : "Verificar"}</Button>
            <button type="button" onClick={handleResend} className="text-xs text-blue-600 hover:underline w-full text-center">Reenviar código</button>
          </form>
        )}
      </div>
    </div>
  );
}