import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, Text } from "@react-three/drei";

type Panel = {
  title: string;
  body: string;
  color: string;
};

const PANELS: Panel[] = [
  {
    title: "Keputusan yang berbobot",
    body: "Setiap pilihan ditimbang seperti di tempat kerja nyata.",
    color: "#f4a15a",
  },
  {
    title: "Micro-task 5–20 menit",
    body: "Tugas kecil yang meniru pekerjaan harian. Bukan kursus.",
    color: "#5eead4",
  },
  {
    title: "Career Credit permanen",
    body: "Kredit diberikan setelah episode. Tak berkurang karena gagal.",
    color: "#a78bfa",
  },
];

export function WorkstationPanels({ z = -14 }: { z?: number }) {
  const positions = useMemo<[number, number, number][]>(
    () => [
      [-4.5, 0.2, z],
      [0, 0.5, z - 1.5],
      [4.5, 0.2, z],
    ],
    [z],
  );

  return (
    <group>
      {PANELS.map((p, i) => {
        const [x, y, pz] = positions[i];
        const rotY = i === 0 ? 0.3 : i === 2 ? -0.3 : 0;
        return (
          <group key={p.title} position={[x, y, pz]} rotation={[0, rotY, 0]}>
            {/* Glass panel */}
            <RoundedBox args={[3, 1.9, 0.05]} radius={0.06} smoothness={4}>
              <meshPhysicalMaterial
                color="#050b18"
                emissive={p.color}
                emissiveIntensity={0.25}
                transmission={0.35}
                thickness={0.4}
                roughness={0.15}
                metalness={0.2}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </RoundedBox>

            {/* Accent bar */}
            <mesh position={[-1.35, 0.75, 0.03]}>
              <boxGeometry args={[0.25, 0.05, 0.02]} />
              <meshBasicMaterial color={p.color} toneMapped={false} />
            </mesh>

            <Text
              position={[0, 0.35, 0.04]}
              fontSize={0.22}
              maxWidth={2.6}
              anchorX="center"
              anchorY="middle"
              color="#f7f2e8"
            >
              {p.title}
            </Text>
            <Text
              position={[0, -0.25, 0.04]}
              fontSize={0.11}
              maxWidth={2.6}
              anchorX="center"
              anchorY="middle"
              color="#c8d4e6"
              lineHeight={1.4}
            >
              {p.body}
            </Text>

            <Text
              position={[0, -0.75, 0.04]}
              fontSize={0.08}
              anchorX="center"
              anchorY="middle"
              color={p.color}
            >
              {`0${i + 1} · MISSION ENGINE`}
            </Text>

            {/* Small point light */}
            <pointLight position={[0, 0, 0.5]} intensity={0.8} color={p.color} distance={4} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

export { PANELS as MISSION_ENGINE_PANELS };
