import * as THREE from "three";

/**
 * Chapter definitions for the CareerLab Career Simulation World.
 * Setiap chapter memakai konten landing page existing, hanya
 * dipindahkan ke overlay yang tersinkron dengan kamera.
 */
export type ChapterId =
  | "entrance"
  | "briefing"
  | "fields"
  | "mission"
  | "progress";

export type Chapter = {
  id: ChapterId;
  /** global progress window [start, end] */
  start: number;
  end: number;
};

export const CHAPTERS: Chapter[] = [
  { id: "entrance", start: 0.0, end: 0.18 },
  { id: "briefing", start: 0.18, end: 0.38 },
  { id: "fields", start: 0.38, end: 0.72 },
  { id: "mission", start: 0.72, end: 0.87 },
  { id: "progress", start: 0.87, end: 1.0 },
];

/** Tinggi wrapper scroll (dalam viewport) — 1 chapter ≈ 1.4 layar. */
export const EXPERIENCE_VH = 620;

/** Progress lokal 0..1 di dalam sebuah chapter. */
export function localProgress(global: number, chapter: Chapter): number {
  return THREE.MathUtils.clamp(
    (global - chapter.start) / (chapter.end - chapter.start),
    0,
    1,
  );
}

export function chapterAt(global: number): Chapter {
  for (const c of CHAPTERS) {
    if (global < c.end) return c;
  }
  return CHAPTERS[CHAPTERS.length - 1];
}

/**
 * Kekuatan "dark fade" untuk menyembunyikan perpindahan ruang.
 * Naik tepat di batas antar-chapter tertentu (cinematic cut).
 */
const CUTS = [0.38, 0.72];

export function cutOpacity(global: number): number {
  let max = 0;
  for (const cut of CUTS) {
    const d = Math.abs(global - cut);
    const v = 1 - THREE.MathUtils.clamp(d / 0.022, 0, 1);
    if (v > max) max = v;
  }
  return max * 0.92;
}

/** Fade-in/out util untuk overlay chapter. */
export function chapterOpacity(global: number, chapter: Chapter): number {
  const fade = 0.035;
  const inA = THREE.MathUtils.smoothstep(global, chapter.start - fade, chapter.start + fade);
  const outA = 1 - THREE.MathUtils.smoothstep(global, chapter.end - fade, chapter.end + fade);
  return THREE.MathUtils.clamp(Math.min(inA, outA), 0, 1);
}
