import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormImageUpload from "@/components/louvores/FormImageUpload";

const CATEGORIA_OPTIONS = ["Avulsos", "Cias", "Coletânea"];
const RITMO_OPTIONS = ["VALSA", "VALSEADO", "COUNTRY", "BÁSICO", "GUARÂNIA", "BÁSICO II", "MARCHA", "MARCHA MARCIAL", "FOX", "BALADA", "NOVO", "BLUE", "CANÇÃO", "TOADA", "REPIQUE"];

export default function LouvorForm({ initial, onSubmit, saving }) {
  const limparDados = (dados) => ({
    numero: dados?.numero || "",
    nome: dados?.nome || "",
    categoria: dados?.categoria || "Avulsos",
    bpm_compasso: dados?.bpm_compasso || "",
    ritmo: dados?.ritmo || "",
    mapa_musica: dados?.mapa_musica || "",
    link_referencia: dados?.link_referencia || "",
    sugestoes_ensaio: dados?.sugestoes_ensaio || "",
    cifra1_imagem: dados?.cifra1_imagem || "",
    cifra2_imagem: dados?.cifra2_imagem || "",
    instrumentos: dados?.instrumentos || "",
    soprano: dados?.soprano || "",
    contralto: dados?.contralto || "",
    tenor: dados?.tenor || "",
    baixo: dados?.baixo || "",
    letra_musica: dados?.letra_musica || "",
  });

  const [form, setForm] = React.useState(() => limparDados(initial));
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cabeçalho limpo apenas com o título. O fechar agora é 100% controlado pelo Sheet */}
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900">{initial ? "Editar Louvor" : "Novo Louvor"}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="input-numero">Número</Label>
          <Input id="input-numero" name="numero" value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="001" />
        </div>
        <div>
          <Label htmlFor="input-bpm">BPM/Compasso</Label>
          <Input id="input-bpm" name="bpm_compasso" value={form.bpm_compasso} onChange={(e) => set("bpm_compasso", e.target.value)} placeholder="120 4/4" />
        </div>
      </div>

      <div>
        <Label htmlFor="input-nome">Nome do Louvor *</Label>
        <Input id="input-nome" name="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} required placeholder="Nome da música" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="select-categoria">Categoria</Label>
          <Select name="categoria" value={form.categoria} onValueChange={(v) => set("categoria", v)}>
            <SelectTrigger id="select-categoria"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="select-ritmo">Ritmo</Label>
          <Select name="ritmo" value={form.ritmo} onValueChange={(v) => set("ritmo", v)}>
            <SelectTrigger id="select-ritmo"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {RITMO_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="input-tom">Tom</Label>
        <Input id="input-tom" name="mapa_musica" value={form.mapa_musica} onChange={(e) => set("mapa_musica", e.target.value)} placeholder="Tom da música" />
      </div>

      <div>
        <Label htmlFor="input-link">Partitura voz</Label>
        <Input id="input-link" name="link_referencia" value={form.link_referencia} onChange={(e) => set("link_referencia", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label htmlFor="input-instrumentos">Instrumentos</Label>
        <Input id="input-instrumentos" name="instrumentos" value={form.instrumentos} onChange={(e) => set("instrumentos", e.target.value)} placeholder="Ex: Violão, Teclado, Baixo" />
      </div>

      {["soprano", "contralto", "tenor", "baixo"].map((voz) => (
        <div key={voz}>
          <Label htmlFor={`input-${voz}`} className="capitalize">{voz}</Label>
          <Input id={`input-${voz}`} name={voz} value={form[voz]} onChange={(e) => set(voz, e.target.value)} placeholder="https://..." />
        </div>
      ))}

      <div>
        <Label htmlFor="textarea-sugestoes">Sugestões de Ensaio</Label>
        <Textarea id="textarea-sugestoes" name="sugestoes_ensaio" value={form.sugestoes_ensaio} onChange={(e) => set("sugestoes_ensaio", e.target.value)} rows={3} placeholder="Observações para o ensaio..." />
      </div>

      <FormImageUpload label="Cifra 1 - Imagem" value={form.cifra1_imagem} onChange={(url) => set("cifra1_imagem", url)} />
      <FormImageUpload label="Cifra 2 - Imagem" value={form.cifra2_imagem} onChange={(url) => set("cifra2_imagem", url)} />

      <div>
        <Label htmlFor="textarea-letra">Letra da Música</Label>
        <Textarea id="textarea-letra" name="letra_musica" value={form.letra_musica} onChange={(e) => set("letra_musica", e.target.value)} rows={6} placeholder="Cole a letra da música aqui..." />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Salvando..." : initial ? "Salvar Alterações" : "Adicionar Louvor"}
      </Button>
    </form>
  );
}