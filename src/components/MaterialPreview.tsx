import React, { useImperativeHandle, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls, Stage, ContactShadows } from '@react-three/drei';

interface MaterialPreviewProps {
  className?: string;
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  ior?: number;
  opacity?: number;
  baseColorMap?: string;
  normalMap?: string;
  normalScale?: number;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
  emissiveMap?: string;
  alphaMap?: string;
  aoIntensity?: number;
  alphaTest?: number;
  repeatX?: number;
  repeatY?: number;
  environment?: 'warehouse' | 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'park' | 'lobby';
  model?: 'sphere' | 'box' | 'torusKnot' | 'icosahedron';
  autoRotate?: boolean;
  enableZoom?: boolean;
  showGrid?: boolean;
  showBackground?: boolean;
}

interface SphereProps {
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  ior?: number;
  opacity?: number;
  baseColorMap?: string;
  normalMap?: string;
  normalScale?: number;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
  emissiveMap?: string;
  alphaMap?: string;
  aoIntensity?: number;
  alphaTest?: number;
  repeatX?: number;
  repeatY?: number;
  model?: MaterialPreviewProps['model'];
  animate?: boolean;
}

function buildGeometry(model: MaterialPreviewProps['model']) {
  let g: THREE.BufferGeometry;
  switch (model) {
    case 'box':
      g = new THREE.BoxGeometry(1.6, 1.6, 1.6, 1, 1, 1);
      break;
    case 'torusKnot':
      g = new THREE.TorusKnotGeometry(0.85, 0.28, 220, 24);
      break;
    case 'icosahedron':
      g = new THREE.IcosahedronGeometry(1.1, 2);
      break;
    case 'sphere':
    default:
      g = new THREE.SphereGeometry(1, 64, 64);
      break;
  }
  // AO maps require uv2; reuse uv.
  const uv = g.getAttribute('uv');
  if (uv && !g.getAttribute('uv2')) {
    g.setAttribute('uv2', uv);
  }
  return g;
}

function applyTextureParams(tex: THREE.Texture, repeatX: number, repeatY: number) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

function useLoadedTexture(
  url: string | undefined,
  colorSpace: THREE.ColorSpace,
  repeatX: number,
  repeatY: number
) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  React.useEffect(() => {
    let disposed = false;
    if (!url) {
      setTex((old) => {
        if (old) old.dispose();
        return null;
      });
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(url, (t) => {
      if (disposed) {
        t.dispose();
        return;
      }
      t.colorSpace = colorSpace;
      // Apply default repeat; the separate effect below will apply current repeatX/repeatY
      // without forcing a reload when only tiling changes.
      applyTextureParams(t, 1, 1);
      setTex((old) => {
        if (old) old.dispose();
        return t;
      });
    });
    return () => {
      disposed = true;
    };
  }, [url, colorSpace]);

  React.useEffect(() => {
    if (!tex) return;
    applyTextureParams(tex, repeatX, repeatY);
  }, [tex, repeatX, repeatY]);

  return tex;
}

