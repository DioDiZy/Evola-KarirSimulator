import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 backdrop-blur-md bg-background/70">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent border border-accent/30">
            <Flame className="h-4 w-4" />
          </span>
          <span className="font-display text-xl">CareerLab</span>
          <span className="eyebrow ml-2 hidden sm:inline">Mission Engine</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-ink-dim hover:text-ink transition-colors">
                Dashboard
              </Link>
              <Link to="/profile" className="text-ink-dim hover:text-ink transition-colors">
                Profil
              </Link>
              <button
                onClick={signOut}
                className="font-mono-cl text-xs uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-ink-dim hover:text-ink transition-colors">
                Masuk
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:brightness-110 transition"
              >
                Mulai
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
