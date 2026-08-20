// ============================================================================
// Real-world heightmap + map-texture source: fetches public elevation tiles
// (Terrarium / AWS) and geo-aligned RGB imagery for a curated list of famous
// locations. Elevation feeds the Tile-mode height import pipeline
// (Engine.loadRealWorldLocation → importedMaps.height.floatData →
// _rebuildImportedTexture); imagery (satellite or topo) feeds
// importedMaps.imagery on the same geoRef / Web Mercator grid so albedo lines
// up with the mesh.
//
// Source: AWS Open Data "지형 타일" in Terrarium encoding — public, no API
// key, CORS-enabled, derived from SRTM/NED/etc. Elevation is packed across RGB:
//     elevation_m = (R * 256 + G + B / 256) - 32768
//
// This module is intentionally THREE-free and side-effect-free: it only touches
// <canvas>/<img> for decoding and returns plain data.
// ============================================================================

const TILE = 256;
// Single swappable endpoint — if CORS ever breaks, only this line changes.
const ENDPOINT = 'https://elevation-tiles-prod.s3.dualstack.us-east-1.amazonaws.com/terrarium';
const MAX_TILES_PER_AXIS = 6;          // safety cap: at most 6×6 = 36 tile fetches
const SEA_FILL = 'rgb(128,0,0)';       // Terrarium encoding of 0 m (decodes to elevation 0)

export const ELEVATION_SOURCE = '표고: AWS Open Data의 지형 타일 (Terrarium) — Mapzen, SRTM 등';

/** @typedef {'satellite' | 'opentopo'} ImageryStyleId */

function wrapTileX(x, z) {
  const max = Math.pow(2, z);
  return ((x % max) + max) % max;
}

