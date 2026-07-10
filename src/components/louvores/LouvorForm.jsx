import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import FormImageUpload from "@/components/louvores/FormImageUpload";

const CATEGORIA_OPTIONS = ["Avulsos", "Cias", "Coletânea"];
const RITMO_OPTIONS = ["VALSA", "VALSEADO", "COUNTRY", "BÁSICO", "GUARÂNIA", "BÁSICO II", "MARCHA", "MARCHA MARCIAL", "FOX", "BALADA", "NOVO", "BLUE", "CANÇÃO", "TOADA", "REPIQUE"];

export default function LouvorForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    numero: "",
    nome: "",
    categoria: "Avulsos",
    bpm_compasso: "",
    ritmo: "",
    mapa_musica: "",
    link_referencia: "",
    sugestoes_ensaio: "",
    cifra_tom_original: "",
    cifra_tom_alternativo: "",
    cifra1_imagem: "",
    cifra2_imagem: "",
    instrumentos: "",
    soprano: "",
    contralto: "",
    tenor: "",
    baixo: "",
    letra_musica: "",
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-900">{initial ? "Editar Louvor" : "Novo Louvor"}</h2>
        <button type="button" onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Número</Label>
          <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="001" />
        </div>
        <div>
          <Label>BPM/Compasso</Label>
          <Input value={form.bpm_compasso} onChange={(e) => set("bpm_compasso", e.target.value)} placeholder="120 4/4" />
        </div>
      </div>

      <div>
        <Label>Nome do Louvor *</Label>
        <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required placeholder="Nome da música" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ritmo</Label>
          <Select value={form.ritmo} onValueChange={(v) => set("ritmo", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {RITMO_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Tom</Label>
        <Input value={form.mapa_musica} onChange={(e) => set("mapa_musica", e.target.value)} placeholder="Tom da música" />
      </div>

      <div>
        <Label>Partitura voz</Label>
        <Input value={form.link_referencia} onChange={(e) => set("link_referencia", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label>Instrumentos</Label>
        <Input value={form.instrumentos} onChange={(e) => set("instrumentos", e.target.value)} placeholder="Ex: Violão, Teclado, Baixo" />
      </div>

      <div>
        <Label>Soprano</Label>
        <Input value={form.soprano} onChange={(e) => set("soprano", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label>Contralto</Label>
        <Input value={form.contralto} onChange={(e) => set("contralto", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label>Tenor</Label>
        <Input value={form.tenor} onChange={(e) => set("tenor", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label>Baixo</Label>
        <Input value={form.baixo} onChange={(e) => set("baixo", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label>Sugestões de Ensaio</Label>
        <Textarea value={form.sugestoes_ensaio} onChange={(e) => set("sugestoes_ensaio", e.target.value)} rows={3} placeholder="Observações para o ensaio..." />
      </div>

      <FormImageUpload label="Cifra 1 - Imagem" value={form.cifra1_imagem} onChange={(url) => set("cifra1_imagem", url)} />
      <FormImageUpload label="Cifra 2 - Imagem" value={form.cifra2_imagem} onChange={(url) => set("cifra2_imagem", url)} />

      <div>
        <Label>Letra da Música</Label>
        <Textarea value={form.letra_musica} onChange={(e) => set("letra_musica", e.target.value)} rows={6} placeholder="Cole a letra da música aqui..." />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Salvando..." : initial ? "Salvar Alterações" : "Adicionar Louvor"}
      </Button>
    </form>
  );
}