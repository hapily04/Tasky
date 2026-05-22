import { getAvatarLetter } from "@/lib/avatar";

type AvatarInitialProps = {
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
};

export function AvatarInitial({ username, size = "sm", className = "" }: AvatarInitialProps) {
  return (
    <span
      className={`neo-border flex shrink-0 items-center justify-center bg-accent font-bold ${sizes[size]} ${className}`}
      aria-hidden
    >
      {getAvatarLetter(username)}
    </span>
  );
}
