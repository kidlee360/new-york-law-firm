'use client'

import React from 'react';

interface ConfirmButtonProps {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
  form?: string;
}

export default function ConfirmButton({ 
  action, 
  confirmMessage, 
  className, 
  children,
  form
}: ConfirmButtonProps) {
  return (
    <button
      formAction={async (formData: FormData) => {
        if (window.confirm(confirmMessage)) {
          await action(formData);
        }
      }}
      className={className}
      form={form}
      type="submit"
    >
      {children}
    </button>
  );
}