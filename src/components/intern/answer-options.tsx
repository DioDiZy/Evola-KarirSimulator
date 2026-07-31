import type { InternOption } from "@/lib/intern.functions";
import { Loader2 } from "lucide-react";

export function AnswerOptionList({
  options,
  disabled,
  pendingId,
  onSelect,
}: {
  options: InternOption[];
  disabled: boolean;
  pendingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2" role="group" aria-label="Pilihan jawaban">
      <p className="pl-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        Pilih satu jawaban
      </p>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(o.id)}
          className="group flex min-h-11 w-full items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm text-ink transition hover:border-primary-cyan hover:bg-primary-cyan/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="mt-0.5 font-mono-cl text-[11px] text-ink-muted group-hover:text-primary-cyan">
            {String.fromCharCode(65 + i)}
          </span>
          <span className="flex-1">{o.label}</span>
          {pendingId === o.id && <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary-cyan" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
