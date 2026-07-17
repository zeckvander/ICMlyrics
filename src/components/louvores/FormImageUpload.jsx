import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function FormImageUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Gera um nome de arquivo único para evitar conflito de nomes repetidos
      const fileExt = file.name.split(".").pop();
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const bucketName = "cifras"; // Nome do seu bucket criado no Supabase

      // 2. Faz o upload da imagem para o Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Busca a URL pública que foi gerada pelo Supabase
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Envia a URL gerada para a função onChange correspondente
      onChange(publicUrl);
    } catch (err) {
      console.error("Erro no upload do arquivo:", err);
      alert("Erro ao enviar imagem: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="relative mt-1">
          <img src={value} alt={label} className="w-full rounded-lg border border-slate-200" />
          <button 
            type="button" 
            onClick={() => onChange("")} 
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 mt-1">
          <input 
            type="file" 
            className="hidden" 
            accept="image/png,image/jpeg" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : (
            <Upload className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-xs text-slate-400">Enviar imagem .png ou .jpg</span>
        </label>
      )}
    </div>
  );
}