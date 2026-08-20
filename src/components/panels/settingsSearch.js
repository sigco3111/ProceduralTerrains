const SETTINGS_INDEX = [
  // Terrain — presets (shape preset also carries the cartoon palette/noise)
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.preset', label: 'Terrain Preset', keywords: 'preset style layout highlands alpine desert dunes canyon volcanic rolling archipelago cartoon', aliases: 'cartoon toon preset' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noisePreset', label: '노이즈 프리셋', keywords: 'noise preset style cartoon simple flat low relief default', aliases: '카툰 툰' },

  // Terrain — erosion (Tile mode only)
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionEnabled', label: '침식 활성화', keywords: 'erosion hydraulic thermal weathering bake apply rivers valleys carve' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionPreset', label: 'Erosion Preset', keywords: 'erosion preset natural mountain canyon rain thermal lite dry' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionQuality', label: '침식 품질', keywords: 'erosion quality resolution grid bake preview balanced high ultra' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionStrength', label: '침식 세기', keywords: 'erosion strength blend amount master mix' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionDroplets', label: '물방울', keywords: 'erosion droplets rain hydraulic valleys ravines channels' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionLifetime', label: '물방울 수명', keywords: 'erosion droplet lifetime steps travel' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식', settingId: 'erosion.erosionSeed', label: 'Erosion Seed', keywords: 'erosion seed random droplet spawn deterministic' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionRadius', label: '침식 반경', keywords: '침식 반경 브러시 채널 스무딩 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionErosionRate', label: '침식 비율', keywords: '침식 속도 깎기 공격 물 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionDeposition', label: '퇴적', keywords: 'erosion deposition sediment settle advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionSedimentCapacity', label: '퇴적물 용량', keywords: '침식 퇴적물 운반량 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionEvaporation', label: '증발', keywords: 'erosion evaporation water drainage advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionGravity', label: '중력', keywords: 'erosion gravity downhill droplet advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionInertia', label: '관성', keywords: 'erosion inertia direction slope advanced' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionThermalStrength', label: '열 침식 세기', keywords: '침식 열 강도 너덜토석 미끄러짐 경사 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionThermalIterations', label: '열 침식 반복', keywords: '침식 열 이완 반복 너덜토석 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionTalus', label: '테일러스 각도', keywords: '침식 너덜토석 각도 경사 미끄러짐 가파름 고급' },
  { panelId: 'terrain', tabId: 'erosion', sectionLabel: '침식 · 고급', settingId: 'erosion.erosionSmoothing', label: '스무딩', keywords: '침식 스무딩 로우패스 부드럽게 노이즈 고급' },

  // Terrain
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.heightScale', label: '높이 스케일', keywords: 'height elevation mountain terrain amplitude', aliases: 'height map height noise' },
  { panelId: 'terrain', tabId: 'shape', sectionLabel: '형태', settingId: 'terrain.seaLevel', label: '해수면', keywords: 'water ocean coast shoreline sea' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noiseScale', label: '노이즈 스케일', keywords: 'height noise detail fractal terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.noiseStrength', label: '노이즈 세기', keywords: 'height noise amplitude terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.terrainSmoothing', label: '봉우리 스무딩', keywords: 'height noise smooth smoothing rounded round hills peaks pointy spike spiky realistic terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.octaves', label: '옥타브', keywords: 'height noise detail fbm terrain' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.persistence', label: '지속성', keywords: 'height noise roughness fbm' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.lacunarity', label: '틈새도', keywords: 'height noise frequency fbm' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.ridge', label: '능선 강도', keywords: 'height noise ridge mountain alpine' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.warp', label: '도메인 뒤틀림', keywords: 'height noise warp fold distortion' },
  { panelId: 'terrain', tabId: 'noise', sectionLabel: '노이즈', settingId: 'terrain.falloff', label: '가장자리 감쇠 너비', keywords: 'height coast island edge falloff' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldCustom', label: '실제 세계 사용자 지정 영역', keywords: 'real world earth elevation heightmap terrarium custom area latitude longitude coordinates zoom picker import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldLat', label: '실제 세계 위도', keywords: 'real world earth latitude coordinates custom area import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.realWorldLon', label: '실제 세계 경도', keywords: 'real world earth longitude coordinates custom area import' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.heightMap', label: '하이맵', keywords: 'height import replace blend map' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.noiseMap', label: '노이즈 맵', keywords: 'noise import replace blend map' },
  { panelId: 'terrain', tabId: 'import', sectionLabel: '가져오기', settingId: 'terrain.biomeMap', label: '바이옴 맵', keywords: '바이옴 가져오기 교체 블렌드 맵' },

  // Noise Layers
  { panelId: 'noiseLayers', settingId: 'noise.stackPreset', label: '스택 프리셋', keywords: 'noise stack preset realistic alpine ranges massif granite spires foothills rolling mountains eroded classic hills sharp canyon dunes craters cellular islands valleys' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.stackNormalize', label: '출력 정규화', keywords: 'noise stack output normalize normalization remap range soft clamp peaks ceiling height' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.outputMin', label: '출력 최소', keywords: 'noise stack output minimum min remap range normalize height floor low' },
  { panelId: 'noiseLayers', sectionLabel: '출력', settingId: 'noise.outputMax', label: '최대 출력', keywords: 'noise stack output maximum max remap range normalize height peaks soft clamp ceiling' },
  { panelId: 'noiseLayers', sectionLabel: '레이어 매개변수', settingId: 'noise.layer.erosion', label: '레이어 침식', keywords: 'noise layer erosion derivative dampening eroded fractal valleys drainage realistic fbm ridged billow mountains' },
  { panelId: 'noiseLayers', sectionLabel: '레이어 매개변수', settingId: 'noise.layer.selfWarp', label: '자체 뒤틀림', keywords: 'noise layer self warp anti pattern breakup spaghetti ridges massif mountains fbm ridged billow realistic' },
  { panelId: 'noiseLayers', sectionLabel: '레이어 매개변수', settingId: 'noise.layer.domainWarpOctaves', label: '도메인 워프 옥타브', keywords: 'noise layer domain warp octaves pattern repetition distortion' },
  { panelId: 'noiseLayers', sectionLabel: '마스크', settingId: 'noise.mask.slopeMin', label: '경사 마스크 최소', keywords: 'noise layer mask slope cliff steep scree rock minimum min' },
  { panelId: 'noiseLayers', sectionLabel: '마스크', settingId: 'noise.mask.slopeMax', label: '경사 마스크 최대', keywords: 'noise layer mask slope cliff steep scree rock maximum max' },
  { panelId: 'noiseLayers', sectionLabel: '마스크', settingId: 'noise.mask.slopeFalloff', label: '경사 마스크 감쇠', keywords: 'noise layer mask slope softness falloff feather cliffs scree' },

  // Biomes
  { panelId: 'biomes', settingId: 'biomes.biomeScale', label: '생태계 밀도', keywords: '바이옴 밀도 분포 기후 맵' },
  { panelId: 'biomes', settingId: 'biomes.tempBias', label: '온도', keywords: 'biome climate heat cold' },
  { panelId: 'biomes', settingId: 'biomes.moistScale', label: '수분 스케일', keywords: '바이옴 기후 습도 건조 촉촉' },
  { panelId: 'biomes', settingId: 'biomes.moistBias', label: '수분 편향', keywords: '바이옴 기후 습도 건조 촉촉' },
  { panelId: 'biomes', settingId: 'biomes.snowLine', label: '적설선', keywords: '바이옴 기후 설산 고도' },
  { panelId: 'biomes', settingId: 'biomes.snowSlopeMin', label: '적설 경사 유지', keywords: '바이옴 설산 경사 평탄 유지 리얼리스틱 알파인 가파른 커버리지' },
  { panelId: 'biomes', settingId: 'biomes.snowSlopeMax', label: '적설 경사 흘림', keywords: '바이옴 설산 경사 미끄러짐 가파른 절벽 리얼리스틱 알파인 그럴듯한' },
  { panelId: 'biomes', settingId: 'biomes.rockSlopeLo', label: '암석 경사 시작', keywords: '바이옴 암석 경사 절벽 노출 시작 리얼리스틱 가파른 지형' },
  { panelId: 'biomes', settingId: 'biomes.rockSlopeHi', label: '암석 경사 전체', keywords: '바이옴 암석 경사 절벽 노출 풀 리얼리스틱 가파른 지형' },
  { panelId: 'biomes', settingId: 'biomes.biomeDebug', label: '생태계 디버그', keywords: '바이옴 디버그 오버레이 검사' },

  // World
  { panelId: 'world', settingId: 'world.chunkCount', label: '청크 수', keywords: '월드 그리드 스트리밍 타일' },
  { panelId: 'world', settingId: 'world.chunkSize', label: '청크 크기', keywords: '월드 그리드 스트리밍 타일' },
  { panelId: 'world', settingId: 'world.chunkGrid', label: '청크 그리드', keywords: '월드 그리드 디버그 오버레이' },
  { panelId: 'world', settingId: 'world.tileAssemblyShape', label: '타일 형태', keywords: '타일 사각 원형 어셈블리 디스크' },
  { panelId: 'world', settingId: 'world.planetRadius', label: '행성 반지름', keywords: 'planet sphere radius curvature' },
  { panelId: 'world', settingId: 'world.planetFaceGrid', label: '표면 디테일', keywords: 'planet face grid chunk detail' },

  // Water
  { panelId: 'water', settingId: 'water.waterEnabled', label: '물 활성화', keywords: '물 해양 활성화 비활성화' },
  { panelId: 'water', settingId: 'water.seaLevel', label: '해수면', keywords: '물 해양 해수면 높이 해안' },
  { panelId: 'water', settingId: 'water.waterMode', label: '물 모드', keywords: '물 레거시 리얼리스틱 볼류메트릭 시네마틱 품질 카툰 열대 해양 호수', aliases: '카툰 툰' },
  { panelId: 'water', settingId: 'water.waterAnim', label: '물 애니메이션', keywords: '물 파도 해양 모션' },
  { panelId: 'water', sectionLabel: '해안선', settingId: 'water.waterFoamWidth', label: '해안 거리', keywords: '물 해안 해안선 해안 거리 너비 거품 밴드' },
  { panelId: 'water', settingId: 'water.waterDebugView', label: '물 디버그 뷰', keywords: '물 디버그 깊이 거품 해안선 마스크' },

  // Planet style / colors
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.palettePreset', label: '색상 팔레트 프리셋', keywords: 'palette preset colors theme earth desert ice toxic neon volcanic cartoon pastel moon rust monolith gray grey', aliases: 'cartoon toon colors palette' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.deep', label: '깊은 물', keywords: 'water color ocean deep' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.shallow', label: '얕음', keywords: 'water color shore coast shallow' },
  { panelId: 'planet', sectionLabel: '물', settingId: 'planet.water.foam', label: '거품', keywords: 'water color waves foam shoreline' },
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.paletteSaturation', label: '채도', keywords: 'palette color tuning contrast' },
  { panelId: 'planet', sectionLabel: '팔레트', settingId: 'planet.paletteContrast', label: '대비', keywords: 'palette color tuning contrast' },

  // Performance (standalone panel — GPU/renderer, global preset, LOD, streaming, water, fog, clouds)
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.preset', label: '프리셋', keywords: 'quality profile performance' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.rendererBackend', label: '렌더러 백엔드', keywords: 'GPU 렌더러 백엔드 WebGL WebGPU 자동 그래픽' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.gpuPreference', label: 'GPU 선호', keywords: 'GPU 전력 설정 고성능 저전력 전용 배터리' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.useWorker', label: '워커 렌더러', keywords: 'offscreen canvas worker renderer experimental main thread' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.autoPerf', label: '자동 성능 모드', keywords: '자동 FPS 성능' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.onDemandStudio', label: '유휴 시 일시 정지', keywords: 'idle redraw battery performance' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.renderScale', label: '렌더 스케일', keywords: 'resolution pixel dpr scale' },
  { panelId: 'performance', tabId: 'overview', settingId: 'performance.resolutionDenoiseMode', label: '해상도 재구성', keywords: '디노이즈 (깔끔 / 픽셀화 / 가장 가까움 / 업스케일 / PS1)' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.resolutionScale', label: '지형 해상도', keywords: 'lod mesh detail' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.lodDistanceScale', label: 'LOD 거리 스케일', keywords: 'lod distance scale' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMerge', label: '청크 병합', keywords: 'merge chunk quadtree fold draw call batch far distant combine tile performance' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMergeDistance', label: '병합 거리', keywords: 'merge fold distance quadtree aggressiveness block threshold near far' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMergeQuads', label: '병합 밀도', keywords: 'merge density resolution quads far mesh quality lossless' },
  { panelId: 'performance', tabId: 'lod', settingId: 'performance.terrainMacroProxy', label: '전체 보드 병합', keywords: 'macro proxy single mesh whole tile board zoom out extreme distance far root fold' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.viewRadius', label: '청크 로드 반경', keywords: '스트리밍 로드 반경 청크' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.maxCreatesPerFrame', label: '청크 빌드 / 프레임', keywords: '스트리밍 타일 새 셀 청크 생성 스폰 예산 즉시 비활성화 쓰로틀' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.triangleBudget', label: '삼각형 예산', keywords: '삼각형 한도 예산 메쉬 스트리밍' },
  { panelId: 'performance', tabId: 'streaming', settingId: 'performance.cullingAggressiveness', label: '컬링 공격성', keywords: '시야각 카메라 뒤 컬링 스트리밍' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterQuality', label: '물 품질', keywords: '물 품질 반사 디테일' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterReflection', label: '물 반사', keywords: '물 스펙큘러 반사' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterDetail', label: '물 디테일', keywords: '물 잔물결 디테일' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterWaves', label: '파도 강도', keywords: '물 파도 모션 복잡도' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.underwaterEffect', label: '수중 효과', keywords: '물 수중 안개 색조' },
  { panelId: 'performance', tabId: 'water', settingId: 'performance.waterDistance', label: '물 거리', keywords: '물 범위 페이드' },
  { panelId: 'performance', tabId: 'fog', settingId: 'performance.fogDistance', label: '안개 거리', keywords: '안개 대기 가시성' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudSteps', label: '레이마칭 단계', keywords: '구름 스텝 품질 성능' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudLightSteps', label: '그림자 단계', keywords: '구름 그림자 스텝 성능' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudOctaves', label: '기본 노이즈 옥타브', keywords: '구름 노이즈 옥타브' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudDetailOctaves', label: '디테일 노이즈 옥타브', keywords: '구름 노이즈 디테일 옥타브' },
  { panelId: 'performance', tabId: 'clouds', settingId: 'performance.cloudMaxDistance', label: '최대 거리', keywords: '구름 거리 가시성 컬링' },

  // Terrain > Surface > Properties (terrain material / texture render controls)
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailQuality', label: '지형 디테일 품질', keywords: '지형 머티리얼 텍스처 디테일 1인칭 근접 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailOpacity', label: '디테일 불투명도', keywords: '지형 디테일 불투명도 마스터 믹스 양 전체 페이드 블렌드 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailScale', label: '디테일 텍스처 스케일', keywords: '지형 노이즈 텍스처 스케일 그레인 월드 공간 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailStrength', label: '디테일 세기', keywords: '지형 알베도 바이옴 근접 디테일 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailNormal', label: '디테일 노멀 강도', keywords: '지형 노멀 조명 범프 근접 머티리얼 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainMicroDetail', label: '미세 디테일', keywords: '지형 마이크로 그레인 점박이 선명한 클로즈업 고주파 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainMacroVariation', label: '매크로 변화', keywords: '지형 매크로 변화 풍화 패치 바이옴 분해 대규모 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainDetailFar', label: '거리 디테일 페이드', keywords: '지형 디테일 페이드 근원거리 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainRockSlope', label: '바위 경사 혼합', keywords: '지형 경사 바위 절벽 블렌드 트라이플래너 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainTriplanar', label: '트리플래너 디테일', keywords: '지형 절벽 투영 늘림 트라이플래너 속성' },
  { panelId: 'terrain', tabId: 'surface', subTabId: 'general', settingId: 'performance.terrainShoreRange', label: '해안선 디테일', keywords: '지형 해안 젖은 모래 진흙 해안선 물 가장자리 속성' },

  // Sky / lighting
  { panelId: 'skybox', settingId: 'skybox.timeOfDay', label: '시간대', keywords: '태양 하늘 낮 밤 시간' },
  { panelId: 'skybox', settingId: 'skybox.skyboxBrightness', label: '하늘 밝기', keywords: 'sky atmosphere brightness' },
  { panelId: 'skybox', settingId: 'skybox.skyboxHaze', label: '지평선 연무', keywords: 'sky atmosphere haze' },
  { panelId: 'skybox', settingId: 'skybox.skyboxStars', label: '밤 별', keywords: 'sky stars night' },
  { panelId: 'skybox', settingId: 'skybox.skyboxDayNightCycle', label: '낮/밤 사이클', keywords: 'sky day night cycle animate time sun' },
  { panelId: 'skybox', settingId: 'skybox.skyboxCycleSpeed', label: '주기 속도', keywords: 'sky day night cycle speed animation time sun' },
  { panelId: 'lighting', settingId: 'lighting.sunColor', label: '태양 색상', keywords: '태양 조명 색상' },
  { panelId: 'lighting', settingId: 'lighting.sunIntensity', label: '태양 강도', keywords: '태양 조명 밝기' },
  { panelId: 'lighting', settingId: 'lighting.fogDensity', label: '안개 밀도', keywords: '안개 대기 밀도' },
  { panelId: 'lighting', settingId: 'lighting.skyAmbient', label: '하늘 주변광', keywords: '앰비언트 하늘 반사 라이팅' },
  { panelId: 'lighting', settingId: 'lighting.groundBounce', label: '지면 반사', keywords: '반사 라이팅 그림자' },
  { panelId: 'lighting', settingId: 'lighting.cloudShadowsEnabled', label: '구름 그림자', keywords: '구름 실시간 지형 투사 그림자 라이팅' },
  { panelId: 'lighting', settingId: 'lighting.cloudShadowOpacity', label: '구름 그림자 강도', keywords: '구름 지형 그림자 어둠 불투명도 라이팅' },
  { panelId: 'lighting', settingId: 'lighting.godRays', label: '신의 광선', keywords: '태양 광선 빛 기둥 대기 구름 조명' },

  // Visuals
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsPostEnabled', label: '포스트 프로세싱', keywords: '비주얼 포스트 프로세싱 이펙트 블룸 비네트 노출 대비 채도' },
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsExposure', label: '노출', keywords: 'visuals post exposure brightness hdr' },
  { panelId: 'visuals', tabId: 'post', settingId: 'visuals.visualsBloomStrength', label: '블룸 세기', keywords: '비주얼 블룸 글로우 포스트 밝은 하이라이트' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsSkyIntensity', label: 'HDR 하늘 강도', keywords: '비주얼 HDRI HDR 하늘 환경 강도' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsSunGlow', label: '태양 발광', keywords: '비주얼 하늘 태양 글로우 HDR' },
  { panelId: 'visuals', tabId: 'sky', settingId: 'visuals.visualsAtmosphereTint', label: '대기 색조', keywords: '비주얼 하늘 대기 색조 HDR 색상' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.visualsTerrainHeightDetail', label: '디테일 높이', keywords: '비주얼 지형 높이 디테일 노멀 범프 표면 텍스처' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.visualsWetShoreStrength', label: '젖은 해안 세기', keywords: '비주얼 해안선 젖은 모래 지형 해안' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.normalStrength', label: '노멀 강도', keywords: '지표 음영 디테일 노멀 지형' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.aoStrength', label: '주변 폐색', keywords: '지표 음영 틈새 어두워짐 지형' },
  { panelId: 'visuals', tabId: 'terrain', settingId: 'visuals.aoRidge', label: '능선 강조', keywords: '지표 음영 능선 볏 강조 알파인 리얼리스틱 산 AO' },
  { panelId: 'visuals', tabId: 'shoreline', settingId: 'visuals.visualsFoamBreakup', label: '거품 해체', keywords: '비주얼 해안선 거품 물 해안 분해' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsPixelatedEnabled', label: '픽셀화된 카메라 셰이더', keywords: '비주얼 카메라 필터 픽셀 PS1 저해상도' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsPixelResolution', label: '가상 해상도', keywords: '비주얼 카메라 픽셀화 해상도 240p PS1' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringEnabled', label: '디더링 카메라 셰이더', keywords: '비주얼 카메라 필터 디더 베이어 팔레트 PS1' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringStrength', label: '디더링 세기', keywords: '비주얼 카메라 디더 강도 팔레트' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringLevels', label: '디더링 색상 단계', keywords: '비주얼 카메라 디더 팔레트 깊이 색상 밴딩' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsDitheringScale', label: '디더링 패턴 스케일', keywords: '비주얼 카메라 디더 베이어 픽셀 패턴 크기' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtEnabled', label: 'CRT 카메라 셰이더', keywords: '비주얼 카메라 필터 CRT 스캔라인 곡률 색수차' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtStrength', label: 'CRT 강도', keywords: '비주얼 카메라 CRT 강도 스캔라인 노이즈' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtLensBend', label: 'CRT 렌즈 왜곡', keywords: '비주얼 카메라 CRT 배럴 왜곡 곡선 렌즈 휨' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsCrtLineWidth', label: 'CRT 스캔라인 너비', keywords: '비주얼 카메라 CRT 스캔라인 너비 두께 선' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsChromaticAberrationEnabled', label: '색수차 카메라 셰이더', keywords: '비주얼 카메라 필터 색수차 RGB 분리 프린지' },
  { panelId: 'visuals', tabId: 'camera', settingId: 'visuals.visualsChromaticAberrationStrength', label: '색수차 오프셋', keywords: '비주얼 카메라 색수차 RGB 분리 양 픽셀' },

  // Clouds / props / debug / export
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudCoverage', label: '범위', keywords: 'cloud density cover sky shape' },
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudDensity', label: '밀도', keywords: 'cloud thickness opacity shape' },
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.cloudSoftness', label: '부드러움', keywords: 'cloud edge softness shape' },
  { panelId: 'clouds', settingId: 'clouds.cloudsEnabled', label: '구름 활성화', keywords: '구름 볼류메트릭 하늘 활성화' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudAtmosphereInfluence', label: '하늘 영향', keywords: 'cloud sky atmosphere lighting color' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudSunResponse', label: '태양 반응', keywords: 'cloud sunlight direct lighting' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudAmbientResponse', label: '주변광 반응', keywords: 'cloud ambient zenith horizon bounce lighting' },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.cloudSilverLining', label: '실버 라이닝', keywords: 'cloud sun edge halo scattering glow' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterAtmosphereInfluence', label: '물 하늘 영향', keywords: '물 하늘 대기 조명 색상 레거시 리얼리스틱 행성' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterSunResponse', label: '물 태양 반응', keywords: '물 직사광 직접 조명 표면 볼륨' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterAmbientResponse', label: '물 주변광 반응', keywords: '물 주변광 하늘 반사 조명 밤' },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.waterFoamLighting', label: '물 거품 라이팅', keywords: '물 거품 조명 밤 밝기 해안선 파도 머리' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsDensity', label: '마스터 밀도', keywords: 'props grass flowers rocks trees density scatter' },
  { panelId: 'props', sectionLabel: '자산 라이브러리', settingId: 'props.assetLibrary', label: '소품 에셋 라이브러리', keywords: 'props assets library preview add replace duplicate remove edit grass flowers rocks trees' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsGrassDensity', label: '풀 밀도', keywords: 'props grass meadow density scatter' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsFlowers', label: '꽃 밀도', keywords: 'props flowers meadow scatter' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsRocks', label: '바위 밀도', keywords: 'props rocks boulders stones terrain color' },
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.propsTreeDensity', label: '나무 밀도', keywords: 'props trees broadleaf conifer forest density scatter' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsGrass', label: '풀 높이', keywords: 'props grass scale height patch blades biome color' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsRockScale', label: '바위 스케일', keywords: 'props rocks scale boulders stones' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsTreeScale', label: '나무 스케일', keywords: 'props trees broadleaf conifer forest size height' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsWind', label: '바람', keywords: 'props animation grass flower wind sway' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsWindSpeed', label: '애니메이션 속도', keywords: 'props animation speed wind sway' },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.propsGust', label: '돌풍 모션', keywords: 'props animation gust wind sway' },
  { panelId: 'props', sectionLabel: '성능 우선', settingId: 'props.propQuality', label: '소품 품질', keywords: 'props quality lod performance grass rocks trees' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.autoUpdate', label: '자동 업데이트', keywords: '디버그 생성 다시 만들기' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freezeCulling', label: '컬링 정지', keywords: '디버그 컬링 정지' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freezeLod', label: 'LOD 정지', keywords: '디버그 LOD 정지' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.forceRender', label: '강제 렌더링', keywords: '디버그 렌더 FPS' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.disableHeightBake', label: '높이 베이크 비활성화', keywords: '디버그 높이 베이크' },
  { panelId: 'debug', tabId: 'engine', settingId: 'debug.freeCamNoClip', label: '프리캠 노클립', keywords: '디버그 카메라 프리캠 노클립 충돌 비행 ZQSD WASD 1인칭' },
  { panelId: 'debug', settingId: 'debug.terrainDetailDebug', label: '지형 재질 디버그', keywords: '디버그 지형 디테일 경사 암석 해안선 노멀 알베도' },
  { panelId: 'debug', settingId: 'debug.mergeDebug', label: '청크 병합 표시', keywords: 'debug merge chunk group macro proxy color tint surface overlay viewport visualize fold unfold draw call' },
  { panelId: 'export', settingId: 'export.format', label: '형식', keywords: 'export file glb obj' },
];

const SECTION_INDEX = [
  // Water
  { panelId: 'water', sectionLabel: '최빈값', settingId: 'water.section.mode', label: '최빈값', keywords: '물 모드 활성화 해수면', isSection: true },
  { panelId: 'water', sectionLabel: '셰이더 품질', settingId: 'water.section.shader', label: '셰이더 품질', keywords: '물 셰이더 품질 반사 디테일 파도', isSection: true },
  { panelId: 'water', sectionLabel: '재질', settingId: 'water.section.material', label: '재질', keywords: 'water material animation colors', isSection: true },
  { panelId: 'water', sectionLabel: '깊이', settingId: 'water.section.depth', label: '깊이', keywords: 'water depth absorption shallow deep', isSection: true },
  { panelId: 'water', sectionLabel: '물결', settingId: 'water.section.waves', label: '물결', keywords: 'water waves animation motion', isSection: true },
  { panelId: 'water', sectionLabel: '해안선', settingId: 'water.section.foam', label: '해안선', keywords: '물 거품 해안선 해안 거리 해안', isSection: true },
  { panelId: 'water', sectionLabel: '수중', settingId: 'water.section.underwater', label: '수중', keywords: 'water underwater fog caustics', isSection: true },

  // Clouds
  { panelId: 'clouds', sectionLabel: '형태', settingId: 'clouds.section.shape', label: '형태', keywords: 'cloud shape coverage density softness', isSection: true },
  { panelId: 'clouds', sectionLabel: '셸', settingId: 'clouds.section.shell', label: '셸', keywords: 'cloud altitude thickness shell layer', isSection: true },
  { panelId: 'clouds', sectionLabel: '노이즈', settingId: 'clouds.section.noise', label: '노이즈', keywords: '구름 노이즈 침식 디테일 스케일', isSection: true },
  { panelId: 'clouds', sectionLabel: '동작', settingId: 'clouds.section.motion', label: '동작', keywords: 'cloud wind rotation evolve motion', isSection: true },
  { panelId: 'clouds', sectionLabel: '조명', settingId: 'clouds.section.lighting', label: '조명', keywords: 'cloud lighting shadow scattering color', isSection: true },
  { panelId: 'clouds', sectionLabel: '성능 우선', settingId: 'clouds.section.performance', label: '성능 우선', keywords: '구름 성능 해상도 거리 스텝', isSection: true },

  // Lighting
  { panelId: 'lighting', sectionLabel: '태양', settingId: 'lighting.section.sun', label: '태양', keywords: 'sun lighting azimuth elevation color intensity', isSection: true },
  { panelId: 'lighting', sectionLabel: '대기', settingId: 'lighting.section.atmosphere', label: '대기', keywords: 'atmosphere fog ambient bounce lighting', isSection: true },
  { panelId: 'lighting', sectionLabel: '구름 & 광선', settingId: 'lighting.section.clouds', label: '구름 & 광선', keywords: '구름 그림자 갓레이즈 선버스트 라이팅', isSection: true },
  { panelId: 'lighting', sectionLabel: '물 조명', settingId: 'lighting.section.waterLighting', label: '물 조명', keywords: '물 하늘 태양 주변광 거품 조명 레거시 리얼리스틱 행성', isSection: true },

  // Skybox
  { panelId: 'skybox', sectionLabel: '시간대', settingId: 'skybox.section.time', label: '시간대', keywords: 'sky time day night sun', isSection: true },
  { panelId: 'skybox', sectionLabel: '외관', settingId: 'skybox.section.appearance', label: '외관', keywords: 'sky brightness haze stars appearance', isSection: true },

  // Props
  { panelId: 'props', sectionLabel: '분포', settingId: 'props.section.distribution', label: '분포', keywords: 'props grass flowers rocks density distribution', isSection: true },
  { panelId: 'props', sectionLabel: '시점', settingId: 'props.section.look', label: '시점', keywords: 'props grass rock look scale animation wind', isSection: true },
  { panelId: 'props', sectionLabel: '성능 우선', settingId: 'props.section.performance', label: '성능 우선', keywords: 'props cull lod performance distance', isSection: true },

  // Export
  { panelId: 'export', sectionLabel: '포맷 및 해상도', settingId: 'export.section.format', label: '포맷 및 해상도', keywords: '내보내기 형식 메쉬 해상도 GLB', isSection: true },
  { panelId: 'export', sectionLabel: '텍스처 베이크', settingId: 'export.section.textures', label: '텍스처 베이크', keywords: '내보내기 텍스처 베이크 컬러 노멀', isSection: true },
  { panelId: 'export', sectionLabel: '추가 자산', settingId: 'export.section.assets', label: '추가 자산', keywords: '내보내기 높이맵 충돌 에셋', isSection: true },
  { panelId: 'export', sectionLabel: '물 맵', settingId: 'export.section.waterMaps', label: '물 맵', keywords: '내보내기 물 마스크 깊이 해안선 거품', isSection: true },

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
