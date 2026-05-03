'use client'

import { UploadCloud, Loader2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

export default function FileUploadClient({ uploadAction }: { uploadAction: (formData: FormData) => void }) {
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
            if (e.target.files?.[0] && !pending) { // Only trigger if not already pending
              btnRef.current?.click();
            }
          }}
          disabled={pending} // Disable input when pending
        />
        <label 
          htmlFor="file-upload" 
          className={`cursor-pointer flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            pending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'
          }`}
          aria-disabled={pending} // ARIA attribute for accessibility
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {pending ? 'Uploading...' : 'Upload File'}
        </label>
      </div>
      <button type="submit" ref={btnRef} formAction={uploadAction} className="hidden" disabled={pending} />
    </>
  );
}