import { MeshReflectorMaterial } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  length: number;
  isMobile: boolean;
};

export function TunnelEnvironment({ length, isMobile }: Props) {
  const halfLen = length / 2;
  const ceilingLamps = useMemo(() => {
    const spacing = isMobile ? 6 : 4;
    const count = Math.ceil(length / spacing);
    return Array.from({ length: count }, (_, i) => -halfLen + i * spacing + spacing / 2);
  }, [length, halfLen, isMobile]);

  const wallPanels = useMemo(() => {
    const spacing = 4;
    const count = Math.ceil(length / spacing);
    return Array.from({ length: count }, (_, i) => -halfLen + i * spacing + spacing / 2);
  }, [length, halfLen]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -halfLen + length / 2]} receiveShadow>
        <planeGeometry args={[16, length]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={isMobile ? 256 : 512}
          mixBlur={1}
          mixStrength={40}
          roughness={0.7}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#EEF2F7"
          metalness={0.6}
          mirror={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 3.4, -halfLen + length / 2]}>
        <boxGeometry args={[16, 0.2, length]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-7.5, 0.6, -halfLen + length / 2]}>
        <boxGeometry args={[0.4, 5.6, length]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Right wall */}
      <mesh position={[7.5, 0.6, -halfLen + length / 2]}>
        <boxGeometry args={[0.4, 5.6, length]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Neon rails */}
      <mesh position={[-7.28, -1.9, -halfLen + length / 2]}>
        <boxGeometry args={[0.05, 0.06, length]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh position={[7.28, -1.9, -halfLen + length / 2]}>
        <boxGeometry args={[0.05, 0.06, length]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>

      {/* Wall panels for depth */}
      {wallPanels.map((z) => (
        <group key={`panel-${z}`}>
          <mesh position={[-7.29, 0.6, z]}>
            <boxGeometry args={[0.02, 4.8, 0.06]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[7.29, 0.6, z]}>
            <boxGeometry args={[0.02, 4.8, 0.06]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Ceiling lamps */}
      {ceilingLamps.map((z, i) => (
        <group key={`lamp-${i}`} position={[0, 3.28, z]}>
          <mesh>
            <boxGeometry args={[2.4, 0.06, 0.3]} />
            <meshBasicMaterial color="#F1F5F9" toneMapped={false} />
          </mesh>
          {!isMobile && (
            <pointLight position={[0, -0.3, 0]} intensity={6} distance={9} color="#E2E8F0" decay={2} />
          )}
        </group>
      ))}

      {isMobile && ceilingLamps.filter((_, i) => i % 2 === 0).map((z, i) => (
        <pointLight key={`mlp-${i}`} position={[0, 2.9, z]} intensity={5} distance={10} color="#E2E8F0" decay={2} />
      ))}

      <ambientLight intensity={0.25} />
      <hemisphereLight args={["#64748B", "#EEF2F7", 0.4]} />
    </group>
  );
}
