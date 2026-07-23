import { RefObject, useEffect } from 'react';

export function useAccessibleModal(isOpen: boolean, dialogRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') { const nodes = focusable(); if (!nodes.length) return; const first=nodes[0]; const last=nodes[nodes.length-1]; if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); } }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [isOpen, dialogRef, onClose]);
}
