import * as THREE from 'three';
import type { Material as AppMaterial } from '../types/material';

function sanitizeFilename(name: string) {
  return (name || 'material')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 64);
}

function loadTexture(url: string, colorSpace: THREE.ColorSpace) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = colorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

export async function exportMaterialAsGlb(material: AppMaterial): Promise<{ filename: string; blob: Blob }> {
  // Lazy-load exporter so it only affects users who click export.
  const mod = await import('three/examples/jsm/exporters/GLTFExporter');
  const GLTFExporter = (mod as any).GLTFExporter as new () => any;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    name: material.name,
    color: new THREE.Color(material.color),
    metalness: material.metalness,
    roughness: material.roughness,
    emissive: new THREE.Color(material.emissive ?? '#000000'),
    emissiveIntensity: material.emissiveIntensity ?? 0,
    clearcoat: material.clearcoat ?? 0,
    clearcoatRoughness: material.clearcoatRoughness ?? 0.03,
    transmission: material.transmission ?? 0,
    ior: material.ior ?? 1.5,
    opacity: material.opacity ?? 1,
    transparent: (material.opacity ?? 1) < 1 || (material.transmission ?? 0) > 0,
    thickness: (material.transmission ?? 0) > 0 ? 1 : 0,
  });

  // Optional textures (stored as data URLs in this app).
  const disposableTextures: THREE.Texture[] = [];
  try {
    if (material.baseColorMap) {
      const t = await loadTexture(material.baseColorMap, THREE.SRGBColorSpace);
      mat.map = t;
      disposableTextures.push(t);
    }
    if (material.normalMap) {
      const t = await loadTexture(material.normalMap, THREE.NoColorSpace);
      mat.normalMap = t;
      disposableTextures.push(t);
      const s = material.normalScale ?? 1;
      mat.normalScale = new THREE.Vector2(s, s);
    }
    mat.needsUpdate = true;

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = material.name;
    mesh.userData = { materialId: material.id, exportedAt: Date.now() };

    const scene = new THREE.Scene();
    scene.add(mesh);

    const exporter = new GLTFExporter();
    const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        scene,
        (result: any) => {
          if (result instanceof ArrayBuffer) resolve(result);
          else reject(new Error('Expected GLB ArrayBuffer result'));
        },
        (err: any) => reject(err),
        { binary: true }
      );
    });

    const filename = `${sanitizeFilename(material.name)}.glb`;
    return { filename, blob: new Blob([glb], { type: 'model/gltf-binary' }) };
  } finally {
    geometry.dispose();
    mat.dispose();
    disposableTextures.forEach((t) => t.dispose());
  }
}