// Geo imagery styles — same Web Mercator grid as Terrarium elevation.
// Satellite is the default (photo-like landcover); OpenTopoMap keeps the
// cartographic overlay (roads / labels) as an optional view.
export const IMAGERY_STYLES = {
  satellite: {
    id: 'satellite',
    label: '위성',
    shortLabel: '위성',
    attribution: '영상: Esri World Imagery — Esri, Maxar, Earthstar Geographics & others',
    missingFill: '#243028',
    tileUrl(z, x, y) {
      // ArcGIS tile services use {z}/{y}/{x} (row/col), not OSM {z}/{x}/{y}.
      const wx = wrapTileX(x, z);
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wx}`;
    },
  },
  opentopo: {
    id: 'opentopo',
    label: '지형도',
    shortLabel: 'OpenTopoMap',
    attribution: '지도: © OpenTopoMap (CC-BY-SA) — © OpenStreetMap 기여자, SRTM',
    missingFill: '#d8d8d8',
    tileUrl(z, x, y) {
      const wx = wrapTileX(x, z);
      const hosts = [
        'https://a.tile.opentopomap.org',
        'https://b.tile.opentopomap.org',
        'https://c.tile.opentopomap.org',
      ];
      return `${hosts[(wx + y) % hosts.length]}/${z}/${wx}/${y}.png`;
    },
  },
};

export const DEFAULT_IMAGERY_STYLE = 'satellite';
/** @deprecated use imageryAttributionFor(style) */
export const IMAGERY_SOURCE = IMAGERY_STYLES.satellite.attribution;

export function resolveImageryStyle(id) {
  return IMAGERY_STYLES[id] || IMAGERY_STYLES[DEFAULT_IMAGERY_STYLE];
}

export function imageryAttributionFor(id) {
  return resolveImageryStyle(id).attribution;
}

// Curated, roughly-square bounding boxes around recognizable terrain.
export const CURATED_LOCATIONS = [
  { id: 'grand-canyon', name: '그랜드 캐년', blurb: '미국 애리조나 깎인 협곡',
    bbox: { minLat: 35.95, maxLat: 36.35, minLon: -112.45, maxLon: -111.95 }, zoom: 11 },
  { id: 'everest', name: '에베레스트 산', blurb: '히말라야, 네팔 / 티벳',
    bbox: { minLat: 27.80, maxLat: 28.18, minLon: 86.70, maxLon: 87.10 }, zoom: 11 },
  { id: 'fuji', name: '후지 산', blurb: '성층 화산, 일본',
    bbox: { minLat: 35.21, maxLat: 35.55, minLon: 138.55, maxLon: 138.93 }, zoom: 11 },
  { id: 'matterhorn', name: '마터호른', blurb: '페닌 알프스, 스위스 / 이탈리아',
    bbox: { minLat: 45.83, maxLat: 46.13, minLon: 7.46, maxLon: 7.86 }, zoom: 11 },
  { id: 'grand-teton', name: '그랜드 테톤', blurb: '테톤 산맥, �이오밍 미국',
    bbox: { minLat: 43.58, maxLat: 43.92, minLon: -110.98, maxLon: -110.62 }, zoom: 11 },
  { id: 'crater-lake', name: '분화구 호수', blurb: '캘데라, 오리건 USA',
    bbox: { minLat: 42.83, maxLat: 43.07, minLon: -122.27, maxLon: -121.97 }, zoom: 11 },
  { id: 'yosemite', name: '요세미티 계곡', blurb: '캘리포니아 시에라네바다, 미국',
    bbox: { minLat: 37.62, maxLat: 37.88, minLon: -119.70, maxLon: -119.40 }, zoom: 11 },
  { id: 'big-island', name: '하와이 (빅 아일랜드)', blurb: '마우나로아 & 마우나케아',
    bbox: { minLat: 19.30, maxLat: 19.90, minLon: -155.90, maxLon: -155.20 }, zoom: 10 },
  { id: 'vatnajokull', name: 'Vatnajökull', blurb: '빙하 고지대, 아이슬란드',
    bbox: { minLat: 64.20, maxLat: 64.62, minLon: -17.25, maxLon: -16.45 }, zoom: 10 },

  // --- Swiss Alps (specific peaks) ---
  { id: 'eiger', name: '아이거 & 융프라우', blurb: '베르니나 알프스 북쪽 면, 스위스',
    bbox: { minLat: 46.50, maxLat: 46.62, minLon: 7.93, maxLon: 8.07 }, zoom: 12 },
  { id: 'monte-rosa', name: '몬테 로사', blurb: '스위스 최고 산괴, 페닌 알프스',
    bbox: { minLat: 45.86, maxLat: 46.00, minLon: 7.80, maxLon: 7.94 }, zoom: 12 },
  { id: 'piz-bernina', name: '피츠 베르니나', blurb: '베르니나 산맥 빙하, 엥가딘',
    bbox: { minLat: 46.32, maxLat: 46.44, minLon: 9.84, maxLon: 9.98 }, zoom: 12 },
  { id: 'mont-blanc', name: '몽블랑', blurb: '알프스 최고봉, 프랑스 / 이탈리아',
    bbox: { minLat: 45.78, maxLat: 45.92, minLon: 6.79, maxLon: 6.95 }, zoom: 12 },

  // --- Iceland (more regions) ---
  { id: 'landmannalaugar', name: '란드만날라우가르', blurb: '아이슬란드 유리질암 고지대',
    bbox: { minLat: 63.92, maxLat: 64.10, minLon: -19.20, maxLon: -18.95 }, zoom: 11 },
  { id: 'askja', name: '아스캬', blurb: '캘데라 & 용암 사막, 아이슬란드 고원',
    bbox: { minLat: 65.00, maxLat: 65.12, minLon: -16.85, maxLon: -16.65 }, zoom: 11 },
  { id: 'snaefellsjokull', name: 'Snæfellsjökull', blurb: '서부 아이슬란드 빙하 화산',
    bbox: { minLat: 64.74, maxLat: 64.86, minLon: -23.88, maxLon: -23.70 }, zoom: 11 },

  // --- New Zealand (geothermal & alpine) ---
  { id: 'taupo-volcanic', name: '타우포 화산 지대', blurb: '뉴질랜드 지열 지대 & 분화구',
    bbox: { minLat: -39.30, maxLat: -39.06, minLon: 175.55, maxLon: 175.82 }, zoom: 11 },
  { id: 'mount-cook', name: '아오라키 / 쿡 산', blurb: '남부 알프스, 뉴질랜드',
    bbox: { minLat: -43.66, maxLat: -43.52, minLon: 170.05, maxLon: 170.23 }, zoom: 11 },
  { id: 'fiordland', name: '밀포드 사운드', blurb: '피오르드랜드 빙하 계곡, 뉴질랜드',
    bbox: { minLat: -44.72, maxLat: -44.54, minLon: 167.78, maxLon: 168.02 }, zoom: 11 },

  // --- Patagonia ---
  { id: 'fitz-roy', name: '몬테 피츠로이', blurb: '화강암 첨탑, 파타고니아, 아르헨티나',
    bbox: { minLat: -49.36, maxLat: -49.20, minLon: -73.10, maxLon: -72.92 }, zoom: 11 },
  { id: 'torres-del-paine', name: '토레스 델 파이네', blurb: '산괴 및 호수, 칠레 파타고니아',
    bbox: { minLat: -51.10, maxLat: -50.90, minLon: -73.10, maxLon: -72.80 }, zoom: 11 },

  // --- Other famous ranges & volcanoes ---
  { id: 'denali', name: '데날리', blurb: '북아메리카 최고봉, 알래스카 USA',
    bbox: { minLat: 63.00, maxLat: 63.20, minLon: -151.18, maxLon: -150.80 }, zoom: 11 },
  { id: 'kilimanjaro', name: '킬리만자로', blurb: '아프리카 최고봉, 탄자니아',
    bbox: { minLat: -3.15, maxLat: -2.97, minLon: 37.27, maxLon: 37.47 }, zoom: 11 },
  { id: 'k2', name: 'K2', blurb: '카라코람, 파키스탄 / 중국',
    bbox: { minLat: 35.79, maxLat: 35.97, minLon: 76.41, maxLon: 76.61 }, zoom: 11 },
  { id: 'aconcagua', name: '아콩카과', blurb: '아메리카 대륙 최고봉, 아르헨티나',
    bbox: { minLat: -32.74, maxLat: -32.56, minLon: -70.10, maxLon: -69.90 }, zoom: 11 },
  { id: 'annapurna', name: '안나푸르나', blurb: '깊은 히말라야 산괴, 네팔',
    bbox: { minLat: 28.50, maxLat: 28.68, minLon: 83.74, maxLon: 83.94 }, zoom: 11 },
  { id: 'zion', name: '자이언 캐년', blurb: '사암 협곡, 유타 USA',
    bbox: { minLat: 37.18, maxLat: 37.36, minLon: -113.10, maxLon: -112.90 }, zoom: 11 },
  { id: 'monument-valley', name: '모뉴먼트 밸리', blurb: '사암 메사, 애리조나 / 유타 USA',
    bbox: { minLat: 36.94, maxLat: 37.10, minLon: -110.20, maxLon: -110.00 }, zoom: 11 },
  { id: 'dolomites', name: '돌로미티', blurb: '트레 치메, 이탈리아의 석회암 타워',
    bbox: { minLat: 46.58, maxLat: 46.70, minLon: 12.25, maxLon: 12.40 }, zoom: 12 },
  { id: 'mount-rainier', name: '레니어 산', blurb: '빙하 성층 화산, 워싱턴 USA',
    bbox: { minLat: 46.78, maxLat: 46.92, minLon: -121.83, maxLon: -121.65 }, zoom: 11 },
  { id: 'etna', name: '에트나 산', blurb: '활성 화산, 시칠리아, 이탈리아',
    bbox: { minLat: 37.68, maxLat: 37.82, minLon: 14.93, maxLon: 15.07 }, zoom: 11 },
];

export function getLocation(id) {
  return CURATED_LOCATIONS.find((l) => l.id === id) || null;
}

// --- Custom area picker ------------------------------------------------------
// Slider bounds for the free lat/lon picker. Terrarium tiles exist for z 0..15;
// ±85 keeps the box inside the Web-Mercator projection domain (±85.051°).
export const CUSTOM_AREA_LIMITS = {
  lat: { min: -85, max: 85, step: 0.01 },
  lon: { min: -180, max: 180, step: 0.01 },
  sizeKm: { min: 4, max: 160, step: 1 },
  zoom: { min: 6, max: 15, step: 1 },
};

const MERCATOR_LAT_MAX = 85.051;
const clampRange = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Matches decimal degrees or DMS: 46.07621°N | 43° 20' 39.239" N
const COORD_TOKEN_RE = /([+-]?)(\d+(?:\.\d+)?)\s*(?:°|deg)?(?:\s*(\d+(?:\.\d+)?)\s*['′])?(?:\s*(\d+(?:\.\d+)?)\s*["″])?\s*([NnSsEeWw])?/g;

function normalizeCoordText(text) {
  return String(text)
    .trim()
    .replace(/\u00b0/g, '°')
    .replace(/[′ʼ]/g, "'")
    .replace(/[″ʺ]/g, '"');
}

function applyHemisphere(deg, hemi) {
  if (!hemi) return deg;
  const h = hemi.toUpperCase();
  if (h === 'S' || h === 'W') return -Math.abs(deg);
  if (h === 'N' || h === 'E') return Math.abs(deg);
  return deg;
}

function hemiOk(hemi, kind) {
  if (!hemi) return true;
  const h = hemi.toUpperCase();
  if (kind === 'lat') return h === 'N' || h === 'S';
  return h === 'E' || h === 'W';
}

function parseCoordToken(match, kind) {
  const sign = match[1] || '';
  const deg = parseFloat(`${sign}${match[2]}`);
  const min = match[3] != null ? parseFloat(match[3]) : 0;
  const sec = match[4] != null ? parseFloat(match[4]) : 0;
  const hemi = match[5] || null;
  if (![deg, min, sec].every(Number.isFinite)) return null;
  if (!hemiOk(hemi, kind)) return null;
  if (min < 0 || min >= 60 || sec < 0 || sec >= 60) return null;
  const absDeg = Math.abs(deg) + min / 60 + sec / 3600;
  const signed = deg < 0 || sign === '-' ? -absDeg : absDeg;
  return applyHemisphere(signed, hemi);
}

/**
 * Parse pasted or typed coordinates into decimal { lat, lon }.
 * Accepts "46.07621°N, 6.96224°E", "37.21160°N, 112.98409°W",
 * DMS like 43° 20' 39.239" N 3° 12' 56.862" E, and signed decimals.
 */
export function parseCoordinateInput(text) {
  if (text == null) return null;
  const s = normalizeCoordText(text);
  if (!s) return null;

  const tokens = [...s.matchAll(COORD_TOKEN_RE)].filter((m) => m[0].trim().length > 0);
  if (tokens.length !== 2) return null;

  // Reject leftover junk between/around the two coordinate tokens.
  const rebuilt = tokens.map((t) => t[0]).join('').replace(/[\s,;\t]+/g, '');
  const stripped = s.replace(/[\s,;\t]+/g, '');
  if (rebuilt !== stripped) return null;

  const lat = parseCoordToken(tokens[0], 'lat');
  const lon = parseCoordToken(tokens[1], 'lon');
  if (lat == null || lon == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** Format decimal degrees for the custom-area coordinate field. */
export function formatCoordinateDisplay({ lat, lon }) {
  const latH = lat >= 0 ? 'N' : 'S';
  const lonH = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latH}, ${Math.abs(lon).toFixed(5)}°${lonH}`;
}

/**
 * Build a location object (same shape as CURATED_LOCATIONS entries) from a
 * centre + size + requested zoom. Every input is clamped to CUSTOM_AREA_LIMITS
 * and the bbox to the Mercator domain, so no combination of slider values can
 * produce an out-of-bounds or non-loading request.
 */
export function makeCustomLocation({ lat, lon, sizeKm, zoom }) {
  const lim = CUSTOM_AREA_LIMITS;
  const cLat = clampRange(+lat || 0, lim.lat.min, lim.lat.max);
  const cLon = clampRange(+lon || 0, lim.lon.min, lim.lon.max);
  const km = clampRange(+sizeKm || lim.sizeKm.min, lim.sizeKm.min, lim.sizeKm.max);
  // degrees per km: latitude is constant, longitude shrinks with cos(lat)
  const halfLat = (km / 2) / 110.574;
  const halfLon = (km / 2) / (111.32 * Math.max(Math.cos((cLat * Math.PI) / 180), 0.05));
  return {
    id: 'custom',
    name: `Custom ${cLat.toFixed(2)}°, ${cLon.toFixed(2)}°`,
    blurb: `${Math.round(km)} km area`,
    bbox: {
      minLat: Math.max(cLat - halfLat, -MERCATOR_LAT_MAX),
      maxLat: Math.min(cLat + halfLat, MERCATOR_LAT_MAX),
      minLon: Math.max(cLon - halfLon, -180),
      maxLon: Math.min(cLon + halfLon, 180),
    },
    zoom: Math.round(clampRange(+zoom || lim.zoom.min, lim.zoom.min, lim.zoom.max)),
  };
}

/**
 * What a custom request will ACTUALLY fetch — effective zoom after the
 * per-axis tile cap, tile count, output resolution and ground resolution.
 * The UI shows this live so the picker never promises impossible values.
 */
export function describeCustomArea(spec) {
  const loc = makeCustomLocation(spec);
  const z = pickZoom(loc);
  const fx0 = lonToTileX(loc.bbox.minLon, z);
  const fx1 = lonToTileX(loc.bbox.maxLon, z);
  const fy0 = latToTileY(loc.bbox.maxLat, z);
  const fy1 = latToTileY(loc.bbox.minLat, z);
  const tilesX = Math.floor(fx1) - Math.floor(fx0) + 1;
  const tilesY = Math.floor(fy1) - Math.floor(fy0) + 1;
  const outW = Math.max(1, Math.round((fx1 - fx0) * TILE));
  const outH = Math.max(1, Math.round((fy1 - fy0) * TILE));
  const centerLat = (loc.bbox.minLat + loc.bbox.maxLat) / 2;
  // Web-Mercator ground resolution: earth circumference * cos(lat) / (256 * 2^z)
  const metersPerPixel = (40075016.686 * Math.cos((centerLat * Math.PI) / 180)) / (TILE * Math.pow(2, z));
  return { loc, zoom: z, zoomClamped: z < loc.zoom, tilesX, tilesY, outW, outH, metersPerPixel };
}

// --- Web-Mercator slippy-tile math (fractional tile coordinates) ---
function lonToTileX(lon, z) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat, z) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * Math.pow(2, z);
}

