'use client'

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface ConfirmButtonProps {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
  form?: string;
  // Optional props for loading state
  loadingText?: string;
  loadingIcon?: React.ReactNode; // e.g., <Loader2 className="h-4 w-4 animate-spin" />
}

export default function ConfirmButton({ 
  action, 
  confirmMessage, 
  className, 
  children,
  form,
  loadingText = 'Processing...', // Default loading text
  loadingIcon // Will be provided by parent, or default to a spinner
}: ConfirmButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      formAction={async (formData: FormData) => {
        // Only show confirm dialog if not already pending
        if (!pending) {
          if (window.confirm(confirmMessage)) {
            await action(formData);
          }
        }
      }}
      className={className}
      form={form}
      disabled={pending} // Disable button when pending
      type="submit"
    >
      {pending ? (
        <>
          {loadingIcon || <Loader2 className="h-4 w-4 animate-spin" />}
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}