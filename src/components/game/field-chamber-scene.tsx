import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshReflectorMaterial,
  Text,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

export type ChamberTrack = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  status: string;
  __x?: number;
  __z?: number;
};

const ACCENT = "#f4a15a";
const CYAN = "#5eead4";
const VIOLET = "#a78bfa";
const TRACK_COLORS = [ACCENT, CYAN, VIOLET, "#f472b6", "#60a5fa"];

/**
 * TrackPedestal — a floating monolith representing a Career Track.
 * Hover: rises + glows. Click: emits selection to parent for camera zoom.
 */
function TrackPedestal({
  track,
  position,
  color,
  onSelect,
  selected,
  fading,
}: {
  track: ChamberTrack;
  position: [number, number, number];
  color: string;
  onSelect: (t: ChamberTrack) => void;
  selected: boolean;
  fading: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const monolith = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const locked = track.status !== "active";

  useFrame((_, dt) => {
    if (!group.current) return;
    const targetY = position[1] + (hover && !locked ? 0.25 : 0);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 4, dt);
    const targetScale = selected ? 1.15 : hover && !locked ? 1.06 : 1;
    const s = THREE.MathUtils.damp(group.current.scale.x, targetScale, 5, dt);
    group.current.scale.setScalar(s);
    if (ring.current) ring.current.rotation.y += dt * (hover ? 1.2 : 0.4);
    if (monolith.current) {
      const mat = monolith.current.material as THREE.MeshStandardMaterial;
      const target = hover && !locked ? 1.4 : 0.55;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, 4, dt);
    }

    // Fade during transition
    if (fading && !selected) {
      const mat = monolith.current?.material as THREE.MeshStandardMaterial | undefined;
      if (mat) {
        mat.opacity = THREE.MathUtils.damp(mat.opacity, 0, 3, dt);
        mat.transparent = true;
      }
    }
  });

  return (
    <group ref={group} position={position}>
      <Float floatIntensity={0.35} rotationIntensity={0.05} speed={1.1} enabled={!selected}>
        {/* Base plinth */}
        <mesh position={[0, -0.9, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.9, 0.2, 32]} />
          <meshStandardMaterial color="#0d1420" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Monolith */}
        <mesh
          ref={monolith}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!locked) {
              setHover(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!locked) onSelect(track);
          }}
        >
          <boxGeometry args={[1.1, 2.1, 0.35]} />
          <meshStandardMaterial
            color={locked ? "#1a2030" : "#0a1420"}
            emissive={locked ? "#334155" : color}
            emissiveIntensity={0.55}
            metalness={0.6}
            roughness={0.22}
          />
        </mesh>

        {/* Orbit ring */}
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <torusGeometry args={[1.05, 0.012, 12, 96]} />
          <meshBasicMaterial color={locked ? "#475569" : color} toneMapped={false} />
        </mesh>

        {/* Nameplate */}
        <Text
          position={[0, -1.25, 0.01]}
          fontSize={0.15}
          maxWidth={2}
          anchorX="center"
          anchorY="middle"
          color="#f7f2e8"
        >
          {track.name}
        </Text>
        <Text
          position={[0, -1.5, 0.01]}
          fontSize={0.075}
          anchorX="center"
          anchorY="middle"
          color={locked ? "#94a3b8" : color}
        >
          {locked ? "SEGERA HADIR" : "TRACK AKTIF · KLIK UNTUK MASUK"}
        </Text>

        <pointLight position={[0, 0.4, 0.6]} intensity={hover ? 3 : 1.4} color={color} distance={4} decay={2} />
      </Float>
    </group>
  );
}

