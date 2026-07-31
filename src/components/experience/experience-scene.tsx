import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { CareerTunnelField } from "@/components/dashboard/career-screen";
import { SceneDirector } from "./scene-director";
import { CareerFieldsRoom } from "./rooms/career-fields-room";
import {
  BriefingRoom,
  CommandCenterRoom,
  EntranceRoom,
  MissionRoom,
} from "./rooms/world-rooms";
import { TIER_DPR, type QualityTier } from "./use-quality-tier";

type Props = {
  progressRef: MutableRefObject<number>;
  fields: CareerTunnelField[];
  isMobile: boolean;
  viewportWidth: number;
  reducedMotion: boolean;
  tier: QualityTier;
  onActivateField: (slug: string) => void;
};

/**
 * Satu persistent Canvas untuk seluruh Career Simulation World.
 * Canvas ini tidak pernah di-unmount saat berpindah chapter.
 */
export function ExperienceScene({
  progressRef,
  fields,
  isMobile,
  viewportWidth,
  reducedMotion,
  tier,
  onActivateField,
}: Props) {
  return (
    <Canvas
      dpr={TIER_DPR[tier]}
      camera={{ position: [0, 1, 12], fov: isMobile ? 68 : 50, near: 0.1, far: 200 }}
      gl={{ powerPreference: "high-performance", antialias: tier === "high", alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.fog = new THREE.Fog("#030712", 6, 52);
      }}
    >
      <color attach="background" args={["#030712"]} />
      <AdaptiveDpr pixelated />

      <SceneDirector
        progressRef={progressRef}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
      />

      <EntranceRoom />
      <BriefingRoom />
      <CareerFieldsRoom
        fields={fields}
        isMobile={isMobile}
        viewportWidth={viewportWidth}
        onActivate={onActivateField}
      />
      <MissionRoom />
      <CommandCenterRoom progressRef={progressRef} />

      <Preload all />

      {tier !== "low" && (
        <EffectComposer>
          <Bloom
            intensity={tier === "high" ? 0.55 : 0.32}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
          <Noise opacity={tier === "high" ? 0.035 : 0.02} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
