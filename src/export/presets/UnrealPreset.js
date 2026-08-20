export const UnrealPreset = {
  id: 'unreal', label: '언리얼 랜드스케이프',
  description: '16비트 풍경 높이맵, 가중치맵, 센티미터 월드 스케일.',
  defaults: {
    format: 'glb', meshRes: '512', texRes: '2048', includeMesh: false,
    bakeColor: true, bakeNormal: true, exportHeightmap: true, exportSplat: true,
    exportCollision: true, collisionRes: '128', exportWater: true,
    exportWaterMask: true, exportWaterMetadata: true,
  },
  layout: {
    root: '풍경', heightmapRawPath: 'Landscape/heightmap.r16',
    paths: {
      'terrain.glb': 'Landscape/terrain.glb', 'terrain.obj': 'Landscape/terrain.obj',
      'collision.glb': 'Landscape/collision.glb',
      'textures/terrain_color.png': 'Landscape/textures/terrain_color.png',
      'textures/terrain_normal.png': 'Landscape/textures/terrain_normal.png',
      'textures/terrain_splat.png': 'Landscape/weightmaps/biomes.png',
    },
  },
};