function Chamber({
  tracks,
  onArrive,
  fieldName,
  fieldColor,
}: {
  tracks: ChamberTrack[];
  onArrive: (slug: string) => void;
  fieldName: string;
  fieldColor: string;
}) {
  const { camera } = useThree();
  const [selected, setSelected] = useState<ChamberTrack | null>(null);
  const introDone = useRef(false);
  const t = useRef(0);

  // Camera intro from far → orbit
  useFrame((_, dt) => {
    t.current += dt;

    if (!introDone.current) {
      const p = Math.min(1, t.current / 1.6);
      const eased = 1 - Math.pow(1 - p, 3);
      camera.position.x = THREE.MathUtils.lerp(0, 0, eased);
      camera.position.y = THREE.MathUtils.lerp(6, 1.6, eased);
      camera.position.z = THREE.MathUtils.lerp(14, 6.5, eased);
      camera.lookAt(0, 0.2, 0);
      if (p >= 1) introDone.current = true;
      return;
    }

    if (selected) {
      // Zoom-in to selected pedestal, then route
      const targetPos = new THREE.Vector3(
        selected.__x ?? 0,
        1,
        (selected.__z ?? 0) + 2.2,
      );
      camera.position.lerp(targetPos, Math.min(1, dt * 3));
      camera.lookAt(selected.__x ?? 0, 0.2, selected.__z ?? 0);

      if (camera.position.distanceTo(targetPos) < 0.4) {
        onArrive(selected.slug);
      }
      return;
    }

    // Idle slow orbit
    const a = t.current * 0.08;
    const rx = Math.sin(a) * 0.6;
    const ry = 1.6 + Math.sin(t.current * 0.4) * 0.05;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, rx, 2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ry, 2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.5, 2, dt);
    camera.lookAt(0, 0.2, 0);
  });

  // Arrange tracks on an arc
  const positioned = useMemo(() => {
    const n = tracks.length || 1;
    const radius = n <= 1 ? 0 : 3;
    return tracks.map((tr, i) => {
      const angle = n === 1 ? 0 : (-Math.PI / 2.4) + (i / (n - 1)) * (Math.PI / 1.2);
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius + 1;
      const enriched = { ...tr, __x: x, __z: z } as ChamberTrack & { __x: number; __z: number };
      return { track: enriched, position: [x, 0.2, z] as [number, number, number] };
    });
  }, [tracks]);

  return (
    <>
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={40}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
          color="#050b16"
          metalness={0.7}
        />
      </mesh>

      {/* Distant halo */}
      <mesh position={[0, 6, -12]}>
        <planeGeometry args={[30, 12]} />
        <meshBasicMaterial color={fieldColor} transparent opacity={0.06} />
      </mesh>

      {/* Field title */}
      <Text
        position={[0, 4.2, -8]}
        fontSize={0.6}
        anchorX="center"
        anchorY="middle"
        color="#f7f2e8"
      >
        {fieldName.toUpperCase()}
      </Text>
      <Text position={[0, 3.5, -8]} fontSize={0.14} anchorX="center" anchorY="middle" color={fieldColor}>
        FIELD CHAMBER · PILIH TRACK KARIERMU
      </Text>

      {positioned.map(({ track, position }, i) => (
        <TrackPedestal
          key={track.id}
          track={track}
          position={position}
          color={TRACK_COLORS[i % TRACK_COLORS.length]}
          onSelect={(t) => setSelected(t)}
          selected={selected?.id === track.id}
          fading={!!selected}
        />
      ))}

      <ContactShadows position={[0, -0.99, 0]} opacity={0.6} blur={2.4} scale={20} far={6} />

      <ambientLight intensity={0.25} />
      <pointLight position={[0, 5, 4]} intensity={1.5} color={ACCENT} />
      <pointLight position={[-6, 3, -4]} intensity={0.9} color={CYAN} />
      <pointLight position={[6, 3, -4]} intensity={0.9} color={VIOLET} />
      <Environment preset="night" />
    </>
  );
}

/**
 * Full-screen 3D chamber for /fields/$slug. Renders track pedestals as
 * floating monoliths. Clicking one triggers a camera zoom-in, then
 * navigates to /tracks/$slug.
 */
export function FieldChamberScene({
  tracks,
  fieldName,
  fieldColor = ACCENT,
}: {
  tracks: ChamberTrack[];
  fieldName: string;
  fieldColor?: string;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const onArrive = (slug: string) => {
    if (transitioning) return;
    setTransitioning(true);
    navigate({ to: "/tracks/$trackSlug", params: { trackSlug: slug } });
  };

  return (
    <Canvas
      dpr={[1, isMobile ? 1 : 1.5]}
      camera={{ position: [0, 6, 14], fov: isMobile ? 58 : 46, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: !isMobile, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        scene.fog = new THREE.Fog("#02060c", 8, 26);
      }}
    >
      <color attach="background" args={["#02060c"]} />
      <Chamber tracks={tracks} onArrive={onArrive} fieldName={fieldName} fieldColor={fieldColor} />
      {!isMobile && (
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.9} />
        </EffectComposer>
      )}
      {transitioning && (
        <Html center>
          <div className="pointer-events-none rounded-md bg-background/70 px-4 py-2 font-mono-cl text-xs uppercase tracking-widest text-accent">
            Memasuki track…
          </div>
        </Html>
      )}
    </Canvas>
  );
}
