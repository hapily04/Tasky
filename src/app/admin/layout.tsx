import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeFromPreferences } from "@/lib/preferences";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/?error=session_expired");
  if (user.role !== "ADMIN") redirect("/home");

  const themePreference = themeFromPreferences(user.preferences ?? {});

  return (
    <ThemeProvider initialPreference={themePreference}>
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        <AppHeader username={user.username} role={user.role} />
        {children}
      </div>
    </ThemeProvider>
  );
}
