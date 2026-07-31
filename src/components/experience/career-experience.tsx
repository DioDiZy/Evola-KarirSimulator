import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@/components/client-only";
import { useSession } from "@/hooks/use-session";
import type { CareerTunnelField } from "@/components/dashboard/career-screen";
import { ExperienceScene } from "./experience-scene";
import { ExperienceOverlay } from "./experience-overlay";
import { useQualityTier } from "./use-quality-tier";
import {
  CHAPTERS,
  EXPERIENCE_VH,
  chapterAt,
  cutOpacity,
  localProgress,
  type ChapterId,
} from "./experience-progress";
import { ExperienceFallback } from "./experience-fallback";

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

type Props = { fields: CareerTunnelField[] };

/**
 * Persistent 3D experience landing page.
 * Scroll halaman (bukan nested scrollbar) menjadi progress perjalanan.
 */
export function CareerExperience({ fields }: Props) {
  const navigate = useNavigate();
  const { user } = useSession();
  const tier = useQualityTier();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const [mode, setMode] = useState<"checking" | "webgl" | "fallback">("checking");
  const [chapter, setChapter] = useState<ChapterId>("entrance");
  const [fieldIndex, setFieldIndex] = useState(0);
  const [viewport, setViewport] = useState({ width: 1280, isMobile: false });
  const [reduced, setReduced] = useState(false);

  const visibleFields = useMemo(() => fields.slice(0, 4), [fields]);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);
    setMode(checkWebGL() ? "webgl" : "fallback");

    const onResize = () => {
      setViewport({ width: window.innerWidth, isMobile: window.innerWidth < 768 });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Global scroll → progress (ref, tanpa re-render tiap frame)
  useEffect(() => {
    if (mode !== "webgl") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      progressRef.current = p;

      const c = chapterAt(p);
      setChapter((prev) => (prev === c.id ? prev : c.id));

      if (c.id === "fields" && visibleFields.length > 0) {
        const lp = localProgress(p, CHAPTERS[2]);
        const idx = Math.min(
          visibleFields.length - 1,
          Math.floor(lp * visibleFields.length + 0.15),
        );
        setFieldIndex((prev) => (prev === idx ? prev : idx));
      }

      if (fadeRef.current) {
        fadeRef.current.style.opacity = String(cutOpacity(p));
      }
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [mode, visibleFields.length]);

  const onActivateField = useCallback(
    (slug: string) => {
      const field = visibleFields.find((f) => f.slug === slug);
      if (!field || field.status !== "active") return;
      navigate({ to: "/fields/$fieldSlug", params: { fieldSlug: slug } });
    },
    [navigate, visibleFields],
  );

  if (mode === "fallback") {
    return <ExperienceFallback fields={visibleFields} signedIn={!!user} />;
  }

  return (
    <div ref={wrapperRef} className="exp-root relative" style={{ height: `${EXPERIENCE_VH}vh` }}>
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <ClientOnly fallback={<div className="h-full w-full exp-bg" />}>
          {mode === "webgl" ? (
            <ExperienceScene
              progressRef={progressRef}
              fields={visibleFields}
              isMobile={viewport.isMobile}
              viewportWidth={viewport.width}
              reducedMotion={reduced}
              tier={tier}
              onActivateField={onActivateField}
            />
          ) : (
            <div className="h-full w-full exp-bg" />
          )}
        </ClientOnly>

        <ExperienceOverlay
          chapter={chapter}
          activeField={visibleFields[fieldIndex] ?? null}
          activeFieldIndex={fieldIndex}
          totalFields={visibleFields.length}
          signedIn={!!user}
        />

        {/* Cinematic cut fade */}
        <div
          ref={fadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 exp-bg"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Konten aksesibel untuk screen reader & SEO */}
      <div className="sr-only">
        <h2>Bidang Karier CareerLab</h2>
        <ul>
          {visibleFields.map((f) => (
            <li key={f.id}>
              {f.name} — {f.tagline} ({f.status === "active" ? "tersedia" : "segera hadir"})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
