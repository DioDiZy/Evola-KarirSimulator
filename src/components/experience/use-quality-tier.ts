import { useEffect, useState } from "react";

export type QualityTier = "high" | "medium" | "low";

/**
 * Quality tier sederhana berdasarkan kemampuan device.
 * high  → DPR 1.75, bloom + dynamic light
 * medium→ DPR 1.35, bloom lemah
 * low   → DPR 1.0, tanpa post-processing
 */
export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>("medium");

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    if (mobile || coarse) {
      setTier(cores >= 8 ? "medium" : "low");
      return;
    }
    setTier(cores >= 8 ? "high" : "medium");
  }, []);

  return tier;
}

export const TIER_DPR: Record<QualityTier, [number, number]> = {
  high: [1, 1.75],
  medium: [1, 1.35],
  low: [1, 1],
};
