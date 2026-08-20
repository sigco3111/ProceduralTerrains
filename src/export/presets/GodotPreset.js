export const GodotPreset = {
  id: 'godot', label: 'Godot Terrain3D',
  description: '가져오기 가능한 높이맵, 텍스처 레이어, 항법/물 마스크.',
  defaults: {
    format: 'glb', meshRes: '512', texRes: '2048', includeMesh: true,
    bakeColor: true, bakeNormal: true, exportHeightmap: true, exportSplat: true,
    exportWater: true, exportWaterMask: true, exportWaterMetadata: true,
  },
  layout: {
    root: 'Terrain3D', heightmapRawPath: 'Terrain3D/heightmap.r16',
    paths: {
      'terrain.glb': 'Terrain3D/terrain.glb', 'terrain.obj': 'Terrain3D/terrain.obj',
      'collision.glb': 'Terrain3D/collision.glb',
      'textures/terrain_color.png': 'Terrain3D/textures/albedo.png',
      'textures/terrain_normal.png': 'Terrain3D/textures/normal.png',
      'textures/terrain_splat.png': 'Terrain3D/textures/biomes.png',
    },
  },
};
