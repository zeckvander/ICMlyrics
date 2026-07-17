import React, { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { isAdmin } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabaseClient";

export default function CifraImageTab({ louvorId, field, imageUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const admin = isAdmin();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Define um caminho único para o arquivo dentro do Bucket do Supabase (ex: louvor_id/timestamp_nome)
      const fileExt = file.name.split(".").pop();
      const fileName = `${louvorId}/${Date.now()}.${fileExt}`;
      const bucketName = "cifras"; // Nome do seu bucket criado no Supabase

      // 2. Faz o upload da imagem no Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true, // Substitui se já houver um arquivo idêntico
        });

      if (uploadError) throw uploadError;

      // 3. Recupera a URL pública do arquivo enviado
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // 4. Atualiza a coluna do louvor no banco de dados com a nova URL pública
      const { error: updateError } = await supabase
        .from("louvores")
        .update({ [field]: publicUrl })
        .eq("id", louvorId);

      if (updateError) throw updateError;

      // Executa o callback de sucesso para atualizar o estado no componente pai
      onUploaded?.();
    } catch (err) {
      console.error("Erro no upload da cifra:", err);
      alert("Erro ao enviar imagem: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <img src={imageUrl} alt="Cifra" className="w-full rounded-lg" />
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma imagem de cifra adicionada</p>
      )}
      {admin && (
        <label className="inline-flex items-center gap-1.5 h-8 rounded-md px-3 text-xs border border-input bg-transparent cursor-pointer hover:bg-accent transition-colors">
          <input 
            type="file" 
            className="hidden" 
            accept="image/png,image/jpeg" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {imageUrl ? "Trocar imagem" : "Enviar imagem"}
        </label>
      )}
    </div>
  );
}