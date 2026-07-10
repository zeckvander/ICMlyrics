import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2 } from "lucide-react";
import { isAdmin } from "@/lib/adminAuth";

export default function CifraImageTab({ louvorId, field, imageUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const admin = isAdmin();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Louvor.update(louvorId, { [field]: file_url });
      onUploaded?.();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
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
          <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleUpload} disabled={uploading} />
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {imageUrl ? "Trocar imagem" : "Enviar imagem"}
        </label>
      )}
    </div>
  );
}