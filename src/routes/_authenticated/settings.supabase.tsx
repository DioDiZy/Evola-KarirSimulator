import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Database, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { testSupabaseConnection, type SupabaseConnectionTest } from "@/lib/supabase-connector.functions";

const STORAGE_KEY = "careerlab.supabase-connector";

const formSchema = z.object({
  url: z
    .string()
    .trim()
    .url("URL tidak valid")
    .max(200)
    .refine((v) => v.startsWith("https://"), "URL harus memakai https://"),
  publishableKey: z.string().trim().min(10, "Publishable key terlalu pendek").max(500),
  jwksUrl: z.string().trim().max(300).optional().or(z.literal("")),
});

type FormState = { url: string; publishableKey: string; jwksUrl: string; secretKey: string };

export const Route = createFileRoute("/_authenticated/settings/supabase")({
  head: () => ({
    meta: [
      { title: "Setup Konektor Supabase · CareerLab" },
      {
        name: "description",
        content:
          "Masukkan URL dan key project Supabase Anda, uji koneksinya, lalu simpan konfigurasi non-rahasia di perangkat ini.",
      },
      { property: "og:title", content: "Setup Konektor Supabase · CareerLab" },
      {
        property: "og:description",
        content: "Form pengaturan konektor Supabase untuk CareerLab: URL project, publishable key, dan uji koneksi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Gagal memuat halaman konektor</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl">Halaman tidak ditemukan</h1>
    </div>
  ),
  component: SupabaseConnectorPage,
});

function SupabaseConnectorPage() {
  const runTest = useServerFn(testSupabaseConnection);
  const [form, setForm] = useState<FormState>({ url: "", publishableKey: "", jwksUrl: "", secretKey: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SupabaseConnectionTest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FormState>;
      setForm((f) => ({
        ...f,
        url: saved.url ?? "",
        publishableKey: saved.publishableKey ?? "",
        jwksUrl: saved.jwksUrl ?? "",
      }));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  function validate() {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return null;
    }
    setErrors({});
    return parsed.data;
  }

  async function onTest() {
    const data = validate();
    if (!data) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await runTest({ data: { url: data.url, publishableKey: data.publishableKey } });
      setResult(res);
      (res.ok ? toast.success : toast.error)(res.message);
    } catch (err) {
      const message = (err as Error).message;
      setResult({ ok: false, status: 0, message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    const data = validate();
    if (!data) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ url: data.url, publishableKey: data.publishableKey, jwksUrl: data.jwksUrl ?? "" }),
    );
    setForm((f) => ({ ...f, secretKey: "" }));
    toast.success("Konfigurasi non-rahasia tersimpan di perangkat ini.");
  }

  function onClear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setForm({ url: "", publishableKey: "", jwksUrl: "", secretKey: "" });
    setResult(null);
    setErrors({});
    toast.success("Konfigurasi dihapus.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-12">
      <p className="eyebrow inline-flex items-center gap-2">
        <Database className="h-3.5 w-3.5" aria-hidden="true" /> Pengaturan
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Setup Konektor Supabase</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-dim">
        Masukkan URL project dan key dari halaman API settings project Supabase Anda, lalu uji koneksinya.
        URL, publishable key, dan JWKS URL disimpan lokal di browser ini.
      </p>

      <div className="surface-panel mt-6 flex gap-3 p-4 text-sm text-ink-dim" role="note">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary-cyan" aria-hidden="true" />
        <p>
          Backend CareerLab yang aktif tetap dikelola oleh Lovable Cloud. Form ini hanya menyimpan konfigurasi
          konektor untuk project Supabase eksternal — data misi dan akun Anda tidak dipindahkan.
        </p>
      </div>

      <form
        className="surface-panel mt-6 space-y-6 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void onTest();
        }}
      >
        <Field
          id="url"
          label="Supabase URL"
          placeholder="https://your-project.supabase.co"
          value={form.url}
          error={errors.url}
          onChange={(v) => setForm((f) => ({ ...f, url: v }))}
        />
        <Field
          id="publishableKey"
          label="Publishable / anon key"
          placeholder="sb_publishable_..."
          value={form.publishableKey}
          error={errors.publishableKey}
          hint="Aman disimpan di sisi klien."
          onChange={(v) => setForm((f) => ({ ...f, publishableKey: v }))}
        />
        <Field
          id="jwksUrl"
          label="JWKS URL (opsional)"
          placeholder="https://your-project.supabase.co/auth/v1/.well-known/jwks.json"
          value={form.jwksUrl}
          error={errors.jwksUrl}
          onChange={(v) => setForm((f) => ({ ...f, jwksUrl: v }))}
        />

        <div>
          <Label htmlFor="secretKey">Secret / service-role key</Label>
          <Input
            id="secretKey"
            type="password"
            autoComplete="off"
            placeholder="sb_secret_… (tidak disimpan)"
            value={form.secretKey}
            onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
            className="mt-1.5"
          />
          <p className="mt-1.5 flex gap-2 text-xs text-ink-muted">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-cyan" aria-hidden="true" />
            Key ini melewati semua aturan keamanan database, jadi tidak pernah disimpan atau dikirim dari
            halaman ini. Simpan secret hanya sebagai secret backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Uji koneksi
          </Button>
          <Button type="button" variant="secondary" onClick={onSave} disabled={busy}>
            Simpan konfigurasi
          </Button>
          <Button type="button" variant="ghost" onClick={onClear} disabled={busy}>
            Hapus
          </Button>
        </div>

        <div aria-live="polite">
          {result ? (
            <p
              className={`flex items-start gap-2 text-sm ${result.ok ? "text-primary-cyan" : "text-destructive"}`}
            >
              {result.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {result.message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  error,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 font-mono-cl text-sm"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
