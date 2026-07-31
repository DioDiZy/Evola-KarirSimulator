export function MissionProgress({
  answered,
  total,
  jobIndex,
  jobCount,
  compact,
}: {
  answered: number;
  total: number;
  jobIndex: number;
  jobCount: number;
  compact?: boolean;
}) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className={compact ? "" : "surface-panel p-4"}>
      <div className="flex items-center justify-between text-xs text-ink-dim">
        <span>
          Pekerjaan {Math.min(jobIndex + 1, jobCount)} dari {jobCount}
        </span>
        <span className="font-mono-cl">{pct}%</span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-label="Progres misi"
      >
        <div
          className="h-full rounded-full bg-primary-cyan transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">
        {answered} dari {total} pertanyaan terjawab
      </p>
    </div>
  );
}
