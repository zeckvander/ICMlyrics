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
      const fileExt = file.name.split(".").pop();
      const fileName = `${louvorId}/${Date.now()}.${fileExt}`;
      const bucketName = "cifras";
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true, 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("louvores")
        .update({ [field]: publicUrl })
        .eq("id", louvorId);

      if (updateError) throw updateError;

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