// Choose the highest zoom whose tile span still fits under the per-axis cap.
function pickZoom(loc) {
  for (let z = loc.zoom; z > 0; z--) {
    const nx = Math.floor(lonToTileX(loc.bbox.maxLon, z)) - Math.floor(lonToTileX(loc.bbox.minLon, z)) + 1;
    const ny = Math.floor(latToTileY(loc.bbox.minLat, z)) - Math.floor(latToTileY(loc.bbox.maxLat, z)) + 1;
    if (nx <= MAX_TILES_PER_AXIS && ny <= MAX_TILES_PER_AXIS) return z;
  }
  return 1;
}

function loadTile(url, signal) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);             // tolerate a missing tile
    if (signal) signal.addEventListener('abort', () => { img.src = ''; resolve(null); }, { once: true });
    img.src = url;
  });
}

function elevationTileUrl(z, x, y) {
  return `${ENDPOINT}/${z}/${wrapTileX(x, z)}/${y}.png`;
}

/**
 * Stitch + crop slippy tiles covering a lat/lon bbox at a fixed zoom.
 * @returns {Promise<{imageData:ImageData,width:number,height:number,ok:number}>}
 */
async function fetchBboxStitched(bbox, z, tileUrl, missingFill, { onProgress, signal } = {}) {
  const fx0 = lonToTileX(bbox.minLon, z);
  const fx1 = lonToTileX(bbox.maxLon, z);
  const fy0 = latToTileY(bbox.maxLat, z);   // north edge → smaller tile-Y
  const fy1 = latToTileY(bbox.minLat, z);   // south edge → larger tile-Y
  const tx0 = Math.floor(fx0), tx1 = Math.floor(fx1);
  const ty0 = Math.floor(fy0), ty1 = Math.floor(fy1);
  const nx = tx1 - tx0 + 1, ny = ty1 - ty0 + 1;

  const stitch = document.createElement('canvas');
  stitch.width = nx * TILE; stitch.height = ny * TILE;
  const sctx = stitch.getContext('2d', { willReadFrequently: true });

  const total = nx * ny;
  let done = 0, ok = 0;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (signal?.aborted) throw new DOMException('중단됨', '중단 오류');
      const img = await loadTile(tileUrl(z, tx, ty), signal);
      const dx = (tx - tx0) * TILE, dy = (ty - ty0) * TILE;
      if (img) { sctx.drawImage(img, dx, dy); ok++; }
      else { sctx.fillStyle = missingFill; sctx.fillRect(dx, dy, TILE, TILE); }
      done++; onProgress?.(done / total);
    }
  }

  const cropX = Math.max(0, Math.round((fx0 - tx0) * TILE));
  const cropY = Math.max(0, Math.round((fy0 - ty0) * TILE));
  const cropW = Math.min(stitch.width - cropX, Math.max(1, Math.round((fx1 - fx0) * TILE)));
  const cropH = Math.min(stitch.height - cropY, Math.max(1, Math.round((fy1 - fy0) * TILE)));
  const imageData = sctx.getImageData(cropX, cropY, cropW, cropH);
  return { imageData, width: imageData.width, height: imageData.height, ok };
}

