import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "gold" | "small-gold" | "ghost" | "ghost-dark";
type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

function variantClass(v: Variant = "gold"): string {
  if (v === "small-gold") return "small-gold";
  if (v === "ghost") return "ghost-btn";
  if (v === "ghost-dark") return "ghost-btn ghost-btn-dark";
  return "gold-btn";
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant,
  children,
  className,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={clsx(variantClass(variant), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export function LinkButton({
  variant,
  children,
  className,
  href,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(variantClass(variant), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function ArrowDownIcon() {
  return (
    <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 5V19"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M6.5 13.5L12 19L17.5 13.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
