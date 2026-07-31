import { CheckCircle2, Flag, Info, Sparkle, AlertCircle } from "lucide-react";
import { SeniorAvatar } from "./senior-avatar";

export type ChatMessage = {
  id: string;
  kind: "senior" | "intern" | "system";
  text: string;
  tone?: "success" | "warn" | "checkpoint" | "reward";
  time: string;
};

export function formatTime(d = new Date()) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const enter = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300";

export function SeniorMessageBubble({
  message,
  seniorName,
}: {
  message: ChatMessage;
  seniorName: string;
}) {
  const tone = message.tone;
  return (
    <div className={`flex items-end gap-2 ${enter}`}>
      <SeniorAvatar name={seniorName} size="sm" />
      <div className="max-w-[85%] sm:max-w-[72%]">
        <div className="rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink shadow-sm">
          {tone === "success" && (
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary-cyan">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Jawaban tepat
            </p>
          )}
          {tone === "warn" && (
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-danger">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Perlu diperbaiki
            </p>
          )}
          <p className="whitespace-pre-line">{message.text}</p>
        </div>
        <p className="mt-1 pl-1 text-[10px] text-ink-muted">
          {seniorName} · {message.time}
        </p>
      </div>
    </div>
  );
}

export function InternMessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex justify-end ${enter}`}>
      <div className="max-w-[85%] sm:max-w-[72%]">
        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {message.text}
        </div>
        <p className="mt-1 pr-1 text-right text-[10px] text-ink-muted">Kamu · {message.time}</p>
      </div>
    </div>
  );
}

export function SystemMessageBubble({ message }: { message: ChatMessage }) {
  const Icon = message.tone === "reward" ? Sparkle : message.tone === "checkpoint" ? Flag : Info;
  return (
    <div className={`flex justify-center ${enter}`} role="status">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/80 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-dim">
        <Icon className="h-3.5 w-3.5 text-primary-cyan" aria-hidden="true" />
        {message.text}
      </p>
    </div>
  );
}

export function TypingIndicator({ seniorName }: { seniorName: string }) {
  return (
    <div className="flex items-end gap-2" aria-live="polite" aria-label={`${seniorName} sedang mengetik`}>
      <SeniorAvatar name={seniorName} size="sm" />
      <div className="rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3 shadow-sm">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ink-muted motion-safe:animate-bounce"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
