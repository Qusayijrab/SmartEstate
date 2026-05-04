"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
};

export function Modal({ open, onClose, title, children, width = 540 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full overflow-hidden rounded-[24px] bg-white p-7 shadow-[0_30px_60px_rgba(0,0,0,0.32)]"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
        >
          <X size={18} />
        </button>
        {title ? (
          <h3 className="mb-4 text-[26px] tracking-tight text-[var(--ink)]">{title}</h3>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  );
}
