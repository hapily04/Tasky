import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoCard } from "@/components/neo/NeoCard";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 p-6">
      <div className="neo-border neo-shadow bg-accent px-6 py-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
        TASKY
      </div>
      <NeoCard className="w-full text-center">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl">Goals you can finish</h1>
        <p className="mb-6 text-lg">Without the overwhelm.</p>
        <form
          action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/home" });
          }}
        >
          <NeoButton type="submit" fullWidth className="bg-[#5865F2] text-white hover:opacity-90">
            Sign in with Discord
          </NeoButton>
        </form>
        <p className="mt-4 text-sm font-medium">
          A Discord account is required to use Tasky.
        </p>
      </NeoCard>
    </main>
  );
}