function makePreview(floatData, W, H, maxSide = 160) {
  const scale = Math.min(1, maxSide / Math.max(W, H));
  const pw = Math.max(1, Math.round(W * scale));
  const ph = Math.max(1, Math.round(H * scale));
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const cx = c.getContext('2d');
  const out = cx.createImageData(pw, ph);
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const sx = Math.min(W - 1, Math.floor(x / scale));
      const sy = Math.min(H - 1, Math.floor(y / scale));
      const b = Math.round(floatData[sy * W + sx] * 255);
      const o = (y * pw + x) * 4;
      out.data[o] = out.data[o + 1] = out.data[o + 2] = b;
      out.data[o + 3] = 255;
    }
  }
  cx.putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}

function makeColorPreview(rgba, W, H, maxSide = 160) {
  const scale = Math.min(1, maxSide / Math.max(W, H));
  const pw = Math.max(1, Math.round(W * scale));
  const ph = Math.max(1, Math.round(H * scale));
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const cx = c.getContext('2d');
  const out = cx.createImageData(pw, ph);
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const sx = Math.min(W - 1, Math.floor(x / scale));
      const sy = Math.min(H - 1, Math.floor(y / scale));
      const si = (sy * W + sx) * 4;
      const o = (y * pw + x) * 4;
      out.data[o] = rgba[si];
      out.data[o + 1] = rgba[si + 1];
      out.data[o + 2] = rgba[si + 2];
      out.data[o + 3] = 255;
    }
  }
  cx.putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}

