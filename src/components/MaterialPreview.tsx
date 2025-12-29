import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Environment, OrbitControls, Stage, ContactShadows } from '@react-three/drei';

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
      <sphereGeometry args={[1, 64, 64]} />
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

const Scene: React.FC<SphereProps> = (props) => {
  const { camera } = useThree();
  
  // Set initial camera position
  React.useEffect(() => {
    camera.position.set(2.5, 1.5, 2.5);
  }, [camera]);

  return (
    <>
      {/* Improved lighting setup */}
      <Environment preset="studio" background={false} />
      
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
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

const MaterialPreview: React.FC<MaterialPreviewProps> = ({
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
}) => {
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
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          // three.js r152+ uses `useLegacyLights` (physical lighting is the default).
          gl.useLegacyLights = false;
        }}
        camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
        className="bg-gradient-to-b from-gray-900/50 to-black/50"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 20]} />
        
        <Stage
          intensity={1}
          environment="warehouse"
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
          />
        </Stage>
      </Canvas>
      
      {/* Optional overlay for better visual integration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  );
};

export default MaterialPreview;