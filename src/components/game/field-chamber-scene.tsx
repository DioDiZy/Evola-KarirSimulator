import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  Html,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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

type FieldTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  floor: string;
  fog: string;
  monolith: string;
};

type TrackVisual =
  | "frontend"
  | "backend"
  | "design"
  | "data"
  | "cyber"
  | "mobile"
  | "business"
  | "education"
  | "health"
  | "engineering"
  | "default";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function getFieldTheme(fieldName: string): FieldTheme {
  const name = normalize(fieldName);

  if (
    name.includes("teknologi") ||
    name.includes("informatika") ||
    name.includes("software") ||
    name.includes("digital")
  ) {
    return {
      primary: "#0891B2",
      secondary: "#2563EB",
      accent: "#7C3AED",
      background: "#EDF6FA",
      floor: "#DDEAF0",
      fog: "#E7F1F5",
      monolith: "#142536",
    };
  }

  if (
    name.includes("desain") ||
    name.includes("kreatif") ||
    name.includes("seni")
  ) {
    return {
      primary: "#DB2777",
      secondary: "#9333EA",
      accent: "#F97316",
      background: "#FAF0F6",
      floor: "#F1DFE9",
      fog: "#F7EAF2",
      monolith: "#321B2D",
    };
  }

  if (
    name.includes("bisnis") ||
    name.includes("manajemen") ||
    name.includes("keuangan") ||
    name.includes("pemasaran")
  ) {
    return {
      primary: "#D97706",
      secondary: "#059669",
      accent: "#2563EB",
      background: "#F7F4EB",
      floor: "#EAE4D5",
      fog: "#F3EFE5",
      monolith: "#2F2A1D",
    };
  }

  if (
    name.includes("pendidikan") ||
    name.includes("pengajar") ||
    name.includes("guru")
  ) {
    return {
      primary: "#4F46E5",
      secondary: "#0284C7",
      accent: "#7C3AED",
      background: "#F0F2FA",
      floor: "#E1E5F2",
      fog: "#ECEFFA",
      monolith: "#202743",
    };
  }

  if (
    name.includes("kesehatan") ||
    name.includes("medis") ||
    name.includes("farmasi")
  ) {
    return {
      primary: "#0D9488",
      secondary: "#16A34A",
      accent: "#0284C7",
      background: "#EDF8F5",
      floor: "#DDECE8",
      fog: "#E7F3F0",
      monolith: "#17332F",
    };
  }

  if (name.includes("teknik") || name.includes("engineering")) {
    return {
      primary: "#EA580C",
      secondary: "#475569",
      accent: "#2563EB",
      background: "#F5F3EF",
      floor: "#E5E1DA",
      fog: "#EFEBE4",
      monolith: "#2D2A27",
    };
  }

  return {
    primary: "#0891B2",
    secondary: "#2563EB",
    accent: "#7C3AED",
    background: "#EEF4F8",
    floor: "#DEE8EE",
    fog: "#E8F0F4",
    monolith: "#172536",
  };
}

function resolveTrackVisual(trackName: string, fieldName: string): TrackVisual {
  const text = normalize(`${trackName} ${fieldName}`);

  if (
    text.includes("frontend") ||
    text.includes("front-end") ||
    text.includes("web developer")
  ) {
    return "frontend";
  }

  if (
    text.includes("backend") ||
    text.includes("back-end") ||
    text.includes("server") ||
    text.includes("devops") ||
    text.includes("cloud")
  ) {
    return "backend";
  }

  if (
    text.includes("ui/ux") ||
    text.includes("ui ux") ||
    text.includes("designer") ||
    text.includes("desain")
  ) {
    return "design";
  }

  if (
    text.includes("data") ||
    text.includes("analyst") ||
    text.includes("analytics") ||
    text.includes("machine learning") ||
    text.includes("artificial intelligence")
  ) {
    return "data";
  }

  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("keamanan")
  ) {
    return "cyber";
  }

  if (
    text.includes("mobile") ||
    text.includes("android") ||
    text.includes("ios")
  ) {
    return "mobile";
  }

  if (
    text.includes("bisnis") ||
    text.includes("finance") ||
    text.includes("keuangan") ||
    text.includes("marketing") ||
    text.includes("pemasaran") ||
    text.includes("manajemen")
  ) {
    return "business";
  }

  if (
    text.includes("pendidikan") ||
    text.includes("guru") ||
    text.includes("pengajar")
  ) {
    return "education";
  }

  if (
    text.includes("kesehatan") ||
    text.includes("medis") ||
    text.includes("farmasi")
  ) {
    return "health";
  }

  if (text.includes("teknik") || text.includes("engineer")) {
    return "engineering";
  }

  return "default";
}

