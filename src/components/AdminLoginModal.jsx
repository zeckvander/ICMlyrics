import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { loginAdmin } from "@/lib/adminAuth";

export default function AdminLoginModal({ open, onOpenChange, onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginAdmin(user, pass)) {
      setUser("");
      setPass("");
      setError("");
      onOpenChange?.(false);
      onSuccess?.();
    } else {
      setError("Credenciais inválidas.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            <DialogTitle>Acesso Administrador</DialogTitle>
          </div>
          <DialogDescription>Entre com suas credenciais de administrador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Usuário</Label>
            <Input value={user} onChange={(e) => { setUser(e.target.value); setError(""); }} autoFocus />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(""); }} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}