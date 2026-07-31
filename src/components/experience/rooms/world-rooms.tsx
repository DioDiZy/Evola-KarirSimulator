import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { WorkstationPanels } from "@/components/landing/workstation-panels";

const CYAN = "#22D3EE";
const BLUE = "#3B82F6";
const VIOLET = "#8B5CF6";
const LIME = "#84CC16";

/** Lantai gelap reflektif ringan yang dipakai bersama semua ruang. */
function DarkFloor({ z, length }: { z: number; length: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, z]} receiveShadow>
      <planeGeometry args={[26, length]} />
      <meshStandardMaterial color="#050816" roughness={0.35} metalness={0.85} />
    </mesh>
  );
}

/** Chapter 1 — Entrance / portal CareerLab. */
export function EntranceRoom() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  const pillars = useMemo(() => [-4.2, -2.6, 2.6, 4.2], []);

  return (
    <group>
      <DarkFloor z={-4} length={40} />

      {/* Portal frame */}
      <group position={[0, 0.4, -10]}>
        <mesh ref={ringRef}>
          <torusGeometry args={[2.6, 0.06, 12, 64]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.4]}>
          <circleGeometry args={[2.55, 64]} />
          <meshBasicMaterial color="#07111F" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.35]}>
          <ringGeometry args={[2.1, 2.5, 64]} />
          <meshBasicMaterial color={BLUE} transparent opacity={0.25} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0, 1.4]} intensity={14} distance={16} color={CYAN} decay={2} />
      </group>

      {/* Gate pillars */}
      {pillars.map((x) => (
        <mesh key={x} position={[x, -0.2, -10]}>
          <boxGeometry args={[0.35, 4.2, 0.35]} />
          <meshStandardMaterial color="#0B1120" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Ambient rig */}
      <ambientLight intensity={0.14} />
      <spotLight
        position={[0, 6, 2]}
        angle={0.7}
        penumbra={1}
        intensity={26}
        distance={30}
        color={VIOLET}
      />
    </group>
  );
}

/** Chapter 2 — Briefing room. */
export function BriefingRoom() {
  const boards = useMemo(
    () =>
      [
        { x: -3.4, rot: 0.5, color: CYAN, label: "MISSION BRIEF" },
        { x: 0, rot: 0, color: BLUE, label: "MICRO-TASK" },
        { x: 3.4, rot: -0.5, color: VIOLET, label: "CAREER CREDIT" },
      ] as const,
    [],
  );

  return (
    <group>
      <DarkFloor z={-24} length={30} />

      {boards.map((b) => (
        <group key={b.label} position={[b.x, 0.5, -27]} rotation={[0, b.rot, 0]}>
          <RoundedBox args={[2.7, 1.6, 0.08]} radius={0.05} smoothness={3}>
            <meshStandardMaterial
              color="#07111F"
              emissive={b.color}
              emissiveIntensity={0.35}
              metalness={0.6}
              roughness={0.35}
            />
          </RoundedBox>
          <mesh position={[0, 0.86, 0.02]}>
            <boxGeometry args={[2.7, 0.03, 0.02]} />
            <meshBasicMaterial color={b.color} toneMapped={false} />
          </mesh>
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.16}
            anchorX="center"
            anchorY="middle"
            color="#F8FAFC"
          >
            {b.label}
          </Text>
          <pointLight position={[0, 0, 1]} intensity={2.4} distance={5} color={b.color} decay={2} />
        </group>
      ))}

      {/* Briefing table */}
      <mesh position={[0, -1.5, -23]}>
        <boxGeometry args={[6, 0.12, 2.2]} />
        <meshStandardMaterial color="#0B1120" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -1.42, -23]}>
        <boxGeometry args={[5.2, 0.01, 1.4]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.12} toneMapped={false} />
      </mesh>

      <ambientLight intensity={0.18} />
    </group>
  );
}

/** Chapter 4 — Mission workstation. */
export function MissionRoom() {
  return (
    <group>
      <DarkFloor z={-100} length={34} />

      {/* Reuse panel Mission Engine existing */}
      <group position={[0, 0.2, 0]}>
        <WorkstationPanels z={-104} />
      </group>

      {/* Desk */}
      <mesh position={[0, -1.55, -102]}>
        <boxGeometry args={[9, 0.14, 2.6]} />
        <meshStandardMaterial color="#0B1120" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Neon strips */}
      {[-5.6, 5.6].map((x) => (
        <mesh key={x} position={[x, -0.4, -104]}>
          <boxGeometry args={[0.06, 3.2, 0.06]} />
          <meshBasicMaterial color={BLUE} toneMapped={false} />
        </mesh>
      ))}

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2.4, -100]} intensity={16} distance={20} color={CYAN} decay={2} />
    </group>
  );
}

/** Chapter 5 — Career command center (progress terminal). */
export function CommandCenterRoom({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const barsRef = useRef<THREE.Group>(null);
  const heights = useMemo(() => [0.9, 1.5, 1.1, 1.9, 1.3], []);

  useFrame((_, dt) => {
    if (!barsRef.current) return;
    const p = THREE.MathUtils.clamp((progressRef.current - 0.87) / 0.13, 0, 1);
    barsRef.current.children.forEach((child, i) => {
      const target = 0.08 + heights[i] * p;
      child.scale.y = THREE.MathUtils.damp(child.scale.y, target, 4, Math.min(dt, 0.05));
      child.position.y = -1.6 + child.scale.y / 2;
    });
  });

  return (
    <group>
      <DarkFloor z={-116} length={30} />

      {/* Platform ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.14, -118]}>
        <ringGeometry args={[3.2, 3.4, 64]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Progress bars */}
      <group ref={barsRef} position={[0, 0, -119]}>
        {heights.map((_, i) => (
          <mesh key={i} position={[(i - 2) * 0.9, -1.5, 0]} scale={[1, 0.1, 1]}>
            <boxGeometry args={[0.42, 1, 0.42]} />
            <meshStandardMaterial
              color="#07111F"
              emissive={i % 2 === 0 ? CYAN : VIOLET}
              emissiveIntensity={0.9}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* Terminal arc */}
      <mesh position={[0, 0.4, -122]}>
        <torusGeometry args={[3.4, 0.05, 10, 48, Math.PI]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>

      <ambientLight intensity={0.22} />
      <pointLight position={[0, 2, -116]} intensity={18} distance={22} color={BLUE} decay={2} />
    </group>
  );
}