function VisualMaterial({ color, locked }: { color: string; locked: boolean }) {
  return (
    <meshStandardMaterial
      color={locked ? "#94A3B8" : color}
      emissive={locked ? "#64748B" : color}
      emissiveIntensity={locked ? 0.02 : 0.16}
      metalness={0.1}
      roughness={0.45}
    />
  );
}

function TrackSymbol({
  trackName,
  fieldName,
  color,
  locked,
}: {
  trackName: string;
  fieldName: string;
  color: string;
  locked: boolean;
}) {
  const visual = resolveTrackVisual(trackName, fieldName);

  if (visual === "frontend") {
    return (
      <group position={[0, 0.18, 0.24]}>
        <mesh>
          <boxGeometry args={[0.68, 0.46, 0.07]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.08, 0.16, 0.06]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.34, 0.05, 0.06]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[-0.16, 0.08, 0.05]}>
          <boxGeometry args={[0.2, 0.035, 0.025]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        <mesh position={[0.08, -0.03, 0.05]}>
          <boxGeometry args={[0.28, 0.035, 0.025]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    );
  }

  if (visual === "backend") {
    return (
      <group position={[0, 0.16, 0.25]}>
        {[-0.28, 0, 0.28].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[0.7, 0.2, 0.08]} />
            <VisualMaterial color={color} locked={locked} />

            <mesh position={[-0.25, 0, 0.055]}>
              <sphereGeometry args={[0.025, 12, 12]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </mesh>
        ))}
      </group>
    );
  }

  if (visual === "design") {
    return (
      <group position={[0, 0.14, 0.25]}>
        <mesh rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.62, 0.72, 0.06]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[-0.18, 0.12, 0.05]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        <mesh position={[0.08, 0.18, 0.05]}>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshBasicMaterial color="#FDE68A" />
        </mesh>

        <mesh position={[0.18, -0.04, 0.05]}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshBasicMaterial color="#F9A8D4" />
        </mesh>
      </group>
    );
  }

  if (visual === "data") {
    return (
      <group position={[0, 0.08, 0.25]}>
        {[
          [-0.25, -0.18, 0.18],
          [0, -0.07, 0.4],
          [0.25, 0.05, 0.64],
        ].map(([x, y, height]) => (
          <mesh key={`${x}-${height}`} position={[x, y, 0]}>
            <boxGeometry args={[0.16, height, 0.08]} />
            <VisualMaterial color={color} locked={locked} />
          </mesh>
        ))}

        <mesh position={[0, -0.42, 0]}>
          <boxGeometry args={[0.76, 0.04, 0.08]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    );
  }

  if (visual === "cyber") {
    return (
      <group position={[0, 0.12, 0.25]}>
        <mesh scale={[0.46, 0.58, 0.08]}>
          <octahedronGeometry args={[0.72, 0]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, -0.02, 0.07]}>
          <boxGeometry args={[0.22, 0.2, 0.05]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        <mesh position={[0, 0.12, 0.07]}>
          <torusGeometry args={[0.11, 0.035, 12, 24, Math.PI]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    );
  }

  if (visual === "mobile") {
    return (
      <group position={[0, 0.12, 0.25]}>
        <mesh>
          <boxGeometry args={[0.42, 0.76, 0.08]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, 0.02, 0.06]}>
          <boxGeometry args={[0.32, 0.52, 0.02]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        <mesh position={[0, -0.3, 0.07]}>
          <circleGeometry args={[0.035, 20]} />
          <meshBasicMaterial color="#CBD5E1" />
        </mesh>
      </group>
    );
  }

  if (visual === "business") {
    return (
      <group position={[0, 0.08, 0.25]}>
        <mesh>
          <boxGeometry args={[0.72, 0.46, 0.08]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.18, 0.04, 12, 24, Math.PI]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, 0.04, 0.06]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    );
  }

  if (visual === "education") {
    return (
      <group position={[0, 0.08, 0.25]}>
        <mesh position={[-0.19, 0, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.34, 0.62, 0.06]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0.19, 0, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.34, 0.62, 0.06]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.035, 0.58, 0.02]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    );
  }

  if (visual === "health") {
    return (
      <group position={[0, 0.1, 0.25]}>
        <mesh>
          <boxGeometry args={[0.22, 0.7, 0.08]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh>
          <boxGeometry args={[0.7, 0.22, 0.08]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>
      </group>
    );
  }

  if (visual === "engineering") {
    return (
      <group position={[0, 0.1, 0.25]}>
        <mesh rotation={[0, 0, Math.PI / 8]}>
          <torusGeometry args={[0.3, 0.1, 12, 12]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>

        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 16]} />
          <VisualMaterial color={color} locked={locked} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 0.12, 0.25]}>
      <mesh>
        <torusGeometry args={[0.32, 0.045, 16, 48]} />
        <VisualMaterial color={color} locked={locked} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={locked ? "#64748B" : color}
          emissiveIntensity={locked ? 0.02 : 0.3}
        />
      </mesh>
    </group>
  );
}