/** Effective slippy zoom a bbox will be fetched at (after the tile cap). */
export function effectiveZoomFor(loc) { return pickZoom(loc); }

/**
 * Fetch + decode RAW elevations (meters) for a bbox at a FIXED zoom.
 * The core of every real-world load — callers normalize / composite on top.
 * @returns {Promise<{elev:Float32Array,width:number,height:number}>}
 * @throws if every tile failed to load (likely CORS or offline).
 */
export async function fetchBboxElevation(bbox, z, { onProgress, signal } = {}) {
  const { imageData, width: W, height: H, ok } = await fetchBboxStitched(
    bbox, z, elevationTileUrl, SEA_FILL, { onProgress, signal },
  );
  if (ok === 0) {
    throw new Error('No elevation tiles could be loaded (network or CORS blocked).');
  }
  const data = imageData.data;
  const elev = new Float32Array(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    elev[p] = data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
  }
  return { elev, width: W, height: H };
}

/**
 * Fetch geo-aligned RGB imagery for the same bbox/zoom as elevation.
 * @param {ImageryStyleId} [opts.style]
 * @returns {Promise<{rgba:Uint8ClampedArray,width:number,height:number,style:string}>}
 * @throws if every tile failed to load (likely CORS or offline).
 */
export async function fetchBboxImagery(bbox, z, { style, onProgress, signal } = {}) {
  const styleDef = resolveImageryStyle(style);
  const { imageData, width: W, height: H, ok } = await fetchBboxStitched(
    bbox, z, styleDef.tileUrl.bind(styleDef), styleDef.missingFill, { onProgress, signal },
  );
  if (ok === 0) {
    throw new Error(`No ${styleDef.shortLabel} tiles could be loaded (network or CORS blocked).`);
  }
  return {
    rgba: new Uint8ClampedArray(imageData.data),
    width: W,
    height: H,
    style: styleDef.id,
  };
}

