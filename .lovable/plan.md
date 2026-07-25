# CareerLab → Career Simulation Game

Mengubah alur `Bidang → Track → Episode → Mission` dari halaman tradisional menjadi **single WebGL world** dengan camera-driven transitions. Dashboard tidak berubah (sudah selesai).

## Prinsip

1. **Satu Canvas R3F persisten** membungkus seluruh area game. Perpindahan "halaman" = camera flythrough di dalam scene yang sama, bukan route change.
2. **Route tetap ada** untuk deep-link, SEO, dan back-button — tapi navigasi user default via klik objek 3D yang memicu animasi kamera + `router.navigate` di akhir animasi.
3. **Fallback penuh** untuk no-WebGL & mobile lemah: layout HTML lama tetap tersedia (Bidang gallery grid, Track list, Mission list).

## Arsitektur

```text
<GameShell>                       ← baru, wraps _authenticated layout selain /dashboard & /profile
  <Canvas>                        ← persisten selama user di dalam "game area"
    <WorldStage />                ← state: "fields" | "field" | "track" | "episode"
      <FieldsGallery />           ← 4 objek 3D floating (bidang karier)
      <FieldChamber />            ← ruang dalam bidang, portal ke tracks
      <TrackMap />                ← node-based 3D map: levels + episodes sebagai checkpoint terhubung
      <EpisodePod />              ← pod imersif utk detail episode + tombol Mulai (→ mission runner 2D)
    <CameraDirector />            ← useSpring/lerp target+position berdasarkan stage+focusId
  </Canvas>
  <HUD />                         ← overlay HTML: breadcrumb, tombol back, judul, CTA
  <FallbackLayer />               ← saat !hasWebGL: render layout lama
</GameShell>
```

## Camera Choreography

- **Fields view**: kamera jauh, orbit lambat, 4 objek melayang dalam formasi setengah lingkaran.
- **Klik bidang** → kamera dolly + zoom-in ke objek terpilih (~1.2s ease-in-out cubic), objek lain fade+scale down, ambient shift ke warna bidang → arrived → `router.navigate({ to: '/fields/$slug' })` tanpa remount canvas.
- **Field chamber**: setelah zoom, muncul portal/altar dengan track cards 3D melayang.
- **Klik track** → kamera terbang menembus portal → `TrackMap` reveal (node graph 3D).
- **Klik episode node** → kamera fokus ke node, panel `EpisodePod` slide-in dari HUD → tombol "Mulai Misi" → route ke mission runner 2D (out of canvas, existing UX dipertahankan).
- **Back**: kamera reverse ke stage sebelumnya, lalu update route.

## Konten 3D per Stage

- **FieldsGallery** — 4 shape berbeda per bidang (UI/UX = kubus prisma, Frontend = wireframe sphere, Backend = tower stack, AI = orb neural). Idle: float + rotate. Hover: scale 1.08, emissive boost, halo ring. Ambient particles per bidang berwarna aksen.
- **FieldChamber** — ruangan silinder dengan refleksi lantai, 2-3 pedestal (satu per track). Track yang non-active tampil ter-veil + label "Segera Hadir".
- **TrackMap** — node-based path: setiap Level = cluster, Episode = platform hex terhubung garis neon. Progress ditandai warna (done = amber, current = pulsing, locked = redup). Layout linier melengkung, kamera mengikuti path.
- **EpisodePod** — floating console: judul, sinopsis, reward, tombol Mulai. Muncul di HUD saat episode dipilih.

## HUD (HTML overlay)

- Breadcrumb kiri-atas: `Bidang › Frontend › Level Junior › Episode 2`, tiap segmen klik = kamera balik.
- Tombol Back besar (Escape key).
- Judul stage + subjudul via Framer Motion fade.
- Stats mini (Performance, Credit) di kanan atas.

## Fallback & Aksesibilitas

