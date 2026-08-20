export const ThreePreset = {
  id: 'three', label: 'Three.js 뷰어 에셋',
  description: 'Three.js 뷰어용 웹 지원 GLB 및 텍스처 패키지.',
  defaults: {
    format: 'glb', meshRes: '256', texRes: '1024', includeMesh: true,
    bakeColor: true, bakeNormal: true, exportHeightmap: true, exportWater: true,
    exportWaterMask: true,
  },
  layout: {
    root: 'terrain-viewer', paths: {
      'terrain.glb': 'terrain-viewer/assets/terrain.glb', 'terrain.obj': 'terrain-viewer/assets/terrain.obj',
      'textures/terrain_color.png': 'terrain-viewer/assets/terrain_color.png',
      'textures/terrain_normal.png': 'terrain-viewer/assets/terrain_normal.png',
      'textures/terrain_heightmap.png': 'terrain-viewer/assets/terrain_heightmap.png',
      'textures/terrain_splat.png': 'terrain-viewer/assets/terrain_splat.png',
    },
  },
};
