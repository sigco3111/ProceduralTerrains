const SETTINGS_INDEX = [
  // Terrain — presets (shape preset also carries the cartoon palette/noise)
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.preset', label: 'Terrain Preset', keywords: 'preset style layout highlands alpine desert dunes canyon volcanic rolling archipelago cartoon', aliases: 'cartoon toon preset' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noisePreset', label: '노이즈 프리셋', keywords: 'noise preset style cartoon simple flat low relief default', aliases: 'cartoon toon' },

  // Terrain — erosion (Tile mode only)
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionEnabled', label: '침식 활성화', keywords: 'erosion hydraulic thermal weathering bake apply rivers valleys carve' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionPreset', label: 'Erosion Preset', keywords: 'erosion preset natural mountain canyon rain thermal lite dry' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionQuality', label: '침식 품질', keywords: 'erosion quality resolution grid bake preview balanced high ultra' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionStrength', label: '침식 세기', keywords: 'erosion strength blend amount master mix' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionDroplets', label: '물방울', keywords: 'erosion droplets rain hydraulic valleys ravines channels' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionLifetime', label: '물방울 수명', keywords: 'erosion droplet lifetime steps travel' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionSeed', label: 'Erosion Seed', keywords: 'erosion seed random droplet spawn deterministic' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionRadius', label: '침식 반경', keywords: 'erosion radius brush channels smoothing advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionErosionRate', label: '침식 비율', keywords: 'erosion rate carve aggressive water advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionDeposition', label: '퇴적', keywords: 'erosion deposition sediment settle advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionSedimentCapacity', label: '퇴적물 용량', keywords: 'erosion sediment capacity carry advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionEvaporation', label: 'Evaporation', keywords: 'erosion evaporation water drainage advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionGravity', label: '중력', keywords: 'erosion gravity downhill droplet advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionInertia', label: '관성', keywords: 'erosion inertia direction slope advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionThermalStrength', label: '열 침식 세기', keywords: 'erosion thermal strength talus slide slope advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionThermalIterations', label: '열 침식 반복', keywords: 'erosion thermal iterations relaxation talus advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionTalus', label: '테일러스 각도', keywords: 'erosion talus angle slope slide steepness advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: 'Erosion · Advanced', settingId: 'erosion.erosionSmoothing', label: '스무딩', keywords: 'erosion smoothing low pass soften noise advanced' },

  // Terrain
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.heightScale', label: '높이 스케일', keywords: 'height elevation mountain terrain amplitude', aliases: 'height map height noise' },
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.seaLevel', label: '해수면', keywords: 'water ocean coast shoreline sea' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noiseScale', label: '노이즈 스케일', keywords: 'height noise detail fractal terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noiseStrength', label: '노이즈 세기', keywords: 'height noise amplitude terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.terrainSmoothing', label: 'Peak Smoothing', keywords: 'height noise smooth smoothing rounded round hills peaks pointy spike spiky realistic terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.octaves', label: '옥타브', keywords: 'height noise detail fbm terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.persistence', label: '지속성', keywords: 'height noise roughness fbm' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.lacunarity', label: '틈새도', keywords: 'height noise frequency fbm' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.ridge', label: 'Ridge Intensity', keywords: 'height noise ridge mountain alpine' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.warp', label: '도메인 뒤틀림', keywords: 'height noise warp fold distortion' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.falloff', label: 'Edge Falloff Width', keywords: 'height coast island edge falloff' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldCustom', label: 'Real-World Custom Area', keywords: 'real world earth elevation heightmap terrarium custom area latitude longitude coordinates zoom picker import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldLat', label: 'Real-World Latitude', keywords: 'real world earth latitude coordinates custom area import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldLon', label: 'Real-World Longitude', keywords: 'real world earth longitude coordinates custom area import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.heightMap', label: '하이맵', keywords: 'height import replace blend map' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.noiseMap', label: '노이즈 맵', keywords: 'noise import replace blend map' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.biomeMap', label: 'Biome Map', keywords: 'biome import replace blend map' },

  // Noise Layers
  { panelId: 'noiseLayers', settingId: 'noise.stackPreset', label: 'Stack Preset', keywords: 'noise stack preset realistic alpine ranges massif granite spires foothills rolling mountains eroded classic hills sharp canyon dunes craters cellular islands valleys' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.stackNormalize', label: 'Normalize Output', keywords: 'noise stack output normalize normalization remap range soft clamp peaks ceiling height' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.outputMin', label: 'Output Min', keywords: 'noise stack output minimum min remap range normalize height floor low' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.outputMax', label: '최대 출력', keywords: 'noise stack output maximum max remap range normalize height peaks soft clamp ceiling' },
  { panelId: 'noiseLayers', sectionLabel: 'Layer Parameters', settingId: 'noise.layer.erosion', label: 'Layer Erosion', keywords: 'noise layer erosion derivative dampening eroded fractal valleys drainage realistic fbm ridged billow mountains' },
  { panelId: 'noiseLayers', sectionLabel: 'Layer Parameters', settingId: 'noise.layer.selfWarp', label: '자체 뒤틀림', keywords: 'noise layer self warp anti pattern breakup spaghetti ridges massif mountains fbm ridged billow realistic' },
  { panelId: 'noiseLayers', sectionLabel: 'Layer Parameters', settingId: 'noise.layer.domainWarpOctaves', label: 'Domain Warp Octaves', keywords: 'noise layer domain warp octaves pattern repetition distortion' },
  { panelId: 'noiseLayers', sectionLabel: 'Masks', settingId: 'noise.mask.slopeMin', label: 'Slope Mask Min', keywords: 'noise layer mask slope cliff steep scree rock minimum min' },
  { panelId: 'noiseLayers', sectionLabel: 'Masks', settingId: 'noise.mask.slopeMax', label: 'Slope Mask Max', keywords: 'noise layer mask slope cliff steep scree rock maximum max' },
  { panelId: 'noiseLayers', sectionLabel: 'Masks', settingId: 'noise.mask.slopeFalloff', label: 'Slope Mask Falloff', keywords: 'noise layer mask slope softness falloff feather cliffs scree' },

  // Biomes
  { panelId: 'biomes', settingId: 'biomes.biomeScale', label: 'Biome Density', keywords: 'biome density distribution climate map' },
  { panelId: 'biomes', settingId: 'biomes.tempBias', label: '온도', keywords: 'biome climate heat cold' },
  { panelId: 'biomes', settingId: 'biomes.moistScale', label: 'Moisture Scale', keywords: 'biome climate humidity wet dry' },
  { panelId: 'biomes', settingId: 'biomes.moistBias', label: 'Moisture Bias', keywords: 'biome climate humidity wet dry' },
  { panelId: 'biomes', settingId: 'biomes.snowLine', label: 'Snow Line', keywords: 'biome climate snow altitude' },
  { panelId: 'biomes', settingId: 'biomes.snowSlopeMin', label: 'Snow Slope Hold', keywords: 'biome snow slope flat hold realistic alpine steep coverage' },
  { panelId: 'biomes', settingId: 'biomes.snowSlopeMax', label: 'Snow Slope Shed', keywords: 'biome snow slope shed steep cliff realistic alpine plausible' },
  { panelId: 'biomes', settingId: 'biomes.rockSlopeLo', label: 'Rock Slope Start', keywords: 'biome rock slope cliff exposure start realistic steep terrain' },
  { panelId: 'biomes', settingId: 'biomes.rockSlopeHi', label: 'Rock Slope Full', keywords: 'biome rock slope cliff exposure full realistic steep terrain' },
  { panelId: 'biomes', settingId: 'biomes.biomeDebug', label: 'Biome Debug', keywords: 'biome debug overlay inspection' },

  // World
  { panelId: 'world', settingId: 'world.chunkCount', label: '청크 수', keywords: 'world grid streaming tiles' },
  { panelId: 'world', settingId: 'world.chunkSize', label: '청크 크기', keywords: 'world grid streaming tiles' },
  { panelId: 'world', settingId: 'world.chunkGrid', label: 'Chunk Grid', keywords: 'world grid debug overlay' },
  { panelId: 'world', settingId: 'world.tileAssemblyShape', label: 'Tile Shape', keywords: 'tiles square circle assembly disk' },
  { panelId: 'world', settingId: 'world.planetRadius', label: '행성 반지름', keywords: 'planet sphere radius curvature' },
  { panelId: 'world', settingId: 'world.planetFaceGrid', label: '표면 디테일', keywords: 'planet face grid chunk detail' },

  // Water
  { panelId: 'water', settingId: 'water.waterEnabled', label: '물 활성화', keywords: 'water ocean enable disable' },
  { panelId: 'water', settingId: 'water.seaLevel', label: '해수면', keywords: 'water ocean sea level height coast' },
  { panelId: 'water', settingId: 'water.waterMode', label: '물 모드', keywords: 'water legacy realistic volumetric cinematic quality cartoon tropical ocean lake', aliases: 'cartoon toon' },
  { panelId: 'water', settingId: 'water.waterAnim', label: '물 애니메이션', keywords: 'water waves ocean motion' },
  { panelId: 'water', sectionLabel: '해안선', settingId: 'water.waterFoamWidth', label: 'Shore Distance', keywords: 'water shore shoreline coast distance width foam band' },
  { panelId: 'water', settingId: 'water.waterDebugView', label: 'Water Debug View', keywords: 'water debug depth foam shoreline mask' },

  // Planet style / colors
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.palettePreset', label: '색상 팔레트 프리셋', keywords: 'palette preset colors theme earth desert ice toxic neon volcanic cartoon pastel moon rust monolith gray grey', aliases: 'cartoon toon colors palette' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.deep', label: 'Deep Water', keywords: 'water color ocean deep' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.shallow', label: 'Shallow', keywords: 'water color shore coast shallow' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.foam', label: '거품', keywords: 'water color waves foam shoreline' },
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.paletteSaturation', label: '채도', keywords: 'palette color tuning contrast' },
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.paletteContrast', label: '대비', keywords: 'palette color tuning contrast' },

  // Performance (standalone panel — GPU/renderer, global preset, LOD, streaming, water, fog, clouds)
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.preset', label: '프리셋', keywords: 'quality profile performance' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.rendererBackend', label: '렌더러 백엔드', keywords: 'gpu renderer backend webgl webgpu auto graphics' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.gpuPreference', label: 'GPU 선호', keywords: 'gpu power preference high performance low power dedicated battery' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.useWorker', label: '워커 렌더러', keywords: 'offscreen canvas worker renderer experimental main thread' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.autoPerf', label: '자동 성능 모드', keywords: 'automatic fps performance' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.onDemandStudio', label: '유휴 시 일시 정지', keywords: 'idle redraw battery performance' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.renderScale', label: '렌더 스케일', keywords: 'resolution pixel dpr scale' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.resolutionDenoiseMode', label: '해상도 재구성', keywords: 'denoise clean pixelated nearest upscale ps1' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.resolutionScale', label: 'Terrain Resolution', keywords: 'lod mesh detail' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.lodDistanceScale', label: 'LOD 거리 스케일', keywords: 'lod distance scale' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMerge', label: '청크 병합', keywords: 'merge chunk quadtree fold draw call batch far distant combine tile performance' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMergeDistance', label: '병합 거리', keywords: 'merge fold distance quadtree aggressiveness block threshold near far' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMergeQuads', label: '병합 밀도', keywords: 'merge density resolution quads far mesh quality lossless' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMacroProxy', label: 'Full Board Merge', keywords: 'macro proxy single mesh whole tile board zoom out extreme distance far root fold' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.viewRadius', label: '청크 로드 반경', keywords: 'streaming load radius chunks' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.maxCreatesPerFrame', label: '청크 빌드 / 프레임', keywords: 'streaming tile new cells chunk create spawn budget instant disable throttle' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.triangleBudget', label: '삼각형 예산', keywords: 'triangles limit budget mesh streaming' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.cullingAggressiveness', label: '컬링 공격성', keywords: 'frustum behind camera cull streaming' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterQuality', label: 'Water Quality', keywords: 'water quality reflection detail' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterReflection', label: '물 반사', keywords: 'water specular reflection' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterDetail', label: '물 디테일', keywords: 'water ripple detail' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterWaves', label: 'Wave Strength', keywords: 'water waves motion complexity' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.underwaterEffect', label: '수중 효과', keywords: 'water underwater fog tint' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterDistance', label: '물 거리', keywords: 'water range fade' },
  { panelId: 'performance', tabId: 'fog', settingId: 'performance.fogDistance', label: '안개 거리', keywords: 'fog atmosphere visibility' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudSteps', label: '레이마칭 단계', keywords: 'cloud steps quality performance' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudLightSteps', label: '그림자 단계', keywords: 'cloud shadow steps performance' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudOctaves', label: '기본 노이즈 옥타브', keywords: 'cloud noise octaves' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudDetailOctaves', label: '디테일 노이즈 옥타브', keywords: 'cloud noise detail octaves' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudMaxDistance', label: '최대 거리', keywords: 'cloud distance visibility culling' },

  // Terrain > Surface > Properties (terrain material / texture render controls)
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailQuality', label: 'Terrain Detail Quality', keywords: 'terrain material texture detail walk first person close properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailOpacity', label: 'Detail Opacity', keywords: 'terrain detail opacity master mix amount overall fade blend properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailScale', label: '디테일 텍스처 스케일', keywords: 'terrain noise texture scale grain world space properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailStrength', label: '디테일 세기', keywords: 'terrain albedo biome close detail properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailNormal', label: 'Detail Normal Strength', keywords: 'terrain normal lighting bump close material properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainMicroDetail', label: '미세 디테일', keywords: 'terrain micro grain speckle crisp close up high frequency properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainMacroVariation', label: '매크로 변화', keywords: 'terrain macro variation weathering patches biome breakup large scale properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailFar', label: '거리 디테일 페이드', keywords: 'terrain detail fade near far distance properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainRockSlope', label: '바위 경사 혼합', keywords: 'terrain slope rock cliff blend triplanar properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainTriplanar', label: 'Triplanar Detail', keywords: 'terrain cliff projection stretching triplanar properties' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainShoreRange', label: '해안선 디테일', keywords: 'terrain shore wet sand mud coastline water edge properties' },

  // Sky / lighting
  { panelId: 'skybox', settingId: 'skybox.timeOfDay', label: '시간대', keywords: 'sun sky day night time' },
  { panelId: 'skybox', settingId: 'skybox.skyboxBrightness', label: '하늘 밝기', keywords: 'sky atmosphere brightness' },
  { panelId: 'skybox', settingId: 'skybox.skyboxHaze', label: '지평선 연무', keywords: 'sky atmosphere haze' },
  { panelId: 'skybox', settingId: 'skybox.skyboxStars', label: '밤 별', keywords: 'sky stars night' },
  { panelId: 'skybox', settingId: 'skybox.skyboxDayNightCycle', label: 'Day/Night Cycle', keywords: 'sky day night cycle animate time sun' },
  { panelId: 'skybox', settingId: 'skybox.skyboxCycleSpeed', label: '주기 속도', keywords: 'sky day night cycle speed animation time sun' },
  { panelId: 'lighting', settingId: 'lighting.sunColor', label: '태양 색상', keywords: 'sun lighting color' },
  { panelId: 'lighting', settingId: 'lighting.sunIntensity', label: '태양 강도', keywords: 'sun lighting brightness' },
  { panelId: 'lighting', settingId: 'lighting.fogDensity', label: '안개 밀도', keywords: 'fog atmosphere density' },
  { panelId: 'lighting', settingId: 'lighting.skyAmbient', label: '하늘 주변광', keywords: 'ambient sky bounce lighting' },
  { panelId: 'lighting', settingId: 'lighting.groundBounce', label: '지면 반사', keywords: 'bounce lighting shadow' },
  { panelId: 'lighting', settingId: 'lighting.cloudShadowsEnabled', label: '구름 그림자', keywords: 'cloud real time terrain cast projected shadow lighting' },
  { panelId: 'lighting', settingId: 'lighting.cloudShadowOpacity', label: 'Cloud Shadow Strength', keywords: 'cloud terrain shadow darkness opacity lighting' },
  { panelId: 'lighting', settingId: 'lighting.godRays', label: '신의 광선', keywords: 'sun rays light shafts atmosphere clouds lighting' },

  // Visuals
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsPostEnabled', label: '포스트 프로세싱', keywords: 'visuals post processing effects bloom vignette exposure contrast saturation' },
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsExposure', label: '노출', keywords: 'visuals post exposure brightness hdr' },
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsBloomStrength', label: '블룸 세기', keywords: 'visuals bloom glow post bright highlights' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsSkyIntensity', label: 'HDR Sky Intensity', keywords: 'visuals hdri hdr sky environment intensity' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsSunGlow', label: '태양 발광', keywords: 'visuals sky sun glow hdr' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsAtmosphereTint', label: '대기 색조', keywords: 'visuals sky atmosphere tint hdr color' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.visualsTerrainHeightDetail', label: '디테일 높이', keywords: 'visuals terrain height detail normals bump surface texture' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.visualsWetShoreStrength', label: '젖은 해안 세기', keywords: 'visuals shoreline wet sand terrain shore' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.normalStrength', label: '노멀 강도', keywords: 'surface shading detail normals terrain' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.aoStrength', label: '주변 폐색', keywords: 'surface shading crevice darkening terrain' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.aoRidge', label: 'Ridge Accent', keywords: 'surface shading ridge crest highlight alpine realistic mountain ao' },
  { panelId: 'visuals', tabId: 'shoreline', settingId: 'visuals.visualsFoamBreakup', label: '거품 해체', keywords: 'visuals shoreline foam water coast breakup' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsPixelatedEnabled', label: 'Pixelated Camera Shader', keywords: 'visuals camera filter pixel ps1 low resolution' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsPixelResolution', label: '가상 해상도', keywords: 'visuals camera pixelated resolution 240p ps1' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringEnabled', label: 'Dithering Camera Shader', keywords: 'visuals camera filter dither bayer palette ps1' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringStrength', label: '디더링 세기', keywords: 'visuals camera dither intensity palette' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringLevels', label: 'Dithering Color Levels', keywords: 'visuals camera dither palette depth colors banding' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringScale', label: 'Dithering Pattern Scale', keywords: 'visuals camera dither bayer pixel pattern size' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtEnabled', label: 'CRT 카메라 셰이더', keywords: 'visuals camera filter crt scanline curvature chromatic' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtStrength', label: 'CRT 강도', keywords: 'visuals camera crt intensity scanline noise' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtLensBend', label: 'CRT 렌즈 왜곡', keywords: 'visuals camera crt barrel distortion curve lens bend' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtLineWidth', label: 'CRT 스캔라인 너비', keywords: 'visuals camera crt scanline width thickness lines' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsChromaticAberrationEnabled', label: 'Chromatic Aberration Camera Shader', keywords: 'visuals camera filter chromatic aberration rgb separation fringe' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsChromaticAberrationStrength', label: 'Chromatic Aberration Offset', keywords: 'visuals camera chromatic aberration rgb separation amount pixels' },

  // Clouds / props / debug / export
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudCoverage', label: '범위', keywords: 'cloud density cover sky shape' },
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudDensity', label: '밀도', keywords: 'cloud thickness opacity shape' },
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudSoftness', label: '부드러움', keywords: 'cloud edge softness shape' },
  { panelId: 'clouds', settingId: 'clouds.cloudsEnabled', label: '구름 활성화', keywords: 'cloud volumetric sky enable' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudAtmosphereInfluence', label: 'Sky Influence', keywords: 'cloud sky atmosphere lighting color' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudSunResponse', label: '태양 반응', keywords: 'cloud sunlight direct lighting' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudAmbientResponse', label: '주변광 반응', keywords: 'cloud ambient zenith horizon bounce lighting' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudSilverLining', label: 'Silver Lining', keywords: 'cloud sun edge halo scattering glow' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterAtmosphereInfluence', label: 'Water Sky Influence', keywords: 'water sky atmosphere lighting color legacy realistic planet' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterSunResponse', label: 'Water Sun Response', keywords: 'water sunlight direct lighting surface volume' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterAmbientResponse', label: 'Water Ambient Response', keywords: 'water ambient sky bounce lighting night' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterFoamLighting', label: 'Water Foam Lighting', keywords: 'water foam lighting night brightness shoreline whitecaps' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsDensity', label: '마스터 밀도', keywords: 'props grass flowers rocks trees density scatter' },
  { panelId: 'props', sectionLabel: '자산 라이브러리', settingId: 'props.assetLibrary', label: 'Props Asset Library', keywords: 'props assets library preview add replace duplicate remove edit grass flowers rocks trees' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsGrassDensity', label: '풀 밀도', keywords: 'props grass meadow density scatter' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsFlowers', label: '꽃 밀도', keywords: 'props flowers meadow scatter' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsRocks', label: '바위 밀도', keywords: 'props rocks boulders stones terrain color' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsTreeDensity', label: 'Tree Density', keywords: 'props trees broadleaf conifer forest density scatter' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsGrass', label: '풀 높이', keywords: 'props grass scale height patch blades biome color' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsRockScale', label: '바위 스케일', keywords: 'props rocks scale boulders stones' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsTreeScale', label: '나무 스케일', keywords: 'props trees broadleaf conifer forest size height' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsWind', label: '바람', keywords: 'props animation grass flower wind sway' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsWindSpeed', label: '애니메이션 속도', keywords: 'props animation speed wind sway' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsGust', label: 'Gust Motion', keywords: 'props animation gust wind sway' },
  { panelId: 'props', sectionLabel: '성능 우선', settingId: 'props.propQuality', label: '소품 품질', keywords: 'props quality lod performance grass rocks trees' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.autoUpdate', label: '자동 업데이트', keywords: 'debug generation rebuild' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freezeCulling', label: '컬링 정지', keywords: 'debug culling freeze' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freezeLod', label: 'LOD 정지', keywords: 'debug lod freeze' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.forceRender', label: '강제 렌더링', keywords: 'debug render fps' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.disableHeightBake', label: '높이 베이크 비활성화', keywords: 'debug height bake' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freeCamNoClip', label: '프리캠 노클립', keywords: 'debug camera free cam noclip no clip collision fly zqsd wasd first person' },
  { panelId: 'debug', settingId: 'debug.terrainDetailDebug', label: '지형 재질 디버그', keywords: 'debug terrain detail slope rock shoreline normal albedo' },
  { panelId: 'debug', settingId: 'debug.mergeDebug', label: '청크 병합 표시', keywords: 'debug merge chunk group macro proxy color tint surface overlay viewport visualize fold unfold draw call' },
  { panelId: 'export', settingId: 'export.format', label: '형식', keywords: 'export file glb obj' },
];

