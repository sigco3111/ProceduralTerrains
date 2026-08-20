export const BlenderPreset = {
  id: 'blender', label: '블렌더 씬',
  description: '베이크된 머티리얼 맵과 씬 노트가 포함된 GLB 지형 패키지.',
  defaults: {
    format: 'glb', meshRes: '512', texRes: '2048', includeMesh: true,
    includeSkirts: true, includeBase: true, bakeColor: true, bakeNormal: true,
    exportHeightmap: true, exportWater: true, exportCollision: false,
  },
  layout: {
    root: '블렌더', paths: {
      'terrain.glb': 'Blender/terrain.glb', 'terrain.obj': 'Blender/terrain.obj',
      'textures/terrain_color.png': 'Blender/textures/terrain_color.png',
      'textures/terrain_normal.png': 'Blender/textures/terrain_normal.png',
      'textures/terrain_heightmap.png': 'Blender/textures/terrain_heightmap.png',
      'textures/terrain_splat.png': 'Blender/textures/terrain_splat.png',
    },
  },
};