/**
 * Fetch + decode the elevation field for a curated location.
 * @returns {Promise<{width:number,height:number,floatData:Float32Array,fileName:string,preview:string,meta:object}>}
 * @throws if every tile failed to load (likely CORS or offline).
 */
export async function fetchLocationHeightmap(loc, { onProgress, signal } = {}) {
  const z = pickZoom(loc);
  const { elev, width: W, height: H } = await fetchBboxElevation(loc.bbox, z, { onProgress, signal });

  let minE = Infinity, maxE = -Infinity;
  for (let p = 0; p < elev.length; p++) {
    if (elev[p] < minE) minE = elev[p];
    if (elev[p] > maxE) maxE = elev[p];
  }
  // Normalize to 0..1 for the import texture; real elevation range is in meta.
  const span = maxE > minE ? maxE - minE : 1;
  const floatData = new Float32Array(elev.length);
  for (let p = 0; p < elev.length; p++) floatData[p] = (elev[p] - minE) / span;

  return {
    width: W,
    height: H,
    floatData,
    elev,
    zoom: z,
    fileName: `${loc.name} (real-world)`,
    preview: makePreview(floatData, W, H),
    meta: { name: loc.name, zoom: z, minElev: minE, maxElev: maxE, source: ELEVATION_SOURCE },
  };
}

