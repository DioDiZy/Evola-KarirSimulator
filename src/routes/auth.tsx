import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  next: z.string().optional(),
});

function safeNext(next: string | undefined): string {
  if (!next) return "/dashboard";
  // same-origin relative paths only
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar · Evola" },
      {
        name: "description",
        content:
          "Masuk atau daftar untuk mulai simulasi karier di Evola Simulasi Kerja.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const nextPath = safeNext(next);
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.assign(nextPath);
    });
  }, [nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const returnUrl = new URL(nextPath, window.location.origin).toString();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: returnUrl,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Akun dibuat. Mengalihkan…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      window.location.assign(nextPath);
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const returnUrl = new URL(nextPath, window.location.origin).toString();
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnUrl,
    });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    window.location.assign(nextPath);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 grid lg:grid-cols-2">
        <section className="hidden lg:flex relative border-r border-line grid-bg items-center justify-center p-12">
          <div className="max-w-md">
            <p className="eyebrow">Evola Simulasi Kerja</p>
            <h1 className="mt-6 font-display text-5xl leading-tight">
              Satu akun. <br />{" "}
              <span className="text-accent">Semua jalur karier.</span>
            </h1>
            <p className="mt-6 text-ink-dim">
              Progres tiap jalur profesi disimpan terpisah. Ganti bidang kapan
              saja — Evola akan mengingat posisimu di setiap track.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="flex border border-line rounded-md p-1 bg-surface">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-sm py-2 rounded ${tab === t ? "bg-accent text-accent-ink" : "text-ink-dim"}`}
                >
                  {t === "signin" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {tab === "signup" && (
                <Field label="Nama tampilan">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Nama panggilan"
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="kamu@email.com"
                />
              </Field>
              <Field label="Kata sandi">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Minimal 8 karakter"
                />
              </Field>
              <button
                disabled={loading}
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {tab === "signin" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
              <div className="flex-1 h-px bg-line" />
              atau
              <div className="flex-1 h-px bg-line" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-md border border-line-strong py-2.5 text-sm hover:border-accent transition disabled:opacity-60"
            >
              Lanjutkan dengan Google
            </button>

            <p className="mt-8 text-center text-xs text-ink-muted">
              Dengan lanjut, kamu setuju pada ketentuan Evola.{" "}
              <Link to="/" className="underline hover:text-ink">
                Kembali ke beranda
              </Link>
            </p>
          </div>
        </section>
      </main>
      <style>{`.input{width:100%;background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:.55rem .75rem;font-size:.875rem;color:var(--ink);outline:none} .input:focus{border-color:var(--accent)}`}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
