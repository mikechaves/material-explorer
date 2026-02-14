import React, { useImperativeHandle, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import {
  type BufferGeometry,
  type ColorSpace,
  type Mesh,
  type Texture,
  type WebGLRenderer,
  BoxGeometry,
  IcosahedronGeometry,
  NoColorSpace,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusKnotGeometry,
  Vector2,
} from 'three';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';

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

type EnvironmentName = NonNullable<MaterialPreviewProps['environment']>;

type LightingPreset = {
  ambientIntensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  keyLightPosition: [number, number, number];
  fillLightColor: string;
  fillLightIntensity: number;
  fillLightPosition: [number, number, number];
  rimLightColor: string;
  rimLightIntensity: number;
  rimLightPosition: [number, number, number];
};

const LIGHTING_PRESETS: Record<EnvironmentName, LightingPreset> = {
  warehouse: {
    ambientIntensity: 0.34,
    keyLightColor: '#ffffff',
    keyLightIntensity: 1.35,
    keyLightPosition: [3.8, 3.2, 2.6],
    fillLightColor: '#8fb6ff',
    fillLightIntensity: 0.38,
    fillLightPosition: [-3.5, 2.4, -2],
    rimLightColor: '#ffe2b5',
    rimLightIntensity: 0.32,
    rimLightPosition: [0, 2.2, -4],
  },
  studio: {
    ambientIntensity: 0.42,
    keyLightColor: '#ffffff',
    keyLightIntensity: 1.55,
    keyLightPosition: [2.9, 2.8, 2.8],
    fillLightColor: '#e8f1ff',
    fillLightIntensity: 0.55,
    fillLightPosition: [-2.2, 2, -1.5],
    rimLightColor: '#d2dcff',
    rimLightIntensity: 0.45,
    rimLightPosition: [0, 2.6, -3.5],
  },
  city: {
    ambientIntensity: 0.32,
    keyLightColor: '#d9e5ff',
    keyLightIntensity: 1.2,
    keyLightPosition: [4, 3, 1.6],
    fillLightColor: '#8fc0ff',
    fillLightIntensity: 0.33,
    fillLightPosition: [-3.8, 1.8, -2.5],
    rimLightColor: '#ffd2b0',
    rimLightIntensity: 0.32,
    rimLightPosition: [0, 2.8, -4.2],
  },
  sunset: {
    ambientIntensity: 0.31,
    keyLightColor: '#ffb98f',
    keyLightIntensity: 1.55,
    keyLightPosition: [3.4, 2.6, 2.2],
    fillLightColor: '#9eb8ff',
    fillLightIntensity: 0.38,
    fillLightPosition: [-3.2, 2.1, -1.8],
    rimLightColor: '#ff8a65',
    rimLightIntensity: 0.38,
    rimLightPosition: [0, 2.4, -4],
  },
  dawn: {
    ambientIntensity: 0.34,
    keyLightColor: '#ffd8b5',
    keyLightIntensity: 1.4,
    keyLightPosition: [3.1, 2.8, 2.5],
    fillLightColor: '#b4c7ff',
    fillLightIntensity: 0.39,
    fillLightPosition: [-3, 2.1, -2.2],
    rimLightColor: '#ffd0f5',
    rimLightIntensity: 0.3,
    rimLightPosition: [0, 2.5, -3.8],
  },
  night: {
    ambientIntensity: 0.2,
    keyLightColor: '#9cb6ff',
    keyLightIntensity: 1.05,
    keyLightPosition: [3.5, 2.6, 2.5],
    fillLightColor: '#4f6bd8',
    fillLightIntensity: 0.3,
    fillLightPosition: [-3, 1.8, -2],
    rimLightColor: '#c2d3ff',
    rimLightIntensity: 0.42,
    rimLightPosition: [0, 2.8, -4],
  },
  forest: {
    ambientIntensity: 0.3,
    keyLightColor: '#d5ffce',
    keyLightIntensity: 1.15,
    keyLightPosition: [3.7, 3, 2],
    fillLightColor: '#9ed0a0',
    fillLightIntensity: 0.42,
    fillLightPosition: [-3.4, 2.3, -2.3],
    rimLightColor: '#f0ffe7',
    rimLightIntensity: 0.24,
    rimLightPosition: [0, 2.1, -3.8],
  },
  apartment: {
    ambientIntensity: 0.4,
    keyLightColor: '#fff3dc',
    keyLightIntensity: 1.35,
    keyLightPosition: [2.7, 2.4, 2.8],
    fillLightColor: '#d6e3ff',
    fillLightIntensity: 0.35,
    fillLightPosition: [-2.8, 2.1, -1.8],
    rimLightColor: '#fff7ea',
    rimLightIntensity: 0.22,
    rimLightPosition: [0, 2.2, -3.2],
  },
  park: {
    ambientIntensity: 0.32,
    keyLightColor: '#f4ffde',
    keyLightIntensity: 1.22,
    keyLightPosition: [3.6, 2.8, 2.6],
    fillLightColor: '#b5e3c4',
    fillLightIntensity: 0.34,
    fillLightPosition: [-3.2, 2.1, -2.2],
    rimLightColor: '#d8fff3',
    rimLightIntensity: 0.28,
    rimLightPosition: [0, 2.3, -3.6],
  },
  lobby: {
    ambientIntensity: 0.38,
    keyLightColor: '#fff1d5',
    keyLightIntensity: 1.4,
    keyLightPosition: [3, 2.5, 2.4],
    fillLightColor: '#dbe7ff',
    fillLightIntensity: 0.32,
    fillLightPosition: [-2.7, 2, -1.9],
    rimLightColor: '#ffe8c2',
    rimLightIntensity: 0.28,
    rimLightPosition: [0, 2.4, -3.4],
  },
};

function buildGeometry(model: MaterialPreviewProps['model']) {
  let g: BufferGeometry;
  switch (model) {
    case 'box':
      g = new BoxGeometry(1.6, 1.6, 1.6, 1, 1, 1);
      break;
    case 'torusKnot':
      g = new TorusKnotGeometry(0.85, 0.28, 220, 24);
      break;
    case 'icosahedron':
      g = new IcosahedronGeometry(1.1, 2);
      break;
    case 'sphere':
    default:
      g = new SphereGeometry(1, 64, 64);
      break;
  }
  // AO maps require uv2; reuse uv.
  const uv = g.getAttribute('uv');
  if (uv && !g.getAttribute('uv2')) {
    g.setAttribute('uv2', uv);
  }
  return g;
}

function applyTextureParams(tex: Texture, repeatX: number, repeatY: number) {
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

function useLoadedTexture(
  url: string | undefined,
  colorSpace: ColorSpace,
  repeatX: number,
  repeatY: number
) {
  const [tex, setTex] = useState<Texture | null>(null);
  React.useEffect(() => {
    let disposed = false;
    if (!url) {
      setTex((old) => {
        if (old) old.dispose();
        return null;
      });
      return;
    }
    const loader = new TextureLoader();
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
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const geometry = React.useMemo(() => buildGeometry(model), [model]);
  React.useEffect(() => () => geometry.dispose(), [geometry]);

  const map = useLoadedTexture(baseColorMap, SRGBColorSpace, repeatX, repeatY);
  const nMap = useLoadedTexture(normalMap, NoColorSpace, repeatX, repeatY);
  const rMap = useLoadedTexture(roughnessMap, NoColorSpace, repeatX, repeatY);
  const mMap = useLoadedTexture(metalnessMap, NoColorSpace, repeatX, repeatY);
  const aMap = useLoadedTexture(aoMap, NoColorSpace, repeatX, repeatY);
  const eMap = useLoadedTexture(emissiveMap, SRGBColorSpace, repeatX, repeatY);
  const alMap = useLoadedTexture(alphaMap, NoColorSpace, repeatX, repeatY);

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
        normalScale={new Vector2(normalScale, normalScale)}
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

const Scene: React.FC<
  SphereProps & { environment?: MaterialPreviewProps['environment']; autoRotate?: boolean; enableZoom?: boolean; showGrid?: boolean }
> = ({
  environment = 'warehouse',
  autoRotate,
  enableZoom,
  showGrid,
  ...props
}) => {
  const lighting = LIGHTING_PRESETS[environment];
  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <directionalLight
        color={lighting.keyLightColor}
        intensity={lighting.keyLightIntensity}
        position={lighting.keyLightPosition}
      />
      <pointLight
        color={lighting.fillLightColor}
        intensity={lighting.fillLightIntensity}
        position={lighting.fillLightPosition}
      />
      <pointLight
        color={lighting.rimLightColor}
        intensity={lighting.rimLightIntensity}
        position={lighting.rimLightPosition}
      />

      {/* Main sphere */}
      <Sphere {...props} animate={!!autoRotate} />

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
  const glRef = useRef<WebGLRenderer | null>(null);
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
          <Scene
            key={frameNonce}
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
            environment={environment}
            autoRotate={autoRotate}
            enableZoom={enableZoom}
            showGrid={showGrid}
          />
        </Canvas>
      </PreviewErrorBoundary>
      
      {/* Optional overlay for better visual integration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  );
});

export default MaterialPreview;
