import { RoundedBox } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
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

const OUTER_FRAME_WIDTH = 4.84;
const MOBILE_BREAKPOINT = 768;

/**
 * Membuat background fallback ketika bidang
 * belum memiliki gambar.
 */
function drawAbstract(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accent: string,
) {
  const backgroundGradient = ctx.createLinearGradient(0, 0, width, height);

  backgroundGradient.addColorStop(0, "#030712");
  backgroundGradient.addColorStop(0.5, "#07111F");
  backgroundGradient.addColorStop(1, "#0F172A");

  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, width, height);

  /**
   * Grid futuristik.
   */
  ctx.save();

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;

  const gridSize = 48;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();

  /**
   * Garis gelombang horizontal.
   */
  ctx.save();

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1;

  for (let lineIndex = 0; lineIndex < 24; lineIndex += 1) {
    ctx.beginPath();

    const baseY = (lineIndex / 24) * height;

    for (let x = 0; x <= width; x += 16) {
      const wave = Math.sin(x * 0.012 + lineIndex * 0.8) * 7;

      if (x === 0) {
        ctx.moveTo(x, baseY + wave);
      } else {
        ctx.lineTo(x, baseY + wave);
      }
    }

    ctx.stroke();
  }

  ctx.restore();

  /**
   * Cahaya aksen utama.
   */
  const radialGlow = ctx.createRadialGradient(
    width * 0.72,
    height * 0.3,
    10,
    width * 0.72,
    height * 0.3,
    width * 0.52,
  );

  radialGlow.addColorStop(0, `${accent}CC`);
  radialGlow.addColorStop(0.3, `${accent}55`);
  radialGlow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();

  ctx.globalAlpha = 0.32;
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  /**
   * Cahaya aksen kedua.
   */
  const secondaryGlow = ctx.createRadialGradient(
    width * 0.18,
    height * 0.8,
    0,
    width * 0.18,
    height * 0.8,
    width * 0.35,
  );

  secondaryGlow.addColorStop(0, `${accent}44`);
  secondaryGlow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = secondaryGlow;
  ctx.fillRect(0, 0, width, height);

  /**
   * Vignette.
   */
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.15,
    width / 2,
    height / 2,
    width * 0.75,
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.68)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
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

/**
 * Memberikan efek dark cinematic pada gambar.
 */
function drawImageEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accent: string,
) {
  const darkGradient = ctx.createLinearGradient(0, 0, width, height);

  darkGradient.addColorStop(0, "rgba(2,6,23,0.42)");
  darkGradient.addColorStop(0.45, "rgba(2,6,23,0.16)");
  darkGradient.addColorStop(1, "rgba(2,6,23,0.72)");

  ctx.fillStyle = darkGradient;
  ctx.fillRect(0, 0, width, height);

  /**
   * Tint biru gelap.
   */
  ctx.save();

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(7,17,31,0.42)";
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  const accentGlow = ctx.createRadialGradient(
    width * 0.76,
    height * 0.28,
    10,
    width * 0.76,
    height * 0.28,
    width * 0.62,
  );

  accentGlow.addColorStop(0, `${accent}CC`);
  accentGlow.addColorStop(0.4, `${accent}44`);
  accentGlow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = accentGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  /**
   * Bayangan sisi.
   */
  const sideShade = ctx.createLinearGradient(0, 0, width, 0);

  sideShade.addColorStop(0, "rgba(0,0,0,0.62)");
  sideShade.addColorStop(0.3, "rgba(0,0,0,0.06)");
  sideShade.addColorStop(0.7, "rgba(0,0,0,0.06)");
  sideShade.addColorStop(1, "rgba(0,0,0,0.55)");

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

  /**
   * Overlay gelap untuk keterbacaan teks.
   */
  const bottomOverlay = ctx.createLinearGradient(0, 0, 0, height);

  bottomOverlay.addColorStop(0, "rgba(2,6,23,0.14)");
  bottomOverlay.addColorStop(0.42, "rgba(2,6,23,0.18)");
  bottomOverlay.addColorStop(0.66, "rgba(2,6,23,0.72)");
  bottomOverlay.addColorStop(1, "rgba(2,6,23,0.98)");

  ctx.fillStyle = bottomOverlay;
  ctx.fillRect(0, 0, width, height);

  /**
   * Border bagian dalam.
   */
  ctx.save();

  ctx.strokeStyle = active ? accent : "#475569";

  ctx.globalAlpha = active ? 0.72 : 0.3;
  ctx.lineWidth = 2;

  ctx.strokeRect(14, 14, width - 28, height - 28);

  ctx.restore();

  /**
   * Garis aksen bagian atas.
   */
  const topAccentGradient = ctx.createLinearGradient(40, 0, 250, 0);

  topAccentGradient.addColorStop(0, active ? accent : "#64748B");
  topAccentGradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = topAccentGradient;
  ctx.fillRect(40, 82, 210, 3);

  /**
   * Label status.
   */
  ctx.save();

  ctx.fillStyle = active ? accent : "#64748B";

  ctx.shadowColor = active ? accent : "transparent";

  ctx.shadowBlur = active ? 12 : 0;

  ctx.font = '600 20px "Poppins", ui-sans-serif, system-ui, sans-serif';

  ctx.fillText(active ? "TERSEDIA" : "AKAN DATANG", 40, 58);

  ctx.restore();

  /**
   * Index bidang.
   */
  const currentIndex = String(index + 1).padStart(2, "0");

  const totalFields = String(total).padStart(2, "0");

  const indexLabel = `${currentIndex} / ${totalFields}`;

  ctx.save();

  ctx.fillStyle = "rgba(203,213,225,0.82)";

  ctx.font = '500 19px "JetBrains Mono", ui-monospace, monospace';

  ctx.fillText(indexLabel, width - 40 - ctx.measureText(indexLabel).width, 58);

  ctx.restore();

  /**
   * Nomor dekoratif besar.
   */
  ctx.save();

  ctx.fillStyle = active ? `${accent}18` : "rgba(100,116,139,0.08)";

  ctx.font = '700 180px "Poppins", ui-sans-serif, system-ui, sans-serif';

  const decorativeNumber = String(index + 1).padStart(2, "0");

  const decorativeWidth = ctx.measureText(decorativeNumber).width;

  ctx.fillText(decorativeNumber, width - decorativeWidth - 35, height - 75);

  ctx.restore();

  /**
   * Nama bidang.
   */
  const fieldName = field.name.toUpperCase();

  ctx.save();

  ctx.fillStyle = active ? "#F8FAFC" : "#94A3B8";

  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 18;

  ctx.font = '700 58px "Poppins", ui-sans-serif, system-ui, sans-serif';

  ctx.fillText(fieldName, 40, height - 142);

  ctx.restore();

  /**
   * Tagline.
   */
  ctx.save();

  ctx.fillStyle = active ? "rgba(203,213,225,0.9)" : "rgba(148,163,184,0.72)";

  ctx.font = '400 23px "Poppins", ui-sans-serif, system-ui, sans-serif';

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

  ctx.fillText(tagline, 40, height - 98);

  ctx.restore();

  /**
   * CTA.
   */
  ctx.save();

  ctx.fillStyle = active ? accent : "#64748B";

  ctx.shadowColor = active ? accent : "transparent";

  ctx.shadowBlur = active ? 10 : 0;

  ctx.font = '600 19px "Poppins", ui-sans-serif, system-ui, sans-serif';

  ctx.fillText(active ? "EXPLORE FIELD  →" : "FIELD LOCKED", 40, height - 48);

  ctx.restore();

  /**
   * Status dot.
   */
  ctx.save();
  ctx.beginPath();

  ctx.arc(width - 52, height - 53, 6, 0, Math.PI * 2);

  ctx.fillStyle = active ? accent : "#475569";

  ctx.shadowColor = active ? accent : "transparent";

  ctx.shadowBlur = active ? 14 : 0;

  ctx.fill();
  ctx.restore();

  /**
   * Scanlines tipis.
   */
  ctx.save();

  ctx.globalAlpha = 0.025;
  ctx.fillStyle = "#FFFFFF";

  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }

  ctx.restore();

  /**
   * Vignette layar.
   */
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.25,
    width / 2,
    height / 2,
    width * 0.75,
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.3)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
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

  const worldPositionRef = useRef(new THREE.Vector3());

  const { camera, size, viewport } = useThree();

  const [hovered, setHovered] = useState(false);

  const active = field.status === "active";

  const isMobile = size.width < MOBILE_BREAKPOINT;

  /**
   * Rotasi monitor dikurangi pada mobile
   * agar layar lebih mudah dibaca.
   */
  const responsiveRotationY = isMobile ? rotationY * 0.45 : rotationY;

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 576;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context tidak tersedia.");
    }

    drawAbstract(context, canvas.width, canvas.height, accent);

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
        context.clearRect(0, 0, canvas.width, canvas.height);

        drawImageCover(context, image, canvas.width, canvas.height);

        drawImageEffects(context, canvas.width, canvas.height, accent);

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
        context.clearRect(0, 0, canvas.width, canvas.height);

        drawAbstract(context, canvas.width, canvas.height, accent);

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

  /**
   * Hapus texture dari memory ketika komponen
   * dilepas atau texture berubah.
   */
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  /**
   * Hilangkan state hover ketika layout berubah
   * dari desktop ke mobile.
   */
  useEffect(() => {
    if (isMobile) {
      setHovered(false);
      document.body.style.cursor = "auto";
    }
  }, [isMobile]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    let responsiveScale = 1;

    if (isMobile) {
      /**
       * Mengambil posisi monitor yang sebenarnya
       * di world space.
       */
      group.getWorldPosition(worldPositionRef.current);

      /**
       * Menghitung ukuran viewport berdasarkan
       * jarak kamera terhadap monitor.
       *
       * Nilai viewport akan berubah ketika kamera
       * bergerak saat pengguna melakukan scroll.
       */
      const currentViewport = viewport.getCurrentViewport(
        camera,
        worldPositionRef.current,
      );

      /**
       * Pada portrait, monitor memakai maksimal
       * 72% lebar viewport.
       *
       * Pada landscape mobile, monitor dapat memakai
       * maksimal 80% lebar viewport.
       */
      const viewportFill = size.height > size.width ? 0.72 : 0.8;

      const maximumVisibleWidth = currentViewport.width * viewportFill;

      responsiveScale = THREE.MathUtils.clamp(
        maximumVisibleWidth / OUTER_FRAME_WIDTH,
        0.32,
        0.82,
      );
    }

    /**
     * Hover enlargement hanya aktif
     * pada desktop.
     */
    const hoverMultiplier = !isMobile && hovered && active ? 1.045 : 1;

    const targetScale = responsiveScale * hoverMultiplier;

    /**
     * Interpolasi agar perubahan ukuran halus
     * dan tidak meloncat ketika kamera bergerak.
     */
    const scaleLerpFactor = 1 - Math.exp(-8 * delta);

    const nextScale = THREE.MathUtils.lerp(
      group.scale.x,
      targetScale,
      scaleLerpFactor,
    );

    group.scale.setScalar(nextScale);

    /**
     * Animasi tilt hanya pada desktop.
     */
    const targetRotationZ =
      !isMobile && hovered && active
        ? Math.sin(state.clock.elapsedTime * 1.4) * 0.006
        : 0;

    const rotationLerpFactor = 1 - Math.exp(-5 * delta);

    group.rotation.z = THREE.MathUtils.lerp(
      group.rotation.z,
      targetRotationZ,
      rotationLerpFactor,
    );

    if (lightRef.current) {
      const targetIntensity =
        !isMobile && hovered && active ? 2.2 : active ? 0.9 : 0.35;

      const lightLerpFactor = 1 - Math.exp(-6 * delta);

      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        targetIntensity,
        lightLerpFactor,
      );
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (active) {
      onActivate(field.slug);
    }
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    /**
     * Hover tidak digunakan pada perangkat mobile.
     */
    if (isMobile) {
      return;
    }

    setHovered(true);

    if (active) {
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    if (isMobile) {
      return;
    }

    setHovered(false);

    document.body.style.cursor = "auto";
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, responsiveRotationY, 0]}
    >
      {/* Shadow frame */}
      <RoundedBox
        args={[4.84, 3.04, 0.28]}
        radius={0.12}
        smoothness={5}
        position={[0, -0.03, -0.05]}
      >
        <meshStandardMaterial
          color="#020617"
          metalness={0.82}
          roughness={0.32}
        />
      </RoundedBox>

      {/* Main dark frame */}
      <RoundedBox
        args={[4.72, 2.92, 0.24]}
        radius={0.1}
        smoothness={5}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#0B1120"
          metalness={0.88}
          roughness={0.26}
        />
      </RoundedBox>

      {/* Inner bezel */}
      <RoundedBox
        args={[4.5, 2.7, 0.255]}
        radius={0.075}
        smoothness={4}
        position={[0, 0, 0.02]}
        castShadow
      >
        <meshStandardMaterial
          color="#111827"
          metalness={0.7}
          roughness={0.36}
        />
      </RoundedBox>

      {/* Accent frame */}
      <RoundedBox
        args={[4.37, 2.57, 0.035]}
        radius={0.055}
        smoothness={4}
        position={[0, 0, 0.151]}
      >
        <meshBasicMaterial
          color={active ? accent : "#334155"}
          transparent
          opacity={hovered && active ? 0.7 : active ? 0.38 : 0.18}
          toneMapped={false}
        />
      </RoundedBox>

      {/* Display */}
      <mesh
        position={[0, 0, 0.174]}
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

      {/* Hover glow */}
      <mesh position={[0, 0, 0.181]}>
        <planeGeometry args={[4.29, 2.49]} />

        <meshBasicMaterial
          color={active ? accent : "#334155"}
          transparent
          opacity={!isMobile && hovered && active ? 0.075 : 0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Bottom status light */}
      <mesh position={[0, -1.39, 0.16]}>
        <boxGeometry args={[0.36, 0.025, 0.025]} />

        <meshBasicMaterial
          color={active ? accent : "#334155"}
          transparent
          opacity={active ? 0.9 : 0.45}
          toneMapped={false}
        />
      </mesh>

      {/* Accent light */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 1.1]}
        intensity={active ? 0.9 : 0.35}
        distance={4.5}
        color={active ? accent : "#334155"}
        decay={2}
      />
    </group>
  );
}
