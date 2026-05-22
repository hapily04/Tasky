export function getAvatarLetter(username: string): string {
  const first = username.trim()[0];
  if (first && /[a-zA-Z]/.test(first)) return first.toUpperCase();
  return "T";
}