const SECTION_INDEX = [
  // Water
  { panelId: 'water', sectionLabel: '최빈값', settingId: 'water.section.mode', label: '최빈값', keywords: 'water mode enable sea level', isSection: true },
  { panelId: 'water', sectionLabel: '셰이더 품질', settingId: 'water.section.shader', label: '셰이더 품질', keywords: 'water shader quality reflection detail waves', isSection: true },
  { panelId: 'water', sectionLabel: '재질', settingId: 'water.section.material', label: '재질', keywords: 'water material animation colors', isSection: true },
  { panelId: 'water', sectionLabel: '깊이', settingId: 'water.section.depth', label: '깊이', keywords: 'water depth absorption shallow deep', isSection: true },
  { panelId: 'water', sectionLabel: '물결', settingId: 'water.section.waves', label: '물결', keywords: 'water waves animation motion', isSection: true },
  { panelId: 'water', sectionLabel: '해안선', settingId: 'water.section.foam', label: '해안선', keywords: 'water foam shoreline shore distance coast', isSection: true },
  { panelId: 'water', sectionLabel: '수중', settingId: 'water.section.underwater', label: '수중', keywords: 'water underwater fog caustics', isSection: true },

  // Clouds
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.section.shape', label: '형태', keywords: 'cloud shape coverage density softness', isSection: true },
  { panelId: 'clouds', sectionLabel: '셸', settingId: 'clouds.section.shell', label: '셸', keywords: 'cloud altitude thickness shell layer', isSection: true },
  { panelId: 'clouds', sectionLabel: '노이즈', settingId: 'clouds.section.noise', label: '노이즈', keywords: 'cloud noise erosion detail scale', isSection: true },
  { panelId: 'clouds', sectionLabel: '동작', settingId: 'clouds.section.motion', label: '동작', keywords: 'cloud wind rotation evolve motion', isSection: true },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.section.lighting', label: '조명', keywords: 'cloud lighting shadow scattering color', isSection: true },
  { panelId: 'clouds', sectionLabel: '성능 우선', settingId: 'clouds.section.performance', label: '성능 우선', keywords: 'cloud performance resolution distance steps', isSection: true },

  // Lighting
  { panelId: 'lighting', sectionLabel: '태양', settingId: 'lighting.section.sun', label: '태양', keywords: 'sun lighting azimuth elevation color intensity', isSection: true },
  { panelId: 'lighting', sectionLabel: '대기', settingId: 'lighting.section.atmosphere', label: '대기', keywords: 'atmosphere fog ambient bounce lighting', isSection: true },
  { panelId: 'lighting', sectionLabel: '구름 & 광선', settingId: 'lighting.section.clouds', label: '구름 & 광선', keywords: 'cloud shadows god rays sun shafts lighting', isSection: true },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.section.waterLighting', label: '물 조명', keywords: 'water sky sun ambient foam lighting legacy realistic planet', isSection: true },

  // Skybox
  { panelId: 'skybox', sectionLabel: '시간대', settingId: 'skybox.section.time', label: '시간대', keywords: 'sky time day night sun', isSection: true },
  { panelId: 'skybox', sectionLabel: 'Appearance', settingId: 'skybox.section.appearance', label: 'Appearance', keywords: 'sky brightness haze stars appearance', isSection: true },

  // Props
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.section.distribution', label: '분포', keywords: 'props grass flowers rocks density distribution', isSection: true },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.section.look', label: '시점', keywords: 'props grass rock look scale animation wind', isSection: true },
  { panelId: 'props', sectionLabel: '성능 우선', settingId: 'props.section.performance', label: '성능 우선', keywords: 'props cull lod performance distance', isSection: true },

  // Export
  { panelId: 'export', sectionLabel: 'Format & Resolution', settingId: 'export.section.format', label: 'Format & Resolution', keywords: 'export format mesh resolution glb', isSection: true },
  { panelId: 'export', sectionLabel: 'Texture Baking', settingId: 'export.section.textures', label: 'Texture Baking', keywords: 'export texture bake color normal', isSection: true },
  { panelId: 'export', sectionLabel: '추가 자산', settingId: 'export.section.assets', label: '추가 자산', keywords: 'export heightmap collision assets', isSection: true },
  { panelId: 'export', sectionLabel: 'Water Maps', settingId: 'export.section.waterMaps', label: 'Water Maps', keywords: 'export water mask depth shoreline foam', isSection: true },

  // Planet
  { panelId: 'planet', sectionLabel: '프리셋', settingId: 'planet.section.preset', label: '프리셋', keywords: 'planet style preset', isSection: true },
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.section.palette', label: '팔레트', keywords: 'planet palette colors biomes', isSection: true },
];

