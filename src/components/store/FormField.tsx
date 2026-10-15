import type { InputHTMLAttributes } from "react";

/** Campo de formulário com rótulo, dica e erro inline (aria-invalid + aria-describedby). O id vira `chk-<name>`. */
export function FormField({
  name,
  label,
  error,
  hint,
  ...input
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id">) {
  const id = `chk-${name}`;
  const describedBy = [error ? `${id}-erro` : null, hint ? `${id}-dica` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-xs h-11 w-full rounded-md border bg-surface px-md text-base ${error ? "border-danger" : "border-border"}`}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-dica`} className="mt-xs text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="mt-xs text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
