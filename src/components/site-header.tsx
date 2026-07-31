import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type Variant = "landing" | "app";
type Tone = "light" | "dark";

export function SiteHeader({
  variant = "app",
  tone = "light",
}: { variant?: Variant; tone?: Tone } = {}) {
  const { user } = useSession();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== "landing") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/", replace: true });
    setOpen(false);
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {user ? (
        <>
          <Link to="/dashboard" onClick={onNavigate} className="text-ink-dim hover:text-primary-cyan transition-colors min-h-11 inline-flex items-center">
            Dashboard
          </Link>
          <Link to="/profile" onClick={onNavigate} className="text-ink-dim hover:text-primary-cyan transition-colors min-h-11 inline-flex items-center">
            Profil
          </Link>
          <button
            onClick={signOut}
            className="font-mono-cl text-xs uppercase tracking-widest text-ink-muted hover:text-ink min-h-11"
          >
            Keluar
          </button>
        </>
      ) : (
        <>
          <Link to="/auth" onClick={onNavigate} className="text-ink-dim hover:text-primary-cyan transition-colors min-h-11 inline-flex items-center">
            Masuk
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            onClick={onNavigate}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition min-h-11"
          >
            Mulai
          </Link>
        </>
      )}
    </>
  );

  if (variant === "landing") {
    return (
      <>
        <header
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(94%,64rem)] rounded-full border transition-all duration-300 ${
            scrolled
              ? "border-line bg-surface/85 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]"
              : "border-line/70 bg-surface/70 backdrop-blur-md"
          }`}
          aria-label="Navigasi utama"
        >
          <div className="flex items-center justify-between px-5 h-14">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary-cyan/12 text-primary-cyan border border-primary-cyan/30">
                <Flame className="h-3.5 w-3.5" />
              </span>
              <span className="font-display text-base text-ink">CareerLab</span>
              <span className="eyebrow ml-1 hidden sm:inline text-[10px]">Mission Engine</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm">
              <NavLinks />
            </nav>

            <button
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {open && (
          <div
            id="landing-mobile-menu"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[min(94%,24rem)] rounded-2xl border border-line bg-surface/95 backdrop-blur-xl p-5 shadow-2xl md:hidden"
          >
            <nav className="flex flex-col gap-4 text-base">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 backdrop-blur-md bg-surface/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-cyan/12 text-primary-cyan border border-primary-cyan/30">
            <Flame className="h-4 w-4" />
          </span>
          <span className="font-display text-xl truncate">CareerLab</span>
          <span className="eyebrow ml-2 hidden sm:inline">Mission Engine</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLinks />
        </nav>

        <button
          className="md:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-ink"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="app-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div
          id="app-mobile-menu"
          className="md:hidden border-t border-line bg-surface"
        >
          <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 text-base">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}