const Sphere: React.FC<SphereProps> = ({
  color,
  metalness,
  roughness,
  emissive = '#000000',
  emissiveIntensity = 0,
  clearcoat = 0,
  clearcoatRoughness = 0.03,
  transmission = 0,
  ior = 1.5,
  opacity = 1,
  baseColorMap,
  normalMap,
  normalScale = 1,
  roughnessMap,
  metalnessMap,
  aoMap,
  emissiveMap,
  alphaMap,
  aoIntensity = 1,
  alphaTest = 0,
  repeatX = 1,
  repeatY = 1,
  model = 'sphere',
  animate = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const geometry = React.useMemo(() => buildGeometry(model), [model]);
  React.useEffect(() => () => geometry.dispose(), [geometry]);

  const map = useLoadedTexture(baseColorMap, THREE.SRGBColorSpace, repeatX, repeatY);
  const nMap = useLoadedTexture(normalMap, THREE.NoColorSpace, repeatX, repeatY);
  const rMap = useLoadedTexture(roughnessMap, THREE.NoColorSpace, repeatX, repeatY);
  const mMap = useLoadedTexture(metalnessMap, THREE.NoColorSpace, repeatX, repeatY);
  const aMap = useLoadedTexture(aoMap, THREE.NoColorSpace, repeatX, repeatY);
  const eMap = useLoadedTexture(emissiveMap, THREE.SRGBColorSpace, repeatX, repeatY);
  const alMap = useLoadedTexture(alphaMap, THREE.NoColorSpace, repeatX, repeatY);

  useFrame((state) => {
    if (!animate) return;
    if (meshRef.current) {
      // Smooth rotation
      meshRef.current.rotation.y += 0.005;

      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={hovered ? 1.1 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={geometry} attach="geometry" />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        transmission={transmission}
        ior={ior}
        thickness={transmission > 0 ? 1 : 0}
        attenuationDistance={transmission > 0 ? 0.8 : 0}
        attenuationColor={'#ffffff'}
        opacity={opacity}
        transparent={opacity < 1 || transmission > 0 || !!alMap}
        alphaTest={alphaTest}
        envMapIntensity={1.75}
        map={map ?? undefined}
        normalMap={nMap ?? undefined}
        normalScale={new THREE.Vector2(normalScale, normalScale)}
        roughnessMap={rMap ?? undefined}
        metalnessMap={mMap ?? undefined}
        aoMap={aMap ?? undefined}
        aoMapIntensity={aoIntensity}
        emissiveMap={eMap ?? undefined}
        alphaMap={alMap ?? undefined}
      />
    </mesh>
  );
};

const Scene: React.FC<SphereProps & { autoRotate?: boolean; enableZoom?: boolean; showGrid?: boolean }> = ({
  autoRotate,
  enableZoom,
  showGrid,
  ...props
}) => {
  return (
    <>
      {/* Main sphere */}
      <Sphere {...props} animate={!!autoRotate} />

      {/* Contact shadows for better grounding */}
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
      />

      {showGrid && <gridHelper args={[12, 12, '#444444', '#222222']} position={[0, -1.4, 0]} />}

      {/* Camera controls */}
      <OrbitControls
        enableZoom={!!enableZoom}
        enablePan={false}
        autoRotate={!!autoRotate}
        autoRotateSpeed={1.25}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

export type MaterialPreviewHandle = {
  snapshotPng: () => Promise<Blob | null>;
  resetView: () => void;
};

class PreviewErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const MaterialPreview = React.forwardRef<MaterialPreviewHandle, MaterialPreviewProps>((props, ref) => {
  const {
    className = '',
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    opacity,
    baseColorMap,
    normalMap,
    normalScale,
    roughnessMap,
    metalnessMap,
    aoMap,
    emissiveMap,
    alphaMap,
    aoIntensity,
    alphaTest,
    repeatX,
    repeatY,
    environment = 'warehouse',
    model = 'sphere',
    autoRotate = true,
    enableZoom = false,
    showGrid = false,
    showBackground = true,
  } = props;
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const [frameNonce, setFrameNonce] = useState(0);
  const [captureBufferEnabled, setCaptureBufferEnabled] = useState(false);
  const [snapshotRequestNonce, setSnapshotRequestNonce] = useState(0);
  const pendingSnapshotResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      snapshotPng: () =>
        new Promise((resolve) => {
          if (pendingSnapshotResolveRef.current) pendingSnapshotResolveRef.current(null);
          pendingSnapshotResolveRef.current = resolve;
          setCaptureBufferEnabled(true);
          setSnapshotRequestNonce((n) => n + 1);
        }),
      resetView: () => setFrameNonce((n) => n + 1),
    }),
    []
  );

  React.useEffect(() => {
    if (!snapshotRequestNonce || !captureBufferEnabled) return;
    if (!pendingSnapshotResolveRef.current) return;

    const raf = window.requestAnimationFrame(() => {
      const canvas = glRef.current?.domElement;
      if (!canvas) {
        pendingSnapshotResolveRef.current?.(null);
        pendingSnapshotResolveRef.current = null;
        setCaptureBufferEnabled(false);
        return;
      }

      canvas.toBlob((blob) => {
        pendingSnapshotResolveRef.current?.(blob);
        pendingSnapshotResolveRef.current = null;
        setCaptureBufferEnabled(false);
      }, 'image/png');
    });

    return () => window.cancelAnimationFrame(raf);
  }, [snapshotRequestNonce, captureBufferEnabled]);

  React.useEffect(() => {
    return () => {
      pendingSnapshotResolveRef.current?.(null);
      pendingSnapshotResolveRef.current = null;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative w-full h-full ${className} rounded-xl overflow-hidden`}
    >
      <PreviewErrorBoundary fallback={<div className="w-full h-full bg-gradient-to-b from-gray-900/60 to-black/80" aria-hidden="true" />}>
        <Canvas
          frameloop={autoRotate || captureBufferEnabled ? 'always' : 'demand'}
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: captureBufferEnabled, alpha: !showBackground }}
          onCreated={({ gl }) => {
            glRef.current = gl;
          }}
          camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
          className="bg-gradient-to-b from-gray-900/50 to-black/50"
        >
          {showBackground && <color attach="background" args={['#000000']} />}
          {showBackground && <fog attach="fog" args={['#000000', 10, 20]} />}

          <Stage key={frameNonce} intensity={1} environment={environment} adjustCamera={0.55}>
            <Scene
              color={color}
              metalness={metalness}
              roughness={roughness}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              clearcoat={clearcoat}
              clearcoatRoughness={clearcoatRoughness}
              transmission={transmission}
              ior={ior}
              opacity={opacity}
              baseColorMap={baseColorMap}
              normalMap={normalMap}
              normalScale={normalScale}
              roughnessMap={roughnessMap}
              metalnessMap={metalnessMap}
              aoMap={aoMap}
              emissiveMap={emissiveMap}
              alphaMap={alphaMap}
              aoIntensity={aoIntensity}
              alphaTest={alphaTest}
              repeatX={repeatX}
              repeatY={repeatY}
              model={model}
              autoRotate={autoRotate}
              enableZoom={enableZoom}
              showGrid={showGrid}
            />
          </Stage>
        </Canvas>
      </PreviewErrorBoundary>
      
      {/* Optional overlay for better visual integration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  );
});

export default MaterialPreview;