// --- Neighbor-tile geography -------------------------------------------------
// A real-world import remembers its geo reference (anchor bbox mapped onto
// board cell (0,0) + the fetch zoom + per-cell elevation patches). Expanding
// the tile assembly then loads the geographically ADJACENT area for each new
// cell instead of stretching the anchor heightmap.

/** Bbox of board cell (cx, cz) given the anchor bbox on cell (0,0).
 *  World +X = east (+lon); world +Z = south (-lat, texture row 0 is north). */
export function offsetBbox(bbox, cx, cz) {
  const lonSpan = bbox.maxLon - bbox.minLon;
  const latSpan = bbox.maxLat - bbox.minLat;
  return {
    minLon: bbox.minLon + cx * lonSpan,
    maxLon: bbox.maxLon + cx * lonSpan,
    minLat: bbox.minLat - cz * latSpan,
    maxLat: bbox.maxLat - cz * latSpan,
  };
}

// Bilinear sample of a raw patch at normalized (u, v); v 0 = north (row 0).
function samplePatch(patch, u, v) {
  const { elev, width: w, height: h } = patch;
  const x = Math.min(Math.max(u, 0), 1) * (w - 1);
  const y = Math.min(Math.max(v, 0), 1) * (h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0, fy = y - y0;
  const a = elev[y0 * w + x0] + (elev[y0 * w + x1] - elev[y0 * w + x0]) * fx;
  const b = elev[y1 * w + x0] + (elev[y1 * w + x1] - elev[y1 * w + x0]) * fx;
  return a + (b - a) * fy;
}

/**
 * Composite the cached per-cell elevation patches into one normalized union
 * heightmap covering the tile-assembly bounding rect. Cells without a patch
 * (holes in an L-shaped assembly) fill with the union minimum — they carry no
 * terrain chunks, so the value only pads the texture.
 *
 * @param cells  object keyed 'cx,cz' → { elev, width, height } (raw meters)
 * @param tiles  occupied board cells [{cx, cz}, …]
 * @returns {{floatData, width, height, minElev, maxElev, preview, bounds}}
 */
export function compositeCellPatches(cells, tiles, { maxSide = 4096 } = {}) {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const t of tiles) {
    if (t.cx < minX) minX = t.cx;
    if (t.cz < minZ) minZ = t.cz;
    if (t.cx > maxX) maxX = t.cx;
    if (t.cz > maxZ) maxZ = t.cz;
  }
  if (!tiles.length) { minX = minZ = maxX = maxZ = 0; }
  const cols = maxX - minX + 1, rows = maxZ - minZ + 1;

  const anchor = cells['0,0'] ?? Object.values(cells)[0];
  if (!anchor) throw new Error('합성할 고도 패치가 없습니다.');
  // Per-cell output resolution: anchor resolution, downscaled so the union
  // texture never exceeds maxSide per axis (matches the image-import cap).
  const scale = Math.min(1, maxSide / (cols * anchor.width), maxSide / (rows * anchor.height));
  const cw = Math.max(1, Math.round(anchor.width * scale));
  const ch = Math.max(1, Math.round(anchor.height * scale));
  const W = cols * cw, H = rows * ch;

  let minE = Infinity, maxE = -Infinity;
  for (const t of tiles) {
    const patch = cells[`${t.cx},${t.cz}`];
    if (!patch) continue;
    for (let p = 0; p < patch.elev.length; p++) {
      const e = patch.elev[p];
      if (e < minE) minE = e;
      if (e > maxE) maxE = e;
    }
  }
  if (!Number.isFinite(minE)) { minE = 0; maxE = 1; }
  const span = maxE > minE ? maxE - minE : 1;

  const floatData = new Float32Array(W * H);   // holes default to 0 = union minimum
  for (const t of tiles) {
    const patch = cells[`${t.cx},${t.cz}`];
    if (!patch) continue;
    const ox = (t.cx - minX) * cw, oy = (t.cz - minZ) * ch;
    for (let y = 0; y < ch; y++) {
      const v = ch > 1 ? y / (ch - 1) : 0;
      const row = (oy + y) * W + ox;
      for (let x = 0; x < cw; x++) {
        const u = cw > 1 ? x / (cw - 1) : 0;
        floatData[row + x] = (samplePatch(patch, u, v) - minE) / span;
      }
    }
  }

  return {
    floatData,
    width: W,
    height: H,
    minElev: minE,
    maxElev: maxE,
    preview: makePreview(floatData, W, H),
    bounds: { minX, minZ, maxX, maxZ, cols, rows },
  };
}

