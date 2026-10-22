"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/text";

export const controlClass =
  "w-full min-h-11 min-w-0 max-w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground outline-none transition focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  pending?: boolean;
}) {
  const styles = {
    primary: "oe-btn",
    secondary: "border border-border bg-card text-foreground hover:bg-accent-soft",
    ghost: "text-foreground hover:bg-accent-soft",
    danger: "bg-danger text-white hover:brightness-95",
  };
  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm",
        styles[variant],
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label htmlFor={id} className="oe-label">{label}</label> : null}
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-24 resize-y", props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, props.className)} />;
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const styles = {
    info: "border-border bg-accent-soft text-foreground",
    success: "border-success/30 bg-success-soft text-foreground",
    error: "border-danger/30 bg-danger-soft text-foreground",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", styles[tone])}>
      {children}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="oe-card oe-pad flex flex-col items-start gap-3">
      <h2 className="text-lg font-semibold tracking-tight"><span className="border-b-2 border-mark pb-0.5">{title}</span></h2>
      <p className="max-w-xl text-sm leading-6 text-muted">{description}</p>
      {action}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "danger" | "warning" | "success" | "accent" }) {
  const styles = {
    neutral: "bg-background text-muted",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    accent: "bg-accent-soft text-accent",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles[tone])}>{children}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="oe-section text-2xl sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
    </header>
  );
}

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-sidebar/50" aria-label="Fechar diálogo" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="oe-card relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-accent-soft" aria-label="Fechar" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
