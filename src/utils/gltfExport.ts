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

function applyTextureParams(tex: THREE.Texture, repeatX: number, repeatY: number) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

async function buildThreeMaterial(material: AppMaterial) {
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

  const disposableTextures: THREE.Texture[] = [];
  const repeatX = material.repeatX ?? 1;
  const repeatY = material.repeatY ?? 1;
  if (material.baseColorMap) {
    const t = await loadTexture(material.baseColorMap, THREE.SRGBColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.map = t;
    disposableTextures.push(t);
  }
  if (material.normalMap) {
    const t = await loadTexture(material.normalMap, THREE.NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.normalMap = t;
    disposableTextures.push(t);
    const s = material.normalScale ?? 1;
    mat.normalScale = new THREE.Vector2(s, s);
  }
  if (material.roughnessMap) {
    const t = await loadTexture(material.roughnessMap, THREE.NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.roughnessMap = t;
    disposableTextures.push(t);
  }
  if (material.metalnessMap) {
    const t = await loadTexture(material.metalnessMap, THREE.NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.metalnessMap = t;
    disposableTextures.push(t);
  }
  if (material.aoMap) {
    const t = await loadTexture(material.aoMap, THREE.NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.aoMap = t;
    mat.aoMapIntensity = material.aoIntensity ?? 1;
    disposableTextures.push(t);
  }
  if (material.emissiveMap) {
    const t = await loadTexture(material.emissiveMap, THREE.SRGBColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.emissiveMap = t;
    disposableTextures.push(t);
  }
  if (material.alphaMap) {
    const t = await loadTexture(material.alphaMap, THREE.NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.alphaMap = t;
    mat.alphaTest = material.alphaTest ?? 0;
    mat.transparent = true;
    disposableTextures.push(t);
  }
  mat.needsUpdate = true;
  return { mat, disposableTextures };
}

async function exportSceneAsGlb(scene: THREE.Object3D) {
  const mod = await import('three/examples/jsm/exporters/GLTFExporter');
  const GLTFExporter = (mod as any).GLTFExporter as new () => any;
  const exporter = new GLTFExporter();
  return await new Promise<ArrayBuffer>((resolve, reject) => {
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
}

export async function exportMaterialAsGlb(material: AppMaterial): Promise<{ filename: string; blob: Blob }> {
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  geometry.setAttribute('uv2', geometry.attributes.uv);
  let mat: THREE.MeshPhysicalMaterial | null = null;
  let disposableTextures: THREE.Texture[] = [];
  try {
    const built = await buildThreeMaterial(material);
    mat = built.mat;
    disposableTextures = built.disposableTextures;

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = material.name;
    mesh.userData = { materialId: material.id, exportedAt: Date.now() };

    const scene = new THREE.Scene();
    scene.add(mesh);

    const glb = await exportSceneAsGlb(scene);

    const filename = `${sanitizeFilename(material.name)}.glb`;
    return { filename, blob: new Blob([glb], { type: 'model/gltf-binary' }) };
  } finally {
    geometry.dispose();
    if (mat) mat.dispose();
    disposableTextures.forEach((t) => t.dispose());
  }
}

export async function exportLibraryAsGlb(
  materials: AppMaterial[]
): Promise<{ filename: string; blob: Blob } | null> {
  if (!materials.length) return null;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  geometry.setAttribute('uv2', geometry.attributes.uv);
  const scene = new THREE.Scene();
  const disposable: Array<{ mat: THREE.Material; textures: THREE.Texture[] }> = [];

  try {
    const n = materials.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const spacing = 2.75;
    const x0 = -((cols - 1) * spacing) / 2;
    const z0 = -((rows - 1) * spacing) / 2;

    for (let i = 0; i < n; i++) {
      const m = materials[i];
      const built = await buildThreeMaterial(m);
      const mesh = new THREE.Mesh(geometry, built.mat);
      mesh.name = m.name;
      mesh.userData = { materialId: m.id };

      const col = i % cols;
      const row = Math.floor(i / cols);
      mesh.position.set(x0 + col * spacing, 0, z0 + row * spacing);
      scene.add(mesh);

      disposable.push({ mat: built.mat, textures: built.disposableTextures });
    }

    const glb = await exportSceneAsGlb(scene);
    const filename = `materials-library.glb`;
    return { filename, blob: new Blob([glb], { type: 'model/gltf-binary' }) };
  } finally {
    geometry.dispose();
    disposable.forEach(({ mat, textures }) => {
      mat.dispose();
      textures.forEach((t) => t.dispose());
    });
  }
}