// Bilinear sample of an RGBA patch at normalized (u, v); v 0 = north (row 0).
function sampleColorPatch(patch, u, v, out, oi) {
  const { rgba, width: w, height: h } = patch;
  const x = Math.min(Math.max(u, 0), 1) * (w - 1);
  const y = Math.min(Math.max(v, 0), 1) * (h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0, fy = y - y0;
  const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4;
  const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4;
  for (let c = 0; c < 3; c++) {
    const a = rgba[i00 + c] + (rgba[i10 + c] - rgba[i00 + c]) * fx;
    const b = rgba[i01 + c] + (rgba[i11 + c] - rgba[i01 + c]) * fx;
    out[oi + c] = Math.round(a + (b - a) * fy);
  }
  out[oi + 3] = 255;
}

/**
 * Composite per-cell OpenTopoMap RGB patches into one imagery atlas covering
 * the tile-assembly bounding rect (same layout as compositeCellPatches).
 *
 * @param cells  object keyed 'cx,cz' → { rgba, width, height }
 * @param tiles  occupied board cells [{cx, cz}, …]
 */
export function compositeCellImagery(cells, tiles, { maxSide = 4096 } = {}) {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const t of tiles) {
    if (t.cx < minX) minX = t.cx;
    if (t.cz < minZ) minZ = t.cz;
    if (t.cx > maxX) maxX = t.cx;
    if (t.cz > maxZ) maxZ = t.cz;
  }
  if (!tiles.length) { minX = minZ = maxX = maxZ = 0; }
  const cols = maxX - minX + 1, rows = maxZ - minZ + 1;

  const anchor = cells['0,0'] ?? Object.values(cells)[0];
  if (!anchor) throw new Error('합성할 이미지 패치가 없습니다.');
  const scale = Math.min(1, maxSide / (cols * anchor.width), maxSide / (rows * anchor.height));
  const cw = Math.max(1, Math.round(anchor.width * scale));
  const ch = Math.max(1, Math.round(anchor.height * scale));
  const W = cols * cw, H = rows * ch;

  const rgba = new Uint8ClampedArray(W * H * 4);
  // Uncovered cells stay light grey so gaps read as empty rather than black.
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 216; rgba[i + 1] = 216; rgba[i + 2] = 216; rgba[i + 3] = 255;
  }

  for (const t of tiles) {
    const patch = cells[`${t.cx},${t.cz}`];
    if (!patch) continue;
    const ox = (t.cx - minX) * cw, oy = (t.cz - minZ) * ch;
    for (let y = 0; y < ch; y++) {
      const v = ch > 1 ? y / (ch - 1) : 0;
      for (let x = 0; x < cw; x++) {
        const u = cw > 1 ? x / (cw - 1) : 0;
        sampleColorPatch(patch, u, v, rgba, ((oy + y) * W + ox + x) * 4);
      }
    }
  }

  return {
    rgba,
    width: W,
    height: H,
    preview: makeColorPreview(rgba, W, H),
    bounds: { minX, minZ, maxX, maxZ, cols, rows },
  };
}