- Deteksi WebGL & `prefers-reduced-motion` di `GameShell`. Jika gagal → render existing pages (`fields.$fieldSlug.tsx`, `tracks.$trackSlug.tsx`) tanpa Canvas.
- Semua stage 3D menyediakan tombol HTML tersembunyi (`sr-only` + focusable) yang mirror navigasi — screen reader & keyboard bisa lewati kamera.
- Mobile: disable postprocessing, reduce particles, kamera dolly lebih pendek.

## Perubahan File

**Baru**
- `src/components/game/game-shell.tsx` — provider Canvas persisten + HUD + fallback detector.
- `src/components/game/world-stage.tsx` — mesin stage & orchestrator.
- `src/components/game/camera-director.tsx` — animasi kamera.
- `src/components/game/fields-gallery.tsx` — 4 objek bidang.
- `src/components/game/field-object.tsx` — komponen 3D per bidang (shape by slug).
- `src/components/game/field-chamber.tsx` — ruang track picker.
- `src/components/game/track-map.tsx` — node graph 3D level+episode.
- `src/components/game/episode-pod.tsx` — HUD detail episode.
- `src/components/game/hud.tsx` — breadcrumb, back, title.
- `src/hooks/use-webgl-support.ts` — deteksi kapabilitas.
- `src/lib/game-store.ts` — Zustand kecil untuk stage + focus id + transition state.

**Diubah**
- `src/routes/_authenticated/route.tsx` — bungkus outlet dengan `<GameShell>` untuk sub-route `fields/*` dan `tracks/*` (dashboard & profile tetap lama).
- `src/routes/_authenticated/fields.$fieldSlug.tsx` — jadi thin route: sync focus ke game store; fallback content dipertahankan.
- `src/routes/_authenticated/tracks.$trackSlug.tsx` — sama, sync ke store; expose `TrackMap` via shell.
- `src/routes/_authenticated/episodes.$episodeId.tsx` — biarkan tetap 2D (mission runner), tapi tombol "Kembali" pakai animasi kamera reverse via store.
- `src/routes/index.tsx` — tambahkan mode "masuk ke game" (opsional CTA), landing page utama tak berubah drastis.

**Tetap**
- Dashboard (`_authenticated/dashboard.tsx`), Profile, Auth, Landing hero — tidak berubah.
- `career-tunnel` dashboard tetap dipakai di dashboard.

## Teknis

- Persist Canvas: `GameShell` di-mount di layout route, Canvas hanya remount saat masuk/keluar game area (bukan tiap sub-route).
- Sinkron route ↔ store: `useEffect` di setiap sub-route panggil `gameStore.setFocus({ stage, id })`. `CameraDirector` react ke store, jalankan animasi. Saat animasi kelar dari klik 3D → panggil `router.navigate`.
- Animasi kamera pakai `@react-spring/three` (sudah tersedia via drei ecosystem) atau lerp manual di `useFrame` — pilih lerp manual untuk hindari dep baru.
- Data: reuse `listFields`, `getFieldBySlug`, `getTrackBySlug`, `getMyProgress` — semua query sudah ada.
- Performance budget: <60k tris total; instanced meshes untuk partikel; `MeshReflectorMaterial` hanya desktop.

## Urutan Implementasi

1. `use-webgl-support`, `game-store`, `game-shell` skeleton + fallback.
2. `world-stage` + `camera-director` (lerp) dengan dummy shapes.
3. `fields-gallery` + integrasi klik → route.
4. `field-chamber` + track picker.
5. `track-map` node graph + `episode-pod`.
6. `hud` breadcrumb + back gesture (Esc).
7. Wire ke `_authenticated/route.tsx`, konvert 2 sub-route jadi tipis.
8. QA: keyboard, mobile viewport, no-WebGL, deep link refresh.

## Batas ruang lingkup

- Dashboard tidak diubah.
- Mission runner (in-episode) tetap UI 2D — konsisten dengan requirement sebelumnya.
- Tidak menambah tabel DB baru.
