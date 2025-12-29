import React, { useImperativeHandle, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  environment?: 'warehouse' | 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'park' | 'lobby';
  model?: 'sphere' | 'box' | 'torusKnot' | 'icosahedron';
  autoRotate?: boolean;
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
  model?: MaterialPreviewProps['model'];
}

const PreviewMesh: React.FC<{ model: MaterialPreviewProps['model'] }> = ({ model }) => {
  switch (model) {
    case 'box':
      return <boxGeometry args={[1.6, 1.6, 1.6]} />;
    case 'torusKnot':
      return <torusKnotGeometry args={[0.85, 0.28, 220, 24]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[1.1, 2]} />;
    case 'sphere':
    default:
      return <sphereGeometry args={[1, 64, 64]} />;
  }
};

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
  model = 'sphere',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const [nMap, setNMap] = useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    let disposed = false;

    if (!baseColorMap) {
      setMap((old) => {
        if (old) old.dispose();
        return null;
      });
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(baseColorMap, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      setMap((old) => {
        if (old) old.dispose();
        return tex;
      });
    });

    return () => {
      disposed = true;
    };
  }, [baseColorMap]);

  React.useEffect(() => {
    let disposed = false;

    if (!normalMap) {
      setNMap((old) => {
        if (old) old.dispose();
        return null;
      });
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(normalMap, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.NoColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      setNMap((old) => {
        if (old) old.dispose();
        return tex;
      });
    });

    return () => {
      disposed = true;
    };
  }, [normalMap]);

  useFrame((state) => {
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
      <PreviewMesh model={model} />
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
        transparent={opacity < 1 || transmission > 0}
        envMapIntensity={1.75}
        map={map ?? undefined}
        normalMap={nMap ?? undefined}
        normalScale={new THREE.Vector2(normalScale, normalScale)}
      />
    </mesh>
  );
};

const Scene: React.FC<SphereProps & { autoRotate?: boolean }> = ({ autoRotate, ...props }) => {
  const { camera } = useThree();
  
  // Set initial camera position
  React.useEffect(() => {
    camera.position.set(2.5, 1.5, 2.5);
  }, [camera]);

  return (
    <>
      {/* Main sphere */}
      <Sphere {...props} />
      
      {/* Contact shadows for better grounding */}
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
      />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
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
};

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
    environment = 'warehouse',
    model = 'sphere',
    autoRotate = true,
  } = props;
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      snapshotPng: () =>
        new Promise((resolve) => {
          const canvas = glRef.current?.domElement;
          if (!canvas) return resolve(null);
          canvas.toBlob((b) => resolve(b), 'image/png');
        }),
    }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative w-full h-full ${className} rounded-xl overflow-hidden`}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          glRef.current = gl;
        }}
        camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
        className="bg-gradient-to-b from-gray-900/50 to-black/50"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 20]} />
        
        <Stage
          intensity={1}
          environment={environment}
          adjustCamera={false}
        >
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
            model={model}
            autoRotate={autoRotate}
          />
        </Stage>
      </Canvas>
      
      {/* Optional overlay for better visual integration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  );
});

export default MaterialPreview;