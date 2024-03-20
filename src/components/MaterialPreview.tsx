import React from 'react';
import { Canvas } from '@react-three/fiber';

interface MaterialPreviewProps {
  className?: string; // Make className optional
  color: string;
  metalness: number;
  roughness: number;
}

const MaterialPreview: React.FC<MaterialPreviewProps> = ({ className, color, metalness, roughness }) => {
  return (
    <div className={className}> {/* Apply the className here */}
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            metalness={metalness} 
            roughness={roughness} 
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default MaterialPreview;
