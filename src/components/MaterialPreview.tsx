// src/components/MaterialPreview.tsx

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';

interface MaterialPreviewProps {
  color: string;
  metalness: number;
  roughness: number;
}

const MaterialPreview: React.FC<MaterialPreviewProps> = ({ color, metalness, roughness }) => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </Canvas>
  );
};

export default MaterialPreview;
