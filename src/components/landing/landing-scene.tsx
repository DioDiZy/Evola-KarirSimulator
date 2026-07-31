import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import { useIsMobile } from "@/hooks/use-mobile";
import { StudioEnvironment } from "./studio-environment";
import { CareerCore } from "./career-core";
import { WorkstationPanels } from "./workstation-panels";

interface LandingSceneProps {
  onReady?: () => void;
}

function CameraRig({ isMobile }: { isMobile: boolean }) {
  const scroll = useScroll();
  const { camera, pointer } = useThree();
  const elapsedTime = useRef(0);

  useFrame((_, delta) => {
    elapsedTime.current += delta;

    const progress = THREE.MathUtils.clamp(scroll.offset, 0, 1);

    const startZ = isMobile ? 10.5 : 8;
    const middleZ = isMobile ? 4.6 : 3;
    const endZ = isMobile ? -12 : -10;

    const targetZ =
      progress < 0.5
        ? THREE.MathUtils.lerp(startZ, middleZ, progress / 0.5)
        : THREE.MathUtils.lerp(middleZ, endZ, (progress - 0.5) / 0.5);

    const targetX = isMobile
      ? 0
      : THREE.MathUtils.lerp(0, -1.5, Math.min(1, progress * 1.3));

    const targetY = THREE.MathUtils.lerp(
      isMobile ? 0.75 : 0.6,
      isMobile ? 0.25 : 0.2,
      progress,
    );

    const parallaxX = isMobile
      ? 0
      : pointer.x * 0.25 + Math.sin(elapsedTime.current * 0.4) * 0.08;

    const parallaxY = isMobile
      ? 0
      : pointer.y * 0.15 + Math.cos(elapsedTime.current * 0.3) * 0.05;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX + parallaxX,
      3,
      delta,
    );

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY + parallaxY,
      3,
      delta,
    );

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetZ,
      3,
      delta,
    );

    const workstationProgress = THREE.MathUtils.smoothstep(progress, 0.28, 1);

    const lookAtZ = THREE.MathUtils.lerp(
      0,
      isMobile ? -20 : -16,
      workstationProgress,
    );

    camera.lookAt(0, 0.1, lookAtZ);
  });

  return null;
}

function ProgressiveWorkstationPanels({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.visible = !isMobile || scroll.offset >= 0.34;
  });

  return (
    <group ref={groupRef} visible={!isMobile}>
      <WorkstationPanels z={isMobile ? -20 : -14} />
    </group>
  );
}

/*
 * Komponen ini hanya akan dirender setelah seluruh
 * isi di dalam Suspense selesai dimuat.
 */
function SceneReady({ onReady }: { onReady?: () => void }) {
  const hasRendered = useRef(false);
  const frameCount = useRef(0);

  useFrame(() => {
    if (hasRendered.current) {
      return;
    }

    frameCount.current += 1;

    /*
     * Tunggu beberapa frame agar Canvas benar-benar
     * sudah tampil, bukan hanya berhasil dibuat.
     */
    if (frameCount.current >= 3) {
      hasRendered.current = true;
      onReady?.();
    }
  });

  return null;
}

function SceneContent({
  isMobile,
  onReady,
}: {
  isMobile: boolean;
  onReady?: () => void;
}) {
  const corePosition: [number, number, number] = isMobile
    ? [0.8, -0.35, 0]
    : [0, 0.2, 0];

  return (
    <>
      <ScrollControls pages={3} damping={isMobile ? 0.2 : 0.28} distance={1}>
        <CameraRig isMobile={isMobile} />

        <StudioEnvironment isMobile={isMobile} />

        <CareerCore position={corePosition} />

        <ProgressiveWorkstationPanels isMobile={isMobile} />
      </ScrollControls>

      {!isMobile && (
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={0.3}
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            mipmapBlur
          />

          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      )}

      <SceneReady onReady={onReady} />
    </>
  );
}

export function LandingScene({ onReady }: LandingSceneProps) {
  const isMobile = useIsMobile();

  /*
   * Saat perubahan ukuran layar terjadi,
   * Canvas akan menyesuaikan ukurannya kembali.
   */
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event("resize"));
    };

    const timeout = window.setTimeout(handleResize, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isMobile]);

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 1.75]}
      camera={{
        position: [0, isMobile ? 0.75 : 0.6, isMobile ? 10.5 : 8],
        fov: isMobile ? 46 : 48,
        near: 0.1,
        far: 120,
      }}
      gl={{
        powerPreference: "high-performance",
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: false,
      }}
      fallback={<div className="h-full w-full bg-[#F8FAFC]" />}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;

        gl.toneMappingExposure = 1;

        gl.outputColorSpace = THREE.SRGBColorSpace;

        scene.fog = new THREE.Fog(
          "#F8FAFC",
          isMobile ? 7 : 8,
          isMobile ? 21 : 32,
        );
      }}
    >
      <color attach="background" args={["#F8FAFC"]} />

      <Suspense fallback={null}>
        <SceneContent isMobile={isMobile} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
