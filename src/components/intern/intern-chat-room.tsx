import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, Wifi, X } from "lucide-react";
import { toast } from "sonner";
import {
  answerInternQuestion,
  type InternAnswerRecord,
  type InternJob,
} from "@/lib/intern.functions";
import {
  InternMessageBubble,
  SeniorMessageBubble,
  SystemMessageBubble,
  TypingIndicator,
  formatTime,
  type ChatMessage,
} from "./chat-bubbles";
import { type InternRole } from "@/lib/intern-roles";
import { AnswerOptionList } from "./answer-options";
import { MissionProgress } from "./mission-progress";
import { SeniorAvatar } from "./senior-avatar";

type FlatQuestion = {
  jobIndex: number;
  jobId: string;
  jobTitle: string;
  questionIndex: number;
  id: string;
  senior_message: string;
  question_text: string;
  options: { id: string; label: string }[];
};

export type InternChatRoomProps = {
  mission: {
    id: string;
    slug: string;
    title: string;
    reward_credit: number;
    senior_name: string;
    senior_title: string;
    target_role?: string;
  };
  track: { slug: string; name: string } | null;
  jobs: InternJob[];
  answers: InternAnswerRecord[];
  displayName: string;
};

let counter = 0;
const nextId = () => `m${++counter}`;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function InternChatRoom({ mission, track, jobs, answers, displayName }: InternChatRoomProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const flat: FlatQuestion[] = useMemo(
    () =>
      jobs.flatMap((j, jobIndex) =>
        j.questions.map((q, questionIndex) => ({
          jobIndex,
          jobId: j.id,
          jobTitle: j.title,
          questionIndex,
          id: q.id,
          senior_message: q.senior_message,
          question_text: q.question_text,
          options: q.options,
        })),
      ),
    [jobs],
  );

  const answerMap = useMemo(() => new Map(answers.map((a) => [a.question_id, a])), [answers]);
  const answeredInitially = flat.filter((q) => answerMap.has(q.id)).length;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState(answeredInitially);
  const [activeQuestion, setActiveQuestion] = useState<FlatQuestion | null>(null);
  const [typing, setTyping] = useState(false);
  const [pendingOption, setPendingOption] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({
    correct: answers.filter((a) => a.is_correct).length,
    incorrect: answers.filter((a) => !a.is_correct).length,
  });
  const [infoOpen, setInfoOpen] = useState(false);

  const alive = useRef(true);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = useCallback((msg: Omit<ChatMessage, "id" | "time">) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId(), time: formatTime() }]);
  }, []);

  const wait = useCallback(async (ms: number) => {
    if (prefersReducedMotion()) return;
    await new Promise((r) => setTimeout(r, ms));
  }, []);

  const askFrom = useCallback(
    async (index: number, animate: boolean) => {
      if (index >= flat.length) {
        setActiveQuestion(null);
        setFinished(true);
        push({ kind: "system", text: "Misi selesai", tone: "reward" });
        return;
      }
      const q = flat[index];
      const isNewJob = index === 0 || flat[index - 1].jobIndex !== q.jobIndex;
      if (isNewJob) {
        push({
          kind: "system",
          text: `Pekerjaan ${q.jobIndex + 1}: ${q.jobTitle}`,
          tone: "checkpoint",
        });
      }
      if (animate) {
        setTyping(true);
        await wait(700);
        if (!alive.current) return;
        setTyping(false);
      }
      push({ kind: "senior", text: q.senior_message });
      if (animate) {
        setTyping(true);
        await wait(600);
        if (!alive.current) return;
        setTyping(false);
      }
      push({ kind: "senior", text: q.question_text });
      setActiveQuestion(q);
    },
    [flat, push, wait],
  );

  // Build transcript: replay stored answers instantly, then ask the next question.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    alive.current = true;

    const replay: ChatMessage[] = [];
    let lastJob = -1;
    for (let i = 0; i < answeredInitially; i++) {
      const q = flat[i];
      const a = answerMap.get(q.id)!;
      if (q.jobIndex !== lastJob) {
        lastJob = q.jobIndex;
        replay.push({ id: nextId(), kind: "system", text: `Pekerjaan ${q.jobIndex + 1}: ${q.jobTitle}`, tone: "checkpoint", time: formatTime() });
      }
      replay.push({ id: nextId(), kind: "senior", text: q.senior_message, time: formatTime() });
      replay.push({ id: nextId(), kind: "senior", text: q.question_text, time: formatTime() });
      replay.push({ id: nextId(), kind: "intern", text: a.selected_label, time: formatTime() });
      replay.push({
        id: nextId(),
        kind: "senior",
        text: a.feedback + (a.explanation ? `\n\n${a.explanation}` : ""),
        tone: a.is_correct ? "success" : "warn",
        time: formatTime(),
      });
    }

    if (replay.length === 0) {
      replay.push({
        id: nextId(),
        kind: "senior",
        text: `Halo${displayName ? `, ${displayName}` : ""}! Aku ${mission.senior_name}, ${mission.senior_title} di tim ini. Selamat datang di hari pertamamu.`,
        time: formatTime(),
      });
      replay.push({
        id: nextId(),
        kind: "senior",
        text: `Hari ini kita kerjakan: ${mission.title}. Ada ${jobs.length} pekerjaan, santai saja — aku bantu di tiap langkah.`,
        time: formatTime(),
      });
    } else {
      replay.unshift({
        id: nextId(),
        kind: "system",
        text: "Melanjutkan percakapan sebelumnya",
        time: formatTime(),
      });
    }
    setMessages(replay);
    void askFrom(answeredInitially, replay.length > 0 && answeredInitially === 0);

    return () => {
      alive.current = false;
    };
  }, [answerMap, answeredInitially, askFrom, displayName, flat, jobs.length, mission]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, typing, activeQuestion]);

  const mutation = useMutation({
    mutationFn: (vars: { questionId: string; optionId: string }) =>
      answerInternQuestion({ data: { missionId: mission.id, ...vars } }),
    onSuccess: async (res) => {
      setPendingOption(null);
      setActiveQuestion(null);
      push({ kind: "intern", text: res.selectedLabel });
      setStats({ correct: res.correctCount, incorrect: res.incorrectCount });

      setTyping(true);
      await wait(800);
      if (!alive.current) return;
      setTyping(false);
      push({
        kind: "senior",
        text: res.feedback + (res.explanation ? `\n\n${res.explanation}` : ""),
        tone: res.isCorrect ? "success" : "warn",
      });

      const nextIndex = cursor + 1;
      const finishedJob =
        nextIndex < flat.length && flat[nextIndex].jobIndex !== flat[cursor].jobIndex;
      if (finishedJob) {
        push({ kind: "system", text: `Checkpoint: ${flat[cursor].jobTitle} selesai`, tone: "checkpoint" });
      }
      if (res.creditAwarded > 0) {
        push({ kind: "system", text: `+${res.creditAwarded} kredit karier`, tone: "reward" });
        toast.success(`Misi selesai! +${res.creditAwarded} kredit`);
      }
      if (res.roleUnlocked) {
        toast.success("Selamat! Role Pekerja kini terbuka.");
      }
      setCursor(nextIndex);
      // Keep the running transcript query untouched; refresh only the surrounding data.
      void qc.invalidateQueries({ queryKey: ["intern", "role-access"] });
      void qc.invalidateQueries({ queryKey: ["intern", "missions"] });
      void qc.invalidateQueries({ queryKey: ["intern", "tracks"] });
      void qc.invalidateQueries({ queryKey: ["intern", "result"] });
      if (res.missionCompleted) {
        void qc.invalidateQueries({ queryKey: ["intern", "run", mission.slug] });
      }
      await askFrom(nextIndex, true);
    },
    onError: (e) => {
      setPendingOption(null);
      setTyping(false);
      const msg = e instanceof Error ? e.message : "Gagal menyimpan jawaban. Coba lagi.";
      push({ kind: "system", text: `${msg} Pilih jawabanmu sekali lagi.`, tone: "warn" });
      toast.error(msg);
    },
  });

  function handleSelect(optionId: string) {
    if (!activeQuestion || mutation.isPending) return;
    setPendingOption(optionId);
    mutation.mutate({ questionId: activeQuestion.id, optionId });
  }

  const answered = stats.correct + stats.incorrect;
  const currentJobIndex = flat[Math.min(cursor, flat.length - 1)]?.jobIndex ?? 0;

  const InfoPanel = (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Misi</p>
        <p className="mt-1 font-display text-xl leading-tight">{mission.title}</p>
        <p className="mt-1 text-sm text-ink-dim">{track?.name}</p>
      </div>
      <MissionProgress
        answered={answered}
        total={flat.length}
        jobIndex={currentJobIndex}
        jobCount={jobs.length}
        compact
      />
      <ul className="space-y-2">
        {jobs.map((j, i) => {
          const done = i < currentJobIndex || finished;
          return (
            <li
              key={j.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                i === currentJobIndex && !finished
                  ? "border-primary-cyan/50 bg-primary-cyan/5 text-ink"
                  : "border-line text-ink-dim"
              }`}
            >
              <span className="font-mono-cl text-[11px] text-ink-muted">0{i + 1}</span>{" "}
              {j.title}
              {done && <span className="ml-2 text-[11px] text-primary-cyan">selesai</span>}
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-line px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Benar</p>
          <p className="font-display text-2xl text-primary-cyan">{stats.correct}</p>
        </div>
        <div className="rounded-lg border border-line px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Salah</p>
          <p className="font-display text-2xl">{stats.incorrect}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface-2/40 lg:min-h-[calc(100dvh-11rem)]">
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur-md">
            <Link
              to="/magang/$trackSlug"
              params={{ trackSlug: track?.slug ?? "" }}
              search={{ role: (mission.target_role ?? "magang") as InternRole }}
              aria-label="Kembali ke daftar misi"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-ink-dim hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <SeniorAvatar name={mission.senior_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{mission.senior_name}</p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-ink-muted">
                <Wifi className="h-3 w-3 text-primary-cyan" aria-hidden="true" /> Online ·{" "}
                {track?.name} · {mission.title}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="font-mono-cl text-xs text-ink-dim">
                {answered}/{flat.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Progres</p>
            </div>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="Lihat informasi misi"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-dim hover:text-ink lg:hidden"
            >
              <Info className="h-4 w-4" />
            </button>
          </header>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.map((m) =>
              m.kind === "senior" ? (
                <SeniorMessageBubble key={m.id} message={m} seniorName={mission.senior_name} />
              ) : m.kind === "intern" ? (
                <InternMessageBubble key={m.id} message={m} />
              ) : (
                <SystemMessageBubble key={m.id} message={m} />
              ),
            )}
            {typing && <TypingIndicator seniorName={mission.senior_name} />}
          </div>

          {/* Composer: answer options */}
          <div className="border-t border-line bg-surface/85 px-4 py-4 backdrop-blur-md sm:px-6">
            {activeQuestion ? (
              <AnswerOptionList
                options={activeQuestion.options}
                disabled={mutation.isPending}
                pendingId={pendingOption}
                onSelect={handleSelect}
              />
            ) : finished ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-dim">Semua pekerjaan selesai. Lihat evaluasi lengkapmu.</p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/magang/hasil/$missionSlug", params: { missionSlug: mission.slug } })}
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110"
                >
                  Lihat hasil misi
                </button>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Menunggu {mission.senior_name}…</p>
            )}
          </div>
        </section>

        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="surface-panel sticky top-20 p-5">{InfoPanel}</div>
        </aside>
      </div>

      {/* Mobile / tablet info drawer */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Informasi misi">
          <button
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            aria-label="Tutup informasi misi"
            onClick={() => setInfoOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Informasi Misi</p>
              <button
                onClick={() => setInfoOpen(false)}
                aria-label="Tutup"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {InfoPanel}
          </div>
        </div>
      )}
    </div>
  );
}
