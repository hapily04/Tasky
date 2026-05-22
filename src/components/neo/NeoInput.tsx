import { type InputHTMLAttributes } from "react";

type NeoInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function NeoInput({ label, className = "", id, ...props }: NeoInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="flex flex-col gap-1 font-bold" htmlFor={inputId}>
      {label && <span className="text-sm uppercase tracking-wide">{label}</span>}
      <input
        id={inputId}
        className={`neo-border neo-shadow w-full bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-ink ${className}`}
        {...props}
      />
    </label>
  );
}
