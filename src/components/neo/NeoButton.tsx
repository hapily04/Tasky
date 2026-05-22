"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type NeoButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:bg-accent/90",
  secondary: "bg-surface hover:bg-chrome",
  ghost: "bg-transparent shadow-none border-transparent hover:border-ink",
  danger: "bg-accent-hot text-white hover:opacity-90",
};

export const NeoButton = forwardRef<HTMLButtonElement, NeoButtonProps>(function NeoButton(
  {
    children,
    variant = "primary",
    fullWidth,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`neo-border neo-shadow neo-shadow-hover inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
