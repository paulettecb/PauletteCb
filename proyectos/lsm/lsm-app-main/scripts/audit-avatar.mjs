#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.on('uncaughtException', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const defaultAvatarPath = resolve(appRoot, 'src/assets/avatar.glb');
const avatarAnimationsPath = resolve(appRoot, 'src/app/utils/avatar-animations.service.ts');
const defaultBonesPath = resolve(appRoot, 'src/app/utils/default-bones.ts');
const avatarPath = resolve(process.argv[2] ?? defaultAvatarPath);

function readGlbJson(filePath) {
  const buffer = readFileSync(filePath);
  const prefix = buffer.toString('utf8', 0, Math.min(buffer.length, 128));
  if (prefix.startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error(
      `${filePath} es un puntero de Git LFS, no el binario GLB real. ` +
      `Materializa el asset con git lfs pull --include=\"${filePath}\" y vuelve a ejecutar la auditoría.`
    );
  }

  if (buffer.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error(`${filePath} no es un GLB válido: falta el magic glTF.`);
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`${filePath} usa GLB versión ${version}; este script espera GLB 2.0.`);
  }

  const totalLength = buffer.readUInt32LE(8);
  if (totalLength !== buffer.length) {
    throw new Error(`${filePath} declara ${totalLength} bytes, pero el archivo tiene ${buffer.length}.`);
  }

  let offset = 12;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString('utf8', offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === 'JSON') {
      return JSON.parse(buffer.toString('utf8', chunkStart, chunkEnd).trim());
    }

    offset = chunkEnd;
  }

  throw new Error(`${filePath} no contiene chunk JSON.`);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function extractQuotedBoneNames(source) {
  return uniqueSorted([...source.matchAll(/['"](mixamorig[^'"]+)['"]/g)].map((match) => match[1]));
}

function extractDefaultBoneNames(source) {
  return uniqueSorted([...source.matchAll(/['"](mixamorig[^'"]+)['"]\s*:/g)].map((match) => match[1]));
}

function namesFromIndices(items = [], indices = []) {
  return uniqueSorted(indices.map((index) => items[index]?.name ?? `sin_nombre_${index}`));
}

function findBones(gltf) {
  const jointIndices = new Set((gltf.skins ?? []).flatMap((skin) => skin.joints ?? []));
  const childIndices = new Set((gltf.nodes ?? []).flatMap((node) => node.children ?? []));

  for (const [index, node] of (gltf.nodes ?? []).entries()) {
    if (jointIndices.has(index) || (node.name?.startsWith('mixamorig') && childIndices.has(index))) {
      jointIndices.add(index);
    }
  }

  return namesFromIndices(gltf.nodes, [...jointIndices]);
}

function materialSummary(gltf) {
  return (gltf.materials ?? []).map((material, index) => {
    const pbr = material.pbrMetallicRoughness ?? {};
    return {
      index,
      name: material.name ?? `Material_${index}`,
      baseColorFactor: pbr.baseColorFactor,
      metallicFactor: pbr.metallicFactor,
      roughnessFactor: pbr.roughnessFactor,
      doubleSided: Boolean(material.doubleSided),
      alphaMode: material.alphaMode ?? 'OPAQUE',
    };
  });
}

function formatList(values, empty = 'Ninguno') {
  return values.length ? values.map((value) => `  - ${value}`).join('\n') : `  - ${empty}`;
}

function formatMaterials(materials) {
  return materials.length
    ? materials.map((material) => {
        const details = [
          `alpha=${material.alphaMode}`,
          `doubleSided=${material.doubleSided}`,
          material.baseColorFactor ? `baseColor=[${material.baseColorFactor.join(', ')}]` : null,
          material.metallicFactor !== undefined ? `metallic=${material.metallicFactor}` : null,
          material.roughnessFactor !== undefined ? `roughness=${material.roughnessFactor}` : null,
        ].filter(Boolean).join('; ');
        return `  - [${material.index}] ${material.name} (${details})`;
      }).join('\n')
    : '  - Ninguno';
}

const gltf = readGlbJson(avatarPath);
const boneNames = findBones(gltf);
const leftHandBones = boneNames.filter((name) => /Left(Hand|Finger|Thumb|Index|Middle|Ring|Pinky)/i.test(name));
const rightHandBones = boneNames.filter((name) => /Right(Hand|Finger|Thumb|Index|Middle|Ring|Pinky)/i.test(name));
const headNeckTorsoBones = boneNames.filter((name) => /(Head|Neck|Spine|Hips|Shoulder|Chest|Torso)/i.test(name));

const usedInAvatarAnimations = extractQuotedBoneNames(readFileSync(avatarAnimationsPath, 'utf8'));
const usedInDefaultBones = extractDefaultBoneNames(readFileSync(defaultBonesPath, 'utf8'));
const usedBones = uniqueSorted([...usedInAvatarAnimations, ...usedInDefaultBones]);
const coveredBones = usedBones.filter((name) => boneNames.includes(name));
const missingBones = usedBones.filter((name) => !boneNames.includes(name));
const availableUnusedBones = boneNames.filter((name) => !usedBones.includes(name));
const complexSignCandidates = availableUnusedBones.filter((name) => /(Hand|Thumb|Index|Middle|Ring|Pinky|ForeArm|Arm|Shoulder|Head|Neck|Spine)/i.test(name));
const animationClips = (gltf.animations ?? []).map((animation, index) => animation.name ?? `Animation_${index}`);

console.log(`# Auditoría de avatar GLB\n`);
console.log(`Archivo: ${avatarPath}\n`);
console.log(`## Conteos`);
console.log(`- Escenas: ${gltf.scenes?.length ?? 0}`);
console.log(`- Nodos: ${gltf.nodes?.length ?? 0}`);
console.log(`- Meshes: ${gltf.meshes?.length ?? 0}`);
console.log(`- Skins: ${gltf.skins?.length ?? 0}`);
console.log(`- Animaciones: ${gltf.animations?.length ?? 0}\n`);
console.log(`## Huesos (${boneNames.length})\n${formatList(boneNames)}\n`);
console.log(`## Huesos de mano izquierda (${leftHandBones.length})\n${formatList(leftHandBones)}\n`);
console.log(`## Huesos de mano derecha (${rightHandBones.length})\n${formatList(rightHandBones)}\n`);
console.log(`## Huesos de cabeza/cuello/torso (${headNeckTorsoBones.length})\n${formatList(headNeckTorsoBones)}\n`);
console.log(`## Clips de animación embebidos (${animationClips.length})\n${formatList(animationClips, 'No hay clips embebidos')}\n`);
console.log(`## Materiales (${gltf.materials?.length ?? 0})\n${formatMaterials(materialSummary(gltf))}\n`);
console.log(`## Comparación contra código`);
console.log(`- Huesos usados en avatar-animations.service.ts: ${usedInAvatarAnimations.length}`);
console.log(formatList(usedInAvatarAnimations));
console.log(`- Huesos definidos en default-bones.ts: ${usedInDefaultBones.length}`);
console.log(formatList(usedInDefaultBones));
console.log(`\n### Cubiertos (${coveredBones.length})\n${formatList(coveredBones)}\n`);
console.log(`### Faltantes (${missingBones.length})\n${formatList(missingBones, 'No hay faltantes: todos los nombres usados existen en el GLB')}\n`);
console.log(`### Disponibles sin usar / candidatos para señas más complejas (${complexSignCandidates.length})\n${formatList(complexSignCandidates, 'No hay candidatos adicionales detectados')}\n`);
