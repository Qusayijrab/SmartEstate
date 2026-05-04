import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { clsx } from "clsx";

type FieldShellProps = {
  label?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  onDark?: boolean;
  className?: string;
};

export function FieldShell({
  label,
  error,
  hint,
  children,
  onDark,
  className,
}: FieldShellProps) {
  return (
    <div className={clsx("field", onDark && "on-dark", className)}>
      {label ? <label>{label}</label> : null}
      {children}
      {hint && !error ? (
        <span className={clsx("text-[12px]", onDark ? "text-white/55" : "text-[var(--muted)]")}>
          {hint}
        </span>
      ) : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
  onDark?: boolean;
};

export function Input({ label, error, hint, onDark, className, ...rest }: InputProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} onDark={onDark}>
      <input className={clsx(className)} {...rest} />
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
  onDark?: boolean;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  error,
  hint,
  onDark,
  options,
  className,
  ...rest
}: SelectProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} onDark={onDark}>
      <select className={clsx(className)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
  onDark?: boolean;
};

export function Textarea({
  label,
  error,
  hint,
  onDark,
  className,
  ...rest
}: TextareaProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} onDark={onDark}>
      <textarea className={clsx(className)} {...rest} />
    </FieldShell>
  );
}
