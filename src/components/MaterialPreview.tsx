import React from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';

interface MaterialPreviewProps {
  className?: string;
  color: string;
  metalness: number;
  roughness: number;
}

const MaterialPreview: React.FC<MaterialPreviewProps> = ({ className = '', color, metalness, roughness }) => {
  // Assign default Tailwind classes along with any classes passed through props
  const combinedClassNames = `flex justify-center items-center ${className}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
    <div className={combinedClassNames}>
      <div className="w-full h-64 sm:h-96 lg:h-full"> {/* Adjust height for responsiveness */}
        <Canvas>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
          </mesh>
        </Canvas>
      </div>
    </div>
    </motion.div>
  );
};

export default MaterialPreview;
