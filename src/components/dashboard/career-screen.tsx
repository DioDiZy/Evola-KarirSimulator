import { RoundedBox } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type CareerTunnelField = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status: string;
  mediaUrl?: string | null;
};

type Props = {
  field: CareerTunnelField;
  index: number;
  total: number;
  position: [number, number, number];
  rotationY: number;
  accent: string;
  onActivate: (slug: string) => void;
};

function drawAbstract(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accent: string,
) {
  const backgroundGradient = ctx.createLinearGradient(
    0,
    0,
    width,
    height,
  );

  backgroundGradient.addColorStop(0, "#EEF2F7");
  backgroundGradient.addColorStop(1, "#F8FAFC");

  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;

  for (let index = 0; index < 30; index += 1) {
    ctx.beginPath();

    const y = (index / 30) * height;

    ctx.moveTo(0, y);
    ctx.lineTo(width, y + Math.sin(index) * 8);
    ctx.stroke();
  }

  ctx.restore();

  const radialGlow = ctx.createRadialGradient(
    width * 0.7,
    height * 0.35,
    20,
    width * 0.7,
    height * 0.35,
    width * 0.5,
  );

  radialGlow.addColorStop(0, accent);
  radialGlow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const imageRatio = image.width / image.height;
  const canvasRatio = canvasWidth / canvasHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > canvasRatio) {
    sourceWidth = image.height * canvasRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / canvasRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvasWidth,
    canvasHeight,
  );
}

function drawImageEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accent: string,
) {
  const darkGradient = ctx.createLinearGradient(0, 0, width, height);

  darkGradient.addColorStop(0, "rgba(2, 6, 12, 0.18)");
  darkGradient.addColorStop(0.5, "rgba(2, 6, 12, 0.08)");
  darkGradient.addColorStop(1, "rgba(2, 6, 12, 0.45)");

  ctx.fillStyle = darkGradient;
  ctx.fillRect(0, 0, width, height);

  const accentGlow = ctx.createRadialGradient(
    width * 0.76,
    height * 0.3,
    10,
    width * 0.76,
    height * 0.3,
    width * 0.62,
  );

  accentGlow.addColorStop(0, accent);
  accentGlow.addColorStop(0.4, `${accent}55`);
  accentGlow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = accentGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const sideShade = ctx.createLinearGradient(0, 0, width, 0);

  sideShade.addColorStop(0, "rgba(0,0,0,0.38)");
  sideShade.addColorStop(0.35, "rgba(0,0,0,0)");
  sideShade.addColorStop(0.75, "rgba(0,0,0,0)");
  sideShade.addColorStop(1, "rgba(0,0,0,0.32)");

  ctx.fillStyle = sideShade;
  ctx.fillRect(0, 0, width, height);
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  field: CareerTunnelField,
  index: number,
  total: number,
  accent: string,
) {
  const active = field.status === "active";

  const bottomOverlay = ctx.createLinearGradient(0, 0, 0, height);

  bottomOverlay.addColorStop(0, "rgba(2,6,12,0.05)");
  bottomOverlay.addColorStop(0.5, "rgba(2,6,12,0.18)");
  bottomOverlay.addColorStop(0.7, "rgba(2,6,12,0.72)");
  bottomOverlay.addColorStop(1, "rgba(2,6,12,0.98)");

  ctx.fillStyle = bottomOverlay;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = active ? 0.72 : 0.35;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = active ? accent : "#64748B";
  ctx.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(active ? "CAREER FIELD" : "COMING SOON", 40, 60);
  ctx.restore();

  const currentIndex = String(index + 1).padStart(2, "0");
  const totalFields = String(total).padStart(2, "0");
  const indexLabel = `${currentIndex} / ${totalFields}`;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "500 20px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText(
    indexLabel,
    width - 40 - ctx.measureText(indexLabel).width,
    60,
  );
  ctx.restore();

  const fieldName = field.name.toUpperCase();

  ctx.save();
  ctx.fillStyle = "#0F172A";
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 16;
  ctx.font = "800 64px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(fieldName, 40, height - 140);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(226,232,240,0.88)";
  ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";

  const maximumTaglineWidth = width - 80;
  let tagline = field.tagline || "";

  while (
    ctx.measureText(tagline).width > maximumTaglineWidth &&
    tagline.length > 3
  ) {
    tagline = tagline.slice(0, -1);
  }

  if (tagline !== field.tagline) {
    tagline = `${tagline.slice(0, -1)}…`;
  }

  ctx.fillText(tagline, 40, height - 100);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = active ? accent : "#64748B";
  ctx.font = "700 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(active ? "VIEW MORE  →" : "LOCKED", 40, height - 50);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = "#F8FAFC";

  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function CareerScreen({
  field,
  index,
  total,
  position,
  rotationY,
  accent,
  onActivate,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const [hovered, setHovered] = useState(false);

  const active = field.status === "active";

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 576;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context tidak tersedia.");
    }

    drawAbstract(
      context,
      canvas.width,
      canvas.height,
      accent,
    );

    drawOverlay(
      context,
      canvas.width,
      canvas.height,
      field,
      index,
      total,
      accent,
    );

    const canvasTexture = new THREE.CanvasTexture(canvas);

    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = 8;
    canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.generateMipmaps = true;
    canvasTexture.needsUpdate = true;

    if (field.mediaUrl) {
      const image = new Image();

      image.crossOrigin = "anonymous";

      image.onload = () => {
        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        drawImageCover(
          context,
          image,
          canvas.width,
          canvas.height,
        );

        drawImageEffects(
          context,
          canvas.width,
          canvas.height,
          accent,
        );

        drawOverlay(
          context,
          canvas.width,
          canvas.height,
          field,
          index,
          total,
          accent,
        );

        canvasTexture.needsUpdate = true;
      };

      image.onerror = () => {
        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        drawAbstract(
          context,
          canvas.width,
          canvas.height,
          accent,
        );

        drawOverlay(
          context,
          canvas.width,
          canvas.height,
          field,
          index,
          total,
          accent,
        );

        canvasTexture.needsUpdate = true;
      };

      image.src = field.mediaUrl;
    }

    return canvasTexture;
  }, [
    field.id,
    field.slug,
    field.name,
    field.tagline,
    field.status,
    field.mediaUrl,
    index,
    total,
    accent,
  ]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const targetScale = hovered && active ? 1.055 : 1;
    const currentScale = groupRef.current.scale.x;
    const scaleSpeed = Math.min(1, delta * 7);

    const nextScale =
      currentScale +
      (targetScale - currentScale) * scaleSpeed;

    groupRef.current.scale.setScalar(nextScale);

    const targetRotationZ =
      hovered && active
        ? Math.sin(state.clock.elapsedTime * 1.4) * 0.008
        : 0;

    groupRef.current.rotation.z +=
      (targetRotationZ - groupRef.current.rotation.z) *
      Math.min(1, delta * 5);

    if (lightRef.current) {
      const targetIntensity =
        hovered && active ? 4.2 : active ? 1.8 : 0.9;

      lightRef.current.intensity +=
        (targetIntensity - lightRef.current.intensity) *
        Math.min(1, delta * 6);
    }
  });

  const handleClick = (
    event: ThreeEvent<MouseEvent>,
  ) => {
    event.stopPropagation();

    if (active) {
      onActivate(field.slug);
    }
  };

  const handlePointerOver = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    event.stopPropagation();
    setHovered(true);

    if (active) {
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
    >
      <RoundedBox
        args={[4.72, 2.92, 0.24]}
        radius={0.1}
        smoothness={5}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#FFFFFF"
          metalness={0.9}
          roughness={0.28}
        />
      </RoundedBox>

      <RoundedBox
        args={[4.5, 2.7, 0.255]}
        radius={0.075}
        smoothness={4}
        position={[0, 0, 0.02]}
        castShadow
      >
        <meshStandardMaterial
          color="#FFFFFF"
          metalness={0.58}
          roughness={0.5}
        />
      </RoundedBox>

      <mesh
        position={[0, 0, 0.155]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[4.28, 2.48]} />

        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          transparent={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.163]}>
        <planeGeometry args={[4.3, 2.5]} />

        <meshBasicMaterial
          color={accent}
          transparent
          opacity={hovered && active ? 0.08 : 0.025}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 0, 1]}
        intensity={active ? 1.8 : 0.9}
        distance={5.5}
        color={active ? accent : "#64748B"}
        decay={2}
      />
    </group>
  );
}