const FULL_SETTINGS_INDEX = [...SETTINGS_INDEX, ...SECTION_INDEX];

const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function scoreEntry(entry, q, tokens) {
  const haystack = normalizeText([
    entry.label,
    entry.sectionLabel,
    entry.panelId,
    entry.keywords,
    entry.aliases,
  ].filter(Boolean).join(' '));
  if (!haystack || !haystack.includes(q)) {
    if (!tokens.every((token) => haystack.includes(token))) return 0;
  }

  let score = 0;
  const label = normalizeText(entry.label);
  const section = normalizeText(entry.sectionLabel);
  const aliases = normalizeText(entry.aliases);

  if (label === q) score += 1200;
  if (label.startsWith(q)) score += 600;
  if (label.includes(q)) score += 300;
  if (section && section === q) score += 500;
  if (section && section.includes(q)) score += 120;
  if (aliases && aliases.includes(q)) score += 180;
  if (haystack.startsWith(q)) score += 80;
  score += Math.max(0, 60 - haystack.indexOf(q));
  for (const token of tokens) {
    if (label.includes(token)) score += 40;
    if (section.includes(token)) score += 20;
    if (aliases.includes(token)) score += 30;
  }

  return score;
}

export function searchSettings(query, isPanelAvailable = () => true) {
  const q = normalizeText(query);
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  return FULL_SETTINGS_INDEX
    .map((entry) => {
      if (!isPanelAvailable(entry.panelId)) return null;
      const score = scoreEntry(entry, q, tokens);
      if (!score) return null;
      return { ...entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

export { SETTINGS_INDEX, SECTION_INDEX, FULL_SETTINGS_INDEX };
