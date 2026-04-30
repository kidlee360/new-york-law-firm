'use client'

import { UploadCloud } from "lucide-react";
import { useRef } from "react";

export default function FileUploadClient({ uploadAction }: { uploadAction: (formData: FormData) => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="relative">
        <input 
          type="file" 
          name="file" 
          id="file-upload" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.[0]) {
              btnRef.current?.click();
            }
          }}
        />
        <label 
          htmlFor="file-upload" 
          className="cursor-pointer flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Upload File
        </label>
      </div>
      <button type="submit" ref={btnRef} formAction={uploadAction} className="hidden" />
    </>
  );
}