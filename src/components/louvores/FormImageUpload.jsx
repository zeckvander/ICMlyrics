import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";

export default function FormImageUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="relative mt-1">
          <img src={value} alt={label} className="w-full rounded-lg border border-slate-200" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 mt-1">
          <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleUpload} disabled={uploading} />
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
          <span className="text-xs text-slate-400">Enviar imagem .png ou .jpg</span>
        </label>
      )}
    </div>
  );
}