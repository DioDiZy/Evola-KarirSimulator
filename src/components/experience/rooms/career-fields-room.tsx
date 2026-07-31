import { useMemo } from "react";
import * as THREE from "three";
import { CareerScreen, type CareerTunnelField } from "@/components/dashboard/career-screen";
import { TunnelEnvironment } from "@/components/dashboard/tunnel-environment";

export const FIELDS_FIRST_Z = -46;
export const FIELDS_SPACING = 9;
export const MAX_FIELDS = 4;

const ACCENTS = ["#22D3EE", "#3B82F6", "#8B5CF6", "#84CC16"];

type Props = {
  fields: CareerTunnelField[];
  isMobile: boolean;
  viewportWidth: number;
  onActivate: (slug: string) => void;
};

/**
 * Career Fields chapter — bekas CareerTunnel, kini menjadi ruang
 * di dalam ExperienceScene (tanpa Canvas & ScrollControls sendiri).
 * Panel bergantian kanan → kiri → kanan → kiri.
 */
export function CareerFieldsRoom({ fields, isMobile, viewportWidth, onActivate }: Props) {
  const visible = useMemo(() => fields.slice(0, MAX_FIELDS), [fields]);

  const { scale, offsetX, rot } = useMemo(() => {
    if (!isMobile) return { scale: 0.9, offsetX: 3.0, rot: 0.38 };
    const w = THREE.MathUtils.clamp(viewportWidth, 320, 767);
    const k = (w - 320) / (767 - 320);
    return {
      scale: THREE.MathUtils.lerp(0.5, 0.68, k),
      offsetX: THREE.MathUtils.lerp(0.95, 1.35, k),
      rot: THREE.MathUtils.lerp(0.21, 0.31, k),
    };
  }, [isMobile, viewportWidth]);

  return (
    <group>
      <group position={[0, 0, -58]}>
        <TunnelEnvironment length={46} isMobile={isMobile} tone="dark" />
      </group>

      {visible.map((field, i) => {
        const right = i % 2 === 0;
        const x = right ? offsetX : -offsetX;
        const z = FIELDS_FIRST_Z - i * FIELDS_SPACING;
        return (
          <group key={field.id} position={[x, 0.15, z]} scale={scale}>
            <CareerScreen
              field={field}
              index={i}
              total={visible.length}
              position={[0, 0, 0]}
              rotationY={right ? rot : -rot}
              accent={ACCENTS[i % ACCENTS.length]}
              onActivate={onActivate}
            />
          </group>
        );
      })}
    </group>
  );
}
