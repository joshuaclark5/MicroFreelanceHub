'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowRight, FileSignature, X } from 'lucide-react';

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredModal({ open, onOpenChange }: AuthRequiredModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);

  return (
    <dialog ref={dialog} aria-labelledby="save-agreement-title"
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}
      onCancel={() => onOpenChange(false)}
      onClose={() => onOpenChange(false)}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-gray-200 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/40">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <FileSignature className="h-7 w-7 text-emerald-700" aria-hidden="true" />
          <button type="button" aria-label="Close" onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>
        <h2 id="save-agreement-title" className="text-2xl font-semibold">Save your agreement</h2>
        <p className="mt-3 text-base leading-7 text-gray-600">
          Create an account to save your draft and create a client link.
          Connect Stripe when you are ready to accept payments.
        </p>
        <Link href="/login" className="mt-6 flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
          Continue Free <ArrowRight size={18} />
        </Link>
        <Link href="/login?mode=signin" className="mt-4 block text-center text-sm font-medium text-gray-700 underline underline-offset-4">Already have an account? Sign in</Link>
        <button type="button" onClick={() => onOpenChange(false)} className="mt-5 w-full py-2 text-sm text-gray-500">Keep editing</button>
      </div>
    </dialog>
  );
}
