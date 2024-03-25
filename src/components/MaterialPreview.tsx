import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

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

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh scale={[1, 1, 1]} ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
};

const MaterialPreview: React.FC<MaterialPreviewProps> = ({ className = '', color, metalness, roughness }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative w-full h-full ${className}`}
    >
      <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Sphere color={color} metalness={metalness} roughness={roughness} />
      </Canvas>
    </motion.div>
  );
};

export default MaterialPreview;