type TrackPedestalProps = {
  track: ChamberTrack;
  fieldName: string;
  position: [number, number, number];
  color: string;
  scale: number;
  isMobile: boolean;
  selected: boolean;
  fading: boolean;
  onSelect: (track: ChamberTrack) => void;
};

function TrackPedestal({
  track,
  fieldName,
  position,
  color,
  scale,
  isMobile,
  selected,
  fading,
  onSelect,
}: TrackPedestalProps) {
  const group = useRef<THREE.Group>(null);
  const monolith = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);

  const locked = track.status !== "active";

  useFrame((_, delta) => {
    if (!group.current) return;

    const hoverOffset = hovered && !locked ? 0.12 : 0;

    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      position[1] + hoverOffset,
      4,
      delta,
    );

    const selectedScale = selected
      ? 1.06
      : hovered && !locked
        ? 1.025
        : fading
          ? 0.94
          : 1;

    const targetScale = scale * selectedScale;

    const nextScale = THREE.MathUtils.damp(
      group.current.scale.x,
      targetScale,
      5,
      delta,
    );

    group.current.scale.setScalar(nextScale);

    if (ring.current) {
      ring.current.rotation.z += delta * (hovered ? 0.8 : 0.25);
    }

    if (monolith.current) {
      const material = monolith.current.material as THREE.MeshStandardMaterial;

      const intensity = hovered && !locked ? 0.24 : 0.08;

      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        intensity,
        4,
        delta,
      );
    }
  });

  function handlePointerOver(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();

    if (locked) return;

    setHovered(true);
    document.body.style.cursor = "pointer";
  }

  function handlePointerOut() {
    setHovered(false);
    document.body.style.cursor = "auto";
  }

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();

    if (!locked) {
      onSelect(track);
    }
  }

  return (
    <group ref={group} position={position} scale={scale}>
      <Float
        floatIntensity={selected ? 0 : 0.1}
        rotationIntensity={0.015}
        speed={0.7}
      >
        {/* Base bawah */}
        <mesh position={[0, -1.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.68, 0.82, 0.16, 40]} />

          <meshStandardMaterial
            color="#01d9ff"
            metalness={0.08}
            roughness={0.72}
          />
        </mesh>

        {/* Base atas */}
        <mesh position={[0, -1.02, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.58, 0.68, 0.12, 40]} />

          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.04}
            roughness={0.68}
          />
        </mesh>

        {/* Monolit */}
        <mesh
          ref={monolith}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[1.08, 2.05, 0.34]} />

          <meshStandardMaterial
            color={locked ? "#CBD5E1" : "#172536"}
            emissive={locked ? "#64748B" : color}
            emissiveIntensity={locked ? 0.02 : 0.08}
            metalness={0.14}
            roughness={0.52}
          />
        </mesh>

        {/* Panel depan */}
        <mesh position={[0, 0, 0.18]}>
          <planeGeometry args={[0.88, 1.83]} />

          <meshStandardMaterial
            color={locked ? "#BAC5D0" : "#25394D"}
            emissive={locked ? "#64748B" : color}
            emissiveIntensity={locked ? 0.01 : 0.035}
            roughness={0.58}
          />
        </mesh>

        {/* Simbol sesuai track */}
        <TrackSymbol
          trackName={track.name}
          fieldName={fieldName}
          color={color}
          locked={locked}
        />

        {/* Orbit */}
        <mesh
          ref={ring}
          rotation={[Math.PI / 2.4, 0, 0.2]}
          position={[0, 0.14, 0]}
        >
          <torusGeometry args={[0.94, 0.012, 10, 72]} />

          <meshStandardMaterial
            color={locked ? "#94A3B8" : color}
            emissive={locked ? "#64748B" : color}
            emissiveIntensity={locked ? 0.01 : 0.12}
            roughness={0.5}
          />
        </mesh>

        {!locked && (
          <pointLight
            position={[0, 0.15, 0.65]}
            intensity={hovered ? 0.65 : 0.2}
            color={color}
            distance={2.5}
            decay={2}
          />
        )}
      </Float>

      {/* Label HTML tidak bisa tertutup lantai */}
      <Html
        center
        position={[0, 1.3, 0]}
        zIndexRange={[30, 10]}
        style={{
          pointerEvents: "none",
          width: isMobile ? 116 : 200,
          opacity: fading && !selected ? 0.3 : 1,
          transition: "opacity 250ms ease",
        }}
      >
        <div className="select-none text-center">
          <p
            className={[
              "line-clamp-2 font-display place-items-center font-semibold leading-tight",
              isMobile ? "text-[11px]" : "text-[18px]",
              "text-slate-900",
            ].join(" ")}
          >
            {track.name}
          </p>
        </div>
      </Html>
      <Html
        center
        position={[0, -1.62, 0.48]}
        zIndexRange={[30, 10]}
        style={{
          pointerEvents: "none",
          width: isMobile ? 116 : 160,
          opacity: fading && !selected ? 0.3 : 1,
          transition: "opacity 250ms ease",
        }}
      >
        <div className="select-none text-center">
          <p
            className={[
              "mt-1 whitespace-nowrap font-mono text-[17px] font-semibold",
              "uppercase tracking-[0.13em]",
              locked ? "text-normal" : "text-normal",
            ].join(" ")}
          >
            {locked ? "Segera hadir" : "Klik untuk masuk"}
          </p>
        </div>
      </Html>
    </group>
  );
}

