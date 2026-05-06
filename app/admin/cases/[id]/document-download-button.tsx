'use client'

import React from 'react';
import { FileIcon } from 'lucide-react';
import { getSignedDocumentUrl } from './form/actions';

interface DocumentDownloadButtonProps {
  filePath: string;
  fileName: string;
  disabled?: boolean;
}

export default function DocumentDownloadButton({ filePath, fileName, disabled = false }: DocumentDownloadButtonProps) {
  const handleDownload = async () => {
    const url = await getSignedDocumentUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-3">
      <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
      <button
        type="button"
        onClick={handleDownload}
        className={`text-sm font-medium text-left transition-colors ${disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:text-blue-600 hover:underline'}`}
        disabled={disabled}
      >
        {fileName}
      </button>
    </div>
  );
}