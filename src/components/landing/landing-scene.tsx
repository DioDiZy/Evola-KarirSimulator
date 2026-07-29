import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, ScrollControls, useScroll } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";
import { StudioEnvironment } from "./studio-environment";
import { CareerCore } from "./career-core";
import { WorkstationPanels } from "./workstation-panels";

/**
 * Scroll-driven camera path:
 *   page 0 → hero, camera far from Career Core
 *   page 1 → move in, orbit slightly around core
 *   page 2 → travel down the studio toward workstation panels
 */
function CameraRig({ isMobile }: { isMobile: boolean }) {
  const scroll = useScroll();
  const { camera, pointer } = useThree();
  const sway = useRef(0);

  useFrame((_, dt) => {
    sway.current += dt;
    const t = THREE.MathUtils.clamp(scroll.offset, 0, 1);

    // Camera z: 8 → 3 → -10
    const z =
      t < 0.5
        ? THREE.MathUtils.lerp(8, 3, t / 0.5)
        : THREE.MathUtils.lerp(3, -10, (t - 0.5) / 0.5);

    // Slight lateral shift as we pass the core
    const baseX = THREE.MathUtils.lerp(0, -1.5, Math.min(1, t * 1.3));
    const baseY = THREE.MathUtils.lerp(0.6, 0.2, t);

    const parX = isMobile ? 0 : pointer.x * 0.25 + Math.sin(sway.current * 0.4) * 0.08;
    const parY = isMobile ? 0 : pointer.y * 0.15 + Math.cos(sway.current * 0.3) * 0.05;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, baseX + parX, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, baseY + parY, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 3, dt);

    // Look target shifts from core (0,0,0) to workstation area (0,0,-16)
    const lookZ = THREE.MathUtils.lerp(0, -16, t);
    camera.lookAt(0, 0.1, lookZ);
  });

  return null;
}

export function LandingScene() {
  const isMobile = useIsMobile();

  return (
    <Canvas
      dpr={[1, isMobile ? 1 : 1.5]}
      camera={{ position: [0, 0.6, 8], fov: isMobile ? 60 : 48, near: 0.1, far: 150 }}
      gl={{ powerPreference: "high-performance", antialias: !isMobile, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.fog = new THREE.Fog("#F8FAFC", 8, 32);
      }}
    >
      <color attach="background" args={["#F8FAFC"]} />
      <AdaptiveDpr pixelated />

      <ScrollControls pages={3} damping={0.28} distance={1}>
        <CameraRig isMobile={isMobile} />
        <StudioEnvironment isMobile={isMobile} />
        <CareerCore position={[0, 0.2, 0]} />
        <WorkstationPanels z={-14} />
      </ScrollControls>

      {!isMobile && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
