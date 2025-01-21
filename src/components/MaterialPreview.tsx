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
}

interface SphereProps {
  color: string;
  metalness: number;
  roughness: number;
}

const Sphere: React.FC<SphereProps> = ({ color, metalness, roughness }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

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
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={1}
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
        camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
        className="bg-gradient-to-b from-gray-900/50 to-black/50"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 20]} />
        
        <Stage
          intensity={0.5}
          environment="city"
          adjustCamera={false}
        >
          <Scene
            color={color}
            metalness={metalness}
            roughness={roughness}
          />
        </Stage>
      </Canvas>
      
      {/* Optional overlay for better visual integration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  );
};

export default MaterialPreview;