function ChamberFloor({
  isMobile,
  color,
}: {
  isMobile: boolean;
  color: string;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.48, 0]}
      receiveShadow
    >
      <planeGeometry args={[45, 45]} />

      {isMobile ? (
        <meshStandardMaterial color={color} metalness={0} roughness={0.96} />
      ) : (
        <MeshReflectorMaterial
          blur={[180, 70]}
          resolution={256}
          mixBlur={0.55}
          mixStrength={0.35}
          mirror={0.08}
          roughness={0.94}
          depthScale={0.12}
          minDepthThreshold={0.8}
          maxDepthThreshold={1.4}
          color={color}
          metalness={0}
        />
      )}
    </mesh>
  );
}

type ChamberProps = {
  tracks: ChamberTrack[];
  fieldName: string;
  theme: FieldTheme;
  isMobile: boolean;
  onArrive: (slug: string) => void;
};

function Chamber({
  tracks,
  fieldName,
  theme,
  isMobile,
  onArrive,
}: ChamberProps) {
  const { camera, viewport } = useThree();

  const [selected, setSelected] = useState<ChamberTrack | null>(null);

  const elapsed = useRef(0);
  const introFinished = useRef(false);
  const navigationStarted = useRef(false);

  const compact = isMobile || viewport.width < 7;

  const positionedTracks = useMemo(() => {
    const total = Math.max(tracks.length, 1);

    const objectScale = compact
      ? total >= 5
        ? 0.62
        : total >= 4
          ? 0.68
          : 0.76
      : total >= 5
        ? 0.82
        : 0.92;

    if (compact) {
      const columns = total === 1 ? 1 : 2;
      const rows = Math.ceil(total / columns);

      const horizontalGap = total >= 5 ? 1.55 : 1.72;

      const verticalGap = total >= 5 ? 1.72 : 1.9;

      return tracks.map((track, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;

        const remaining = total - row * columns;

        const itemsInRow = Math.min(columns, remaining);

        const x = (column - (itemsInRow - 1) / 2) * horizontalGap;

        const z = (row - (rows - 1) / 2) * verticalGap - 0.1;

        return {
          track: {
            ...track,
            __x: x,
            __z: z,
          },
          position: [x, 0.32, z] as [number, number, number],
          scale: objectScale,
        };
      });
    }

    const radius = total <= 2 ? 2.5 : total <= 3 ? 3 : 3.45;

    return tracks.map((track, index) => {
      const angle =
        total === 1
          ? 0
          : -Math.PI / 3.5 + (index / (total - 1)) * (Math.PI / 1.75);

      const x = Math.sin(angle) * radius;

      const z = -Math.cos(angle) * radius + radius - 0.8;

      return {
        track: {
          ...track,
          __x: x,
          __z: z,
        },
        position: [x, 0.3, z] as [number, number, number],
        scale: objectScale,
      };
    });
  }, [tracks, compact]);

  useFrame((_, delta) => {
    elapsed.current += delta;

    const cameraZ = compact ? 8.8 : 7.6;
    const cameraY = compact ? 2.05 : 1.75;
    const targetY = compact ? -0.2 : 0;

    if (!introFinished.current) {
      const progress = Math.min(1, elapsed.current / 1.4);

      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.x = 0;

      camera.position.y = THREE.MathUtils.lerp(
        compact ? 5.5 : 5,
        cameraY,
        eased,
      );

      camera.position.z = THREE.MathUtils.lerp(
        compact ? 12.5 : 11,
        cameraZ,
        eased,
      );

      camera.lookAt(0, targetY, 0);

      if (progress >= 1) {
        introFinished.current = true;
      }

      return;
    }

    if (selected) {
      const targetPosition = new THREE.Vector3(
        selected.__x ?? 0,
        0.65,
        (selected.__z ?? 0) + (compact ? 2.8 : 2.35),
      );

      camera.position.lerp(targetPosition, Math.min(1, delta * 2.5));

      camera.lookAt(selected.__x ?? 0, 0, selected.__z ?? 0);

      if (
        camera.position.distanceTo(targetPosition) < 0.3 &&
        !navigationStarted.current
      ) {
        navigationStarted.current = true;
        onArrive(selected.slug);
      }

      return;
    }

    const orbit = elapsed.current * 0.045;

    const targetX = compact ? 0 : Math.sin(orbit) * 0.25;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      2,
      delta,
    );

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      cameraY,
      2,
      delta,
    );

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      cameraZ,
      2,
      delta,
    );

    camera.lookAt(0, targetY, 0);
  });

  const trackColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.primary,
    theme.secondary,
  ];

  return (
    <>
      <ChamberFloor isMobile={isMobile} color={theme.floor} />

      {/* Lingkaran dekorasi bidang */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <ringGeometry args={[3.4, 3.44, 96]} />

        <meshBasicMaterial color={theme.primary} transparent opacity={0.12} />
      </mesh>

      {positionedTracks.map(({ track, position, scale }, index) => (
        <TrackPedestal
          key={track.id}
          track={track}
          fieldName={fieldName}
          position={position}
          scale={scale}
          isMobile={isMobile}
          color={trackColors[index % trackColors.length]}
          onSelect={setSelected}
          selected={selected?.id === track.id}
          fading={Boolean(selected)}
        />
      ))}

      <ContactShadows
        position={[0, -1.44, 0]}
        opacity={isMobile ? 0.12 : 0.2}
        blur={2.8}
        scale={18}
        far={6}
      />

      <ambientLight intensity={0.7} />

      <hemisphereLight args={["#0EA5E9", theme.secondary, 0.55]} />

      <directionalLight
        position={[5, 8, 6]}
        intensity={0.85}
        color="#FFFFFF"
        castShadow={!isMobile}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <pointLight
        position={[-5, 3, 2]}
        intensity={0.12}
        color={theme.primary}
        distance={10}
        decay={2}
      />

      <pointLight
        position={[5, 3, 2]}
        intensity={0.12}
        color={theme.secondary}
        distance={10}
        decay={2}
      />
    </>
  );
}

type FieldChamberSceneProps = {
  tracks: ChamberTrack[];
  fieldName: string;
};

export function FieldChamberScene({
  tracks,
  fieldName,
}: FieldChamberSceneProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [transitioning, setTransitioning] = useState(false);

  const theme = useMemo(() => getFieldTheme(fieldName), [fieldName]);

  function handleArrive(slug: string) {
    if (transitioning) return;

    setTransitioning(true);

    navigate({
      to: "/tracks/$trackSlug",
      params: {
        trackSlug: slug,
      },
    });
  }

  return (
    <Canvas
      shadows={!isMobile}
      dpr={[1, isMobile ? 1 : 1.35]}
      camera={{
        position: [0, isMobile ? 5.5 : 5, isMobile ? 12.5 : 11],
        fov: isMobile ? 58 : 45,
        near: 0.1,
        far: 100,
      }}
      gl={{
        powerPreference: "high-performance",
        antialias: !isMobile,
        alpha: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;

        gl.toneMappingExposure = 0.78;

        gl.outputColorSpace = THREE.SRGBColorSpace;

        scene.fog = new THREE.Fog(theme.fog, isMobile ? 10 : 9, 28);
      }}
    >
      <color attach="background" args={[theme.background]} />

      <Chamber
        tracks={tracks}
        fieldName={fieldName}
        theme={theme}
        isMobile={isMobile}
        onArrive={handleArrive}
      />

      {!isMobile && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.12}
            luminanceThreshold={1.25}
            luminanceSmoothing={0.15}
            radius={0.35}
            mipmapBlur
          />
        </EffectComposer>
      )}

      {transitioning && (
        <Html center zIndexRange={[100, 80]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-xl backdrop-blur-xl">
            Memasuki track…
          </div>
        </Html>
      )}
    </Canvas>
  );
}
