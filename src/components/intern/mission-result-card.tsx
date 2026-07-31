import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle, Trophy, ArrowRight, BookOpen } from "lucide-react";
import { SeniorAvatar } from "./senior-avatar";

export function MissionResultCard({
  missionTitle,
  trackName,
  trackSlug,
  seniorName,
  jobsDone,
  correct,
  incorrect,
  credit,
  nextMissionSlug,
}: {
  missionTitle: string;
  trackName: string;
  trackSlug: string;
  seniorName: string;
  jobsDone: number;
  correct: number;
  incorrect: number;
  credit: number;
  nextMissionSlug?: string | null;
}) {
  const total = correct + incorrect;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const good = pct >= 70;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="surface-panel p-6 sm:p-8">
        <p className="eyebrow">Hasil Misi Magang</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">{missionTitle}</h1>
        <p className="mt-1 text-sm text-ink-dim">{trackName}</p>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-6xl text-primary-cyan">{pct}%</span>
          <span className="font-mono-cl text-sm text-ink-muted">tingkat keberhasilan</span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Item label="Pekerjaan selesai" value={String(jobsDone)} />
          <Item label="Total pertanyaan" value={String(total)} />
          <Item
            label="Jawaban benar"
            value={String(correct)}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-primary-cyan" aria-hidden="true" />}
          />
          <Item
            label="Jawaban salah"
            value={String(incorrect)}
            icon={<XCircle className="h-3.5 w-3.5 text-danger" aria-hidden="true" />}
          />
        </dl>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-primary-cyan/30 bg-primary-cyan/5 px-4 py-3">
          <Trophy className="h-4 w-4 text-primary-cyan" aria-hidden="true" />
          <p className="text-sm">
            Kredit diperoleh: <strong className="text-primary-cyan">{credit}</strong>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/magang/$trackSlug"
            params={{ trackSlug }}
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm hover:border-primary-cyan"
          >
            Kembali ke daftar misi
          </Link>
          {nextMissionSlug && (
            <Link
              to="/magang/misi/$missionSlug"
              params={{ missionSlug: nextMissionSlug }}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              Misi berikutnya <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          <Link
            to="/profile"
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm hover:border-primary-cyan"
          >
            Lihat progres karier
          </Link>
        </div>
      </div>

      <div className="surface-panel p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <SeniorAvatar name={seniorName} size="lg" />
          <div>
            <p className="font-medium">{seniorName}</p>
            <p className="text-xs text-ink-muted">Catatan penutup dari senior</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink-dim">
          {good
            ? `Kerja bagus. Kamu menangkap inti dari tiap pekerjaan dan alasan di balik keputusannya. Pertahankan kebiasaan memeriksa konteks sebelum bertindak.`
            : `Terima kasih sudah menyelesaikan misinya. Beberapa jawaban masih meleset, dan itu wajar untuk anak magang. Fokus dulu pada memahami alasan di balik setiap keputusan, bukan menghafal jawabannya.`}
        </p>

        <div className="mt-6">
          <p className="inline-flex items-center gap-2 eyebrow">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Rekomendasi belajar
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-dim">
            {(good
              ? [
                  "Coba misi magang berikutnya di bidang yang sama untuk memperdalam konteks.",
                  "Tinjau kembali penjelasan senior pada jawaban yang kamu ragukan.",
                  "Mulai perhatikan bagaimana keputusan kecil memengaruhi pengguna akhir.",
                ]
              : [
                  "Ulangi membaca penjelasan pada pertanyaan yang salah, satu per satu.",
                  "Latih kebiasaan bertanya: masalah apa yang sebenarnya sedang diselesaikan?",
                  "Kerjakan kembali misi ini setelah jeda untuk menguji pemahamanmu.",
                ]
            ).map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-cyan" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
