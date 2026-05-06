'use client'

import { UploadCloud, Loader2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

interface FileUploadClientProps {
  uploadAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
}

export default function FileUploadClient({ uploadAction, disabled = false }: FileUploadClientProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus(); // Get pending status for the form this button belongs to

  return (
    <>
      <div className="relative">
        <input 
          type="file" 
          name="file" 
          id="file-upload" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.[0] && !pending && !disabled) { // Only trigger if not already pending or disabled
              btnRef.current?.click();
            }
          }}
          disabled={pending || disabled} // Disable input when pending or externally disabled
        />
        <label 
          htmlFor="file-upload" 
          className={`cursor-pointer flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            (pending || disabled) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'
          }`}
          aria-disabled={pending || disabled} // ARIA attribute for accessibility
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {pending ? 'Uploading...' : 'Upload File'}
        </label>
      </div>
      <button type="submit" ref={btnRef} formAction={uploadAction} className="hidden" disabled={pending || disabled} />
    </>
  );
}