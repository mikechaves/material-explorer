import {
  type ColorSpace,
  type Material as ThreeMaterial,
  type Object3D,
  type Texture,
  Color,
  Mesh,
  MeshPhysicalMaterial,
  NoColorSpace,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from 'three';
import type { Material as AppMaterial } from '../types/material';

function sanitizeFilename(name: string) {
  return (name || 'material')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 64);
}

function loadTexture(url: string, colorSpace: ColorSpace) {
  return new Promise<Texture>((resolve, reject) => {
    const loader = new TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = colorSpace;
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        resolve(tex);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function applyTextureParams(tex: Texture, repeatX: number, repeatY: number) {
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

async function buildThreeMaterial(material: AppMaterial) {
  const mat = new MeshPhysicalMaterial({
    name: material.name,
    color: new Color(material.color),
    metalness: material.metalness,
    roughness: material.roughness,
    emissive: new Color(material.emissive ?? '#000000'),
    emissiveIntensity: material.emissiveIntensity ?? 0,
    clearcoat: material.clearcoat ?? 0,
    clearcoatRoughness: material.clearcoatRoughness ?? 0.03,
    transmission: material.transmission ?? 0,
    ior: material.ior ?? 1.5,
    opacity: material.opacity ?? 1,
    transparent: (material.opacity ?? 1) < 1 || (material.transmission ?? 0) > 0,
    thickness: (material.transmission ?? 0) > 0 ? 1 : 0,
  });

  const disposableTextures: Texture[] = [];
  const repeatX = material.repeatX ?? 1;
  const repeatY = material.repeatY ?? 1;
  if (material.baseColorMap) {
    const t = await loadTexture(material.baseColorMap, SRGBColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.map = t;
    disposableTextures.push(t);
  }
  if (material.normalMap) {
    const t = await loadTexture(material.normalMap, NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.normalMap = t;
    disposableTextures.push(t);
    const s = material.normalScale ?? 1;
    mat.normalScale = new Vector2(s, s);
  }
  if (material.roughnessMap) {
    const t = await loadTexture(material.roughnessMap, NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.roughnessMap = t;
    disposableTextures.push(t);
  }
  if (material.metalnessMap) {
    const t = await loadTexture(material.metalnessMap, NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.metalnessMap = t;
    disposableTextures.push(t);
  }
  if (material.aoMap) {
    const t = await loadTexture(material.aoMap, NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.aoMap = t;
    mat.aoMapIntensity = material.aoIntensity ?? 1;
    disposableTextures.push(t);
  }
  if (material.emissiveMap) {
    const t = await loadTexture(material.emissiveMap, SRGBColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.emissiveMap = t;
    disposableTextures.push(t);
  }
  if (material.alphaMap) {
    const t = await loadTexture(material.alphaMap, NoColorSpace);
    applyTextureParams(t, repeatX, repeatY);
    mat.alphaMap = t;
    mat.alphaTest = material.alphaTest ?? 0;
    mat.transparent = true;
    disposableTextures.push(t);
  }
  mat.needsUpdate = true;
  return { mat, disposableTextures };
}

async function exportSceneAsGlb(scene: Object3D) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, { binary: true });
  if (!(result instanceof ArrayBuffer)) {
    throw new Error('Expected GLB ArrayBuffer result');
  }
  return result;
}

export async function exportMaterialAsGlb(material: AppMaterial): Promise<{ filename: string; blob: Blob }> {
  const geometry = new SphereGeometry(1, 64, 64);
  geometry.setAttribute('uv2', geometry.attributes.uv);
  let mat: MeshPhysicalMaterial | null = null;
  let disposableTextures: Texture[] = [];
  try {
    const built = await buildThreeMaterial(material);
    mat = built.mat;
    disposableTextures = built.disposableTextures;

    const mesh = new Mesh(geometry, mat);
    mesh.name = material.name;
    mesh.userData = { materialId: material.id, exportedAt: Date.now() };

    const scene = new Scene();
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
  materials: AppMaterial[],
  opts?: { filename?: string }
): Promise<{ filename: string; blob: Blob } | null> {
  if (!materials.length) return null;

  const geometry = new SphereGeometry(1, 64, 64);
  geometry.setAttribute('uv2', geometry.attributes.uv);
  const scene = new Scene();
  const disposable: Array<{ mat: ThreeMaterial; textures: Texture[] }> = [];

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
      const mesh = new Mesh(geometry, built.mat);
      mesh.name = m.name;
      mesh.userData = { materialId: m.id };

      const col = i % cols;
      const row = Math.floor(i / cols);
      mesh.position.set(x0 + col * spacing, 0, z0 + row * spacing);
      scene.add(mesh);

      disposable.push({ mat: built.mat, textures: built.disposableTextures });
    }

    const glb = await exportSceneAsGlb(scene);
    const filename = opts?.filename ?? `materials-library.glb`;
    return { filename, blob: new Blob([glb], { type: 'model/gltf-binary' }) };
  } finally {
    geometry.dispose();
    disposable.forEach(({ mat, textures }) => {
      mat.dispose();
      textures.forEach((t) => t.dispose());
    });
  }
}
