'use client'

import { useFormStatus } from 'react-dom'
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  form?: string;
  icon?: React.ReactNode;
  loadingText?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}

export function SubmitButton({ children, className, form, icon, loadingText = 'Processing...', formAction }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      form={form}
      formAction={formAction}
      disabled={pending}
    >
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> {loadingText}</> : <>{icon} {children}</>}
    </button>
  );
}