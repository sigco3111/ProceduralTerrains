import{bz as De,cA as zt,ae as pe,ak as ne,by as Me,bB as fe,bo as ct,cB as _t,p as Tt,bj as Oe,f as Ft,cC as W,c8 as Pt,cD as Et,a2 as Bt,cE as Wt,cF as He,cG as It,bi as Ot}from"./index-BodXcjOD.js";import{i as Y,V as I,h as J,a5 as ut,k as Ae,M as Ge,d as Ht,l as Gt,m as Nt,U as Ut,S as $t,a as jt,aq as qt,L as Xt,a1 as Zt,aa as ue,n as Vt,G as Kt,q as dt,a0 as ge,I as Qt,r as Yt,g as Jt,j as mt}from"./three-DQ4dZCk9.js";const ea=`
// value noise plus analytic derivatives. The .x channel intentionally matches
// vnoise(p): same hash corners, same quintic interpolant, same mix order.
vec3 vnoised2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f - 1.0) * (f - 1.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float top = mix(a, b, u.x);
  float bot = mix(c, d, u.x);
  float value = mix(top, bot, u.y);
  vec2 deriv = vec2(
    mix(b - a, d - c, u.y) * du.x,
    (bot - top) * du.y
  );
  return vec3(value, deriv);
}

// value noise with selectable interpolation (0 linear, 1 smooth, 2 quintic)
float valueNoise2(vec2 p, int mode) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = mode == 0 ? f
         : mode == 1 ? f * f * (3.0 - 2.0 * f)
         : f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// blocky white noise, optionally smoothed toward value noise
float whiteNoise2(vec2 p, float smoothAmt) {
  float blocky = hash12(floor(p) + 0.5);
  return mix(blocky, vnoise(p), clamp(smoothAmt, 0.0, 1.0));
}

// Voronoi / cellular. dmode: 0 euclidean, 1 manhattan, 2 chebyshev.
// omode: 0 cell value, 1 dist-to-center(F1), 2 dist-to-edge(F2-F1), 3 edge lines.
float voronoi2(vec2 p, float jitter, int dmode, int omode) {
  vec2 ip = floor(p), fp = fract(p);
  float f1 = 8.0, f2 = 8.0;
  float cellRnd = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash12(ip + g), hash12(ip + g + vec2(41.3, 13.7)));
      vec2 r = g + o * jitter - fp;
      float d = dmode == 0 ? dot(r, r)
              : dmode == 1 ? abs(r.x) + abs(r.y)
              : max(abs(r.x), abs(r.y));
      if (d < f1) { f2 = f1; f1 = d; cellRnd = hash12(ip + g + vec2(7.1, 91.7)); }
      else if (d < f2) { f2 = d; }
    }
  }
  float d1 = dmode == 0 ? sqrt(f1) : f1;
  float d2 = dmode == 0 ? sqrt(f2) : f2;
  if (omode == 0) return clamp(cellRnd, 0.0, 1.0);
  if (omode == 1) return clamp(d1, 0.0, 1.0);
  if (omode == 2) return clamp(d2 - d1, 0.0, 1.0);
  return clamp(1.0 - (d2 - d1) * 3.0, 0.0, 1.0);
}

// Impact craters: depressed bowl + raised rim, distributed one-per-cell, gated
// by density. Returns a signed value (~ -depth .. +rim), centered near 0.
float crater2(vec2 p, float density, float depth, float rim, float rimWidth) {
  vec2 ip = floor(p), fp = fract(p);
  float best = 8.0, rnd = 0.0, rad = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash12(ip + g), hash12(ip + g + vec2(23.7, 5.9)));
      float d = length(g + o - fp);
      if (d < best) { best = d; rnd = hash12(ip + g + vec2(61.1, 7.3)); }
    }
  }
  if (rnd > density) return 0.0;
  float radius = mix(0.18, 0.46, hash12(ip + vec2(rnd * 17.0)));
  float t = best / max(radius, 0.02);
  float bowl = -depth * (1.0 - smoothstep(0.0, 1.0, t));
  float rimv = rim * exp(-pow((t - 1.0) / max(rimWidth, 0.02), 2.0));
  return bowl + rimv;
}

// Wind-shaped dunes: ridges perpendicular to wind direction + fine ripples.
float dune2(vec2 p, float windDir, float sharp, float rippleScale, float rippleStr) {
  vec2 dir = vec2(cos(windDir), sin(windDir));
  float across = dot(p, vec2(-dir.y, dir.x));
  float along = dot(p, dir);
  float warp = (vnoise(p * 0.5) - 0.5) * 2.0;
  float dunes = 1.0 - abs(sin(across + warp));
  dunes = pow(clamp(dunes, 0.0, 1.0), max(sharp, 0.1));
  float ripples = (vnoise(vec2(across * rippleScale, along * 0.3)) - 0.5) * rippleStr;
  return clamp(dunes + ripples, 0.0, 1.0);
}

// Flow / river channels: gaussian valley along a meandering direction.
// Returns the channel mask 0..1 (1 inside the channel) — pair with subtract/carve.
float flow2(vec2 p, float flowDir, float width, float meander, float meanderScale) {
  vec2 dir = vec2(cos(flowDir), sin(flowDir));
  float across = dot(p, vec2(-dir.y, dir.x));
  float along = dot(p, dir);
  across += (vnoise(vec2(along * meanderScale, 13.1)) - 0.5) * meander;
  return clamp(exp(-pow(across / max(width, 0.02), 2.0)), 0.0, 1.0);
}
`,ho=`
vec4 vnoised3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec3 du = 30.0 * f * f * (f - 1.0) * (f - 1.0);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  float x00 = mix(n000, n100, u.x);
  float x10 = mix(n010, n110, u.x);
  float x01 = mix(n001, n101, u.x);
  float x11 = mix(n011, n111, u.x);
  float y0 = mix(x00, x10, u.y);
  float y1 = mix(x01, x11, u.y);
  float value = mix(y0, y1, u.z);
  vec3 deriv = vec3(
    mix(mix(n100 - n000, n110 - n010, u.y), mix(n101 - n001, n111 - n011, u.y), u.z) * du.x,
    mix(x10 - x00, x11 - x01, u.z) * du.y,
    (y1 - y0) * du.z
  );
  return vec4(value, deriv);
}

float valueNoise3(vec3 p, int mode) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = mode == 0 ? f
         : mode == 1 ? f * f * (3.0 - 2.0 * f)
         : f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}

float whiteNoise3(vec3 p, float smoothAmt) {
  float blocky = hash13(floor(p) + 0.5);
  return mix(blocky, vnoise3(p), clamp(smoothAmt, 0.0, 1.0));
}

float voronoi3(vec3 p, float jitter, int dmode, int omode) {
  vec3 ip = floor(p), fp = fract(p);
  float f1 = 8.0, f2 = 8.0, cellRnd = 0.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 o = vec3(hash13(ip + g), hash13(ip + g + vec3(41.3, 13.7, 7.1)),
                      hash13(ip + g + vec3(9.2, 57.1, 33.3)));
        vec3 r = g + o * jitter - fp;
        float d = dmode == 0 ? dot(r, r)
                : dmode == 1 ? abs(r.x) + abs(r.y) + abs(r.z)
                : max(max(abs(r.x), abs(r.y)), abs(r.z));
        if (d < f1) { f2 = f1; f1 = d; cellRnd = hash13(ip + g + vec3(7.1, 91.7, 3.3)); }
        else if (d < f2) { f2 = d; }
      }
    }
  }
  float d1 = dmode == 0 ? sqrt(f1) : f1;
  float d2 = dmode == 0 ? sqrt(f2) : f2;
  if (omode == 0) return clamp(cellRnd, 0.0, 1.0);
  if (omode == 1) return clamp(d1, 0.0, 1.0);
  if (omode == 2) return clamp(d2 - d1, 0.0, 1.0);
  return clamp(1.0 - (d2 - d1) * 3.0, 0.0, 1.0);
}

float crater3(vec3 p, float density, float depth, float rim, float rimWidth) {
  vec3 ip = floor(p), fp = fract(p);
  float best = 8.0, rnd = 0.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 o = vec3(hash13(ip + g), hash13(ip + g + vec3(23.7, 5.9, 11.1)),
                      hash13(ip + g + vec3(3.1, 47.7, 91.2)));
        float d = length(g + o - fp);
        if (d < best) { best = d; rnd = hash13(ip + g + vec3(61.1, 7.3, 19.9)); }
      }
    }
  }
  if (rnd > density) return 0.0;
  float radius = mix(0.18, 0.46, hash13(ip + vec3(rnd * 17.0)));
  float t = best / max(radius, 0.02);
  float bowl = -depth * (1.0 - smoothstep(0.0, 1.0, t));
  float rimv = rim * exp(-pow((t - 1.0) / max(rimWidth, 0.02), 2.0));
  return bowl + rimv;
}

// 3D dunes/flow operate in the noise domain directly (seamless on the sphere).
float dune3(vec3 p, float windDir, float sharp, float rippleScale, float rippleStr) {
  vec3 dir = normalize(vec3(cos(windDir), 0.3, sin(windDir)));
  float across = dot(p, normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + 1e-4));
  float warp = (vnoise3(p * 0.5) - 0.5) * 2.0;
  float dunes = pow(clamp(1.0 - abs(sin(across + warp)), 0.0, 1.0), max(sharp, 0.1));
  float ripples = (vnoise3(p * rippleScale) - 0.5) * rippleStr;
  return clamp(dunes + ripples, 0.0, 1.0);
}

float flow3(vec3 p, float flowDir, float width, float meander, float meanderScale) {
  vec3 dir = normalize(vec3(cos(flowDir), 0.2, sin(flowDir)));
  vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + 1e-4);
  float across = dot(p, side) + (vnoise3(p * meanderScale) - 0.5) * meander;
  return clamp(exp(-pow(across / max(width, 0.02), 2.0)), 0.0, 1.0);
}
`,po=[{id:"height",label:"Height"},{id:"noise",label:"Noise"},{id:"slope",label:"Slope"},{id:"biome",label:"Biome",soon:!0}];function go(t){switch(t){case"height":return{type:t,enabled:!0,invert:!1,params:{min:0,max:1.35,falloff:.06}};case"noise":return{type:t,enabled:!0,invert:!1,params:{scale:1,threshold:.5,softness:.12}};case"slope":return{type:t,enabled:!0,invert:!1,params:{min:0,max:1,falloff:.1}};case"biome":return{type:t,enabled:!0,invert:!1,params:{biome:0}};default:return{type:t,enabled:!0,invert:!1,params:{}}}}const ta=`
float maskHeight(float h, vec4 a) {
  float lo = smoothstep(a.x - a.z, a.x + a.z, h);
  float hi = smoothstep(a.y + a.z, a.y - a.z, h);
  float mm = clamp(lo * hi, 0.0, 1.0);
  if (a.w >= 0.5) mm = 1.0 - mm;
  return mm;
}
float maskNoise2(vec2 pw, vec4 b) {
  float n = vnoise(pw * b.x + vec2(53.2, 11.7));
  float mm = smoothstep(b.y - b.z, b.y + b.z, n);
  if (b.w >= 0.5) mm = 1.0 - mm;
  return mm;
}
float stackSlope(float h, float hDX, float hDZ) {
  return length(vec2(hDX - h, hDZ - h)) * max(uAmplitude, 0.0) * max(uHeightScale, 1.0) / 8.0;
}
float maskSlope(float slope, vec4 c) {
  float lo = smoothstep(c.x - c.z, c.x + c.z, slope);
  float hi = smoothstep(c.y + c.z, c.y - c.z, slope);
  float mm = clamp(lo * hi, 0.0, 1.0);
  if (c.w >= 0.5) mm = 1.0 - mm;
  return mm;
}
`,vo=`
float maskNoise3(vec3 pw, vec4 b) {
  float n = vnoise3(pw * b.x + vec3(53.2, 11.7, 31.3));
  float mm = smoothstep(b.y - b.z, b.y + b.z, n);
  if (b.w >= 0.5) mm = 1.0 - mm;
  return mm;
}
`;function ft(t,e,o,a="0.0"){const r=(t.masks||[]).filter(i=>i.enabled!==!1);if(r.length===0)return"1.0";const n=[];return r.some(i=>i.type==="height")&&n.push(`maskHeight(h, uLayerMaskA[${e}])`),r.some(i=>i.type==="noise")&&n.push(o?`maskNoise3(pw, uLayerMaskB[${e}])`:`maskNoise2(pw, uLayerMaskB[${e}])`),!o&&r.some(i=>i.type==="slope")&&n.push(`maskSlope(${a}, uLayerMaskC[${e}])`),n.length?`clamp(${n.join(" * ")}, 0.0, 1.0)`:"1.0"}function Ee(t,e){const o=(t.masks||[]).filter(i=>i.enabled!==!1);if(o.length===0)return 1;let a=1;const r=o.find(i=>i.type==="height");if(r){const{min:i=0,max:l=1.35,falloff:s=.06}=r.params,c=ve(i-s,i+s,e.h),u=ve(l+s,l-s,e.h);let d=Ne(c*u);r.invert&&(d=1-d),a*=d}const n=o.find(i=>i.type==="slope");if(n&&Number.isFinite(e.slope)){const{min:i=0,max:l=1,falloff:s=.1}=n.params,c=ve(i-s,i+s,e.slope),u=ve(l+s,l-s,e.slope);let d=Ne(c*u);n.invert&&(d=1-d),a*=d}return a}function ve(t,e,o){const a=Math.max(0,Math.min(1,(o-t)/(e-t)));return a*a*(3-2*a)}function Ne(t){return t<0?0:t>1?1:t}const aa=`
uniform vec2  uSeedOffset;     // deterministic domain offset derived from seed
uniform float uFrequency;      // base noise frequency (1/world units)
uniform float uHeightScale;    // world-space height of h01 == 1.0
uniform float uSeaLevel;       // world-space water height
uniform float uTerrainFormationSeaLevel; // frozen wetland-generation baseline
uniform float uAmplitude;      // overall noise strength multiplier
uniform float uStackNormalize; // 0 = legacy clamp, 1 = remap by output min/max
uniform float uStackOutMin;    // raw stack height mapped to 0 when normalized
uniform float uStackOutMax;    // raw stack height mapped to 1 when normalized
uniform float uTerrainSmoothing; // spatial low-pass blend for rounded hills
uniform float uPersistence;    // FBM gain
uniform float uLacunarity;     // FBM frequency multiplier
uniform float uRidge;          // ridged-mountain intensity
uniform float uWarp;           // domain warp strength
uniform float uFalloff;        // edge falloff width (0..1)
uniform float uEdgeFalloffMode; // 0 island, 1 mountains
uniform float uInfiniteMode;   // 0 = bounded Tile terrain, 1 = streamed Infinite terrain
uniform float uBoardHalf;      // half board size in world units
uniform float uChunkSize;      // internal chunk size in world units
uniform vec3  uSunDir;         // normalized, pointing FROM surface TO sun
uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform float uPaintEnabled;
uniform float uPaintOpacity;
uniform float uPaintBoardSize;
uniform float uPaintResolution;
uniform float uPaintBaseMult; // scales ONLY the procedural base term in heightAt() (0 = Empty Terrain)
uniform sampler2D uPaintHeightTexture;
uniform sampler2D uPaintBiomeTexture;
uniform sampler2D uPaintPropsTexture;
uniform float uManualSurfaceMode;
uniform float uManualBaseGenerated;
uniform vec2 uManualSurfaceOrigin;
uniform vec2 uManualSurfaceSpan;
uniform sampler2D uManualSurfaceTextureA;
uniform sampler2D uManualSurfaceTextureB;
uniform float uManualEnabled;
uniform vec2 uManualOrigin;
uniform vec2 uManualSpan;
uniform sampler2D uManualHeightTexture;
uniform float uSplineEnabled;
uniform float uSplineResolution;
uniform vec2 uSplineOrigin;
uniform vec2 uSplineSpan;
uniform sampler2D uSplineHeightTexture;
uniform sampler2D uSplineMaskTexture;
uniform sampler2D uSplineAuxTexture;

// --- Noise Stack: per-layer continuous params (declared once, used by the
// codegen-injected stackHeight2D / stackHeight3D). MUST match MAX_LAYERS in
// src/engine/terrain/noise/NoiseStack.js.
#define MAX_NOISE_LAYERS 12
uniform float uLayerStrength[MAX_NOISE_LAYERS]; // strength * opacity (and solo gate)
uniform float uLayerScale[MAX_NOISE_LAYERS];    // primary frequency lane
uniform float uLayerSeed[MAX_NOISE_LAYERS];     // per-layer domain decorrelation
uniform vec4  uLayerParamsA[MAX_NOISE_LAYERS];  // type-specific continuous lanes
uniform vec4  uLayerParamsB[MAX_NOISE_LAYERS];
uniform vec4  uLayerMaskA[MAX_NOISE_LAYERS];    // height mask (min,max,falloff,flags)
uniform vec4  uLayerMaskB[MAX_NOISE_LAYERS];    // noise mask (scale,threshold,soft,invert)
uniform vec4  uLayerMaskC[MAX_NOISE_LAYERS];    // slope mask (min,max,falloff,invert)
uniform float uNoiseDebug;                      // debug view selector (0 = off)
uniform float uTileDebugView;                   // 0 off, 1 noise, 2 height, 3 biome
uniform sampler2D uImportNoiseTex;
uniform sampler2D uImportHeightTex;
uniform sampler2D uImportBiomeTex;
uniform sampler2D uImportImageryTex;
uniform float uImportNoiseMode;                 // 0 disabled/preview, 2 replace, 3 blend
uniform float uImportHeightMode;
uniform float uImportBiomeMode;
uniform float uImportImageryMode;
uniform float uImportNoiseBlend;
uniform float uImportHeightBlend;
uniform float uImportHeightStrength;
uniform float uImportHeightOffset;
uniform float uImportBiomeBlend;
uniform float uImportImageryBlend;

// Studio height bake region (world XZ). Single cell: origin=(-half,-half), span=boardSize.
uniform vec2 uBakeOrigin;
uniform vec2 uBakeSpan;

// Erosion height-offset field (studio / tile mode). The terrain height is fully
// analytic — there is no stored heightmap to carve — so erosion is expressed as
// an additive, world-space SIGNED height delta (eroded - base) over the bake
// region, sampled in heightAt() exactly like the paint offset. R = delta in
// world units. uErosionEnabled == 0 makes it a free no-op everywhere.
uniform sampler2D uErosionOffsetTex;
uniform float uErosionEnabled;

vec2 tileUvAt(vec2 xz) { return xz / (2.0 * uBoardHalf) + vec2(0.5); }
// World rect the imported HEIGHT map covers: (originX, originZ, spanX, spanZ).
// Defaults to the single origin cell (== tileUvAt) so plain image imports are
// unchanged; real-world imports widen it to the tile-assembly union so each
// cell shows its own geography instead of a clamped edge stretch.
uniform vec4 uImportHeightRegion;
vec2 importHeightUvAt(vec2 xz) { return (xz - uImportHeightRegion.xy) / uImportHeightRegion.zw; }
float importedMapValue(sampler2D tex, vec2 uv) {
  vec3 c = texture2D(tex, clamp(uv, 0.0, 1.0)).rgb;
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// --- Tile mode (multi-cell studio assembly) ---------------------------------
// When uUseTiles > 0.5 the studio board is a grid of square cells. A small
// occupancy texture (1 = occupied) drives an edge falloff that fades ONLY at
// the assembly's outer rim, so neighbouring cells meet seamlessly. A single
// tile is handled by the legacy origin-centred path (uUseTiles stays 0), which
// keeps that case byte-identical to before.
uniform sampler2D uTileOccupancy;   // R8, uTileGridDim cells, 1 = occupied
uniform vec2  uTileGridOrigin;      // world XZ of the min-cell corner (cell 0,0)
uniform vec2  uTileGridDim;         // grid size in cells (cols, rows)
uniform float uTileCellSize;        // one cell's world size (== single board)
uniform float uUseTiles;            // 0 = legacy single board, 1 = tile assembly
uniform float uTileShape;           // 0 = square, 1 = circle
uniform float uTileDiskRadius;      // world-space disk outer radius

float rimFalloff(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float stackSoftClamp(float h) {
  if (h <= 0.0) return 0.0;
  if (h <= 1.0) return h;
  return min(1.35, 1.0 + 0.35 * (1.0 - exp(-(h - 1.0) / 0.35)));
}

float finalizeStackHeight(float h) {
  if (uStackNormalize < 0.5) return clamp(h, 0.0, 1.35);
  float outMin = uStackOutMin;
  float outMax = max(uStackOutMax, outMin + 0.0001);
  return stackSoftClamp((h - outMin) / (outMax - outMin));
}

// Hard disk clip: 1 inside the rendered disk, 0 outside. Pure visibility mask —
// it does NOT attenuate height, so it never produces a half-height boundary.
float diskMask(vec2 xz) {
  return step(length(xz), uTileDiskRadius);
}

// Inward island attenuation for the disk. 1 well inside the disk, fading to 0
// EXACTLY at the perimeter over a band whose width is uFalloff cell-widths, so
// the whole fade lives inside the boundary. uFalloff == 0 disables it entirely.
float diskIsland(vec2 xz) {
  float band = uFalloff * uTileCellSize;
  if (band <= 0.0) return 1.0;
  float t = clamp((uTileDiskRadius - length(xz)) / band, 0.0, 1.0);
  return rimFalloff(t);
}

float tileOccAt(vec2 cell) {
  if (cell.x < 0.0 || cell.y < 0.0 ||
      cell.x > uTileGridDim.x - 0.5 || cell.y > uTileGridDim.y - 0.5) return 0.0;
  vec2 uv = (cell + 0.5) / uTileGridDim;
  return step(0.5, texture2D(uTileOccupancy, uv).r);
}

// Per-cell, occupancy-aware island falloff. Each side fades toward its edge
// only when the neighbour across that edge is empty; a present neighbour keeps
// the factor at 1 across the shared edge so both cells meet at full height.
float tileFalloff(vec2 xz) {
  if (uFalloff <= 0.0) return 1.0;            // no edge attenuation
  vec2 rel = (xz - uTileGridOrigin) / uTileCellSize;
  vec2 cell = floor(rel);
  vec2 lc = (rel - cell) * 2.0 - 1.0;        // [-1,1] within the cell
  float band = uFalloff;
  float fXp = mix(smoothstep(0.0, band, 1.0 - lc.x), 1.0, tileOccAt(cell + vec2( 1.0, 0.0)));
  float fXn = mix(smoothstep(0.0, band, 1.0 + lc.x), 1.0, tileOccAt(cell + vec2(-1.0, 0.0)));
  float fZp = mix(smoothstep(0.0, band, 1.0 - lc.y), 1.0, tileOccAt(cell + vec2(0.0,  1.0)));
  float fZn = mix(smoothstep(0.0, band, 1.0 + lc.y), 1.0, tileOccAt(cell + vec2(0.0, -1.0)));
  return fXp * fXn * fZp * fZn;
}

// Vertex helper: classify a perimeter (skirt) position. A cell boundary where
// exactly one side is occupied is an OUTER edge -> becomes the diorama wall;
// a boundary between two occupied cells is an interior seam (no wall). Robust
// to the float ambiguity of points sitting exactly on a boundary by testing
// the occupancy of the two cells either side of the nearest grid line.
// Returns (onOuter, outDir.x, outDir.z) with outDir pointing toward empty space.
vec3 tileWall(vec2 xz) {
  vec2 rel = (xz - uTileGridOrigin) / uTileCellSize;
  float e = 2.0 / max(uTileCellSize, 1.0);   // ~1 world unit, in cell units
  float fx = floor(rel.x);
  float fz = floor(rel.y);
  // vertical boundary (constant X) at the nearest grid line
  float nx = floor(rel.x + 0.5);
  float onXB = step(abs(rel.x - nx), e);
  float occXL = tileOccAt(vec2(nx - 1.0, fz));
  float occXR = tileOccAt(vec2(nx, fz));
  float wallX = onXB * abs(occXL - occXR);
  // horizontal boundary (constant Z)
  float nz = floor(rel.y + 0.5);
  float onZB = step(abs(rel.y - nz), e);
  float occZD = tileOccAt(vec2(fx, nz - 1.0));
  float occZU = tileOccAt(vec2(fx, nz));
  float wallZ = onZB * abs(occZD - occZU);
  return vec3(wallX + wallZ, (occXL - occXR) * wallX, (occZD - occZU) * wallZ);
}

// 1 on a cell perimeter between two occupied cells (no wall).
float tileInteriorSeam(vec2 xz) {
  vec3 tw = tileWall(xz);
  if (tw.x > 0.5) return 0.0;
  vec2 rel = (xz - uTileGridOrigin) / uTileCellSize;
  vec2 lc = (rel - floor(rel)) * 2.0 - 1.0;
  float band = 2.0 / max(uTileCellSize, 1.0);
  return step(1.0 - band, max(abs(lc.x), abs(lc.y)));
}


// 1 when the world XZ lies inside an occupied tile cell.
float tileOccupiedAt(vec2 xz) {
  if (uUseTiles < 0.5) return 1.0;
  vec2 rel = (xz - uTileGridOrigin) / uTileCellSize;
  float occ = tileOccAt(floor(rel));
  if (uTileShape > 0.5) occ *= diskMask(xz);
  return occ;
}

// Inward island attenuation for the whole assembly (square per-cell rim or the
// circular disk profile). Clipping/visibility is handled separately by
// tileOccupiedAt / diskMask, so this never causes a half-height boundary.
float assemblyFalloff(vec2 xz) {
  float squareFalloff = tileFalloff(xz);
  float circleFalloff = diskIsland(xz);
  return mix(squareFalloff, circleFalloff, step(0.5, uTileShape));
}
`,bo=`
uniform sampler2D uTerrainHeightTex;
uniform float uUseTerrainHeightTex;   // 1 = sample the baked texture, 0 = live field
vec2 bakedUvAt(vec2 xz) { return (xz - uBakeOrigin) / max(uBakeSpan, vec2(1.0)); }
float bakedHeightAt(vec2 xz) {
  return texture2D(uTerrainHeightTex, bakedUvAt(xz)).a * uHeightScale;
}
`,oa=`
uniform sampler2D uInfiniteFieldTex0;
uniform sampler2D uInfiniteFieldTex1;
uniform sampler2D uInfiniteFieldTex2;
uniform vec2 uInfiniteFieldOrigin0;
uniform vec2 uInfiniteFieldOrigin1;
uniform vec2 uInfiniteFieldOrigin2;
uniform vec2 uInfiniteFieldSpan0;
uniform vec2 uInfiniteFieldSpan1;
uniform vec2 uInfiniteFieldSpan2;
uniform vec3 uInfiniteFieldReady;
uniform float uUseInfiniteFieldCache;

bool infiniteFieldUv(vec2 xz, vec2 origin, vec2 span, out vec2 uv) {
  uv = (xz - origin) / max(span, vec2(1.0));
  return all(greaterThanEqual(uv, vec2(0.001)))
    && all(lessThanEqual(uv, vec2(0.999)));
}

vec4 infiniteFieldSampleAt(vec2 xz, out float available) {
  vec2 uv;
  vec4 field = vec4(0.0);
  available = 0.0;
  if (uUseInfiniteFieldCache > 0.5) {
    if (uInfiniteFieldReady.x > 0.5
        && infiniteFieldUv(xz, uInfiniteFieldOrigin0, uInfiniteFieldSpan0, uv)) {
      available = 1.0;
      field = texture2D(uInfiniteFieldTex0, uv);
    } else if (uInfiniteFieldReady.y > 0.5
        && infiniteFieldUv(xz, uInfiniteFieldOrigin1, uInfiniteFieldSpan1, uv)) {
      available = 1.0;
      field = texture2D(uInfiniteFieldTex1, uv);
    } else if (uInfiniteFieldReady.z > 0.5
        && infiniteFieldUv(xz, uInfiniteFieldOrigin2, uInfiniteFieldSpan2, uv)) {
      available = 1.0;
      field = texture2D(uInfiniteFieldTex2, uv);
    }
  }
  return field;
}

float terrainCachedHeightAt(vec2 xz) {
  float available = 0.0;
  vec4 field = infiniteFieldSampleAt(xz, available);
  return available > 0.5 ? field.r * uHeightScale : heightAt(xz);
}
`,xo=`
uniform sampler2D uTerrainBiomeTex;
uniform float uUseTerrainBiomeTex;

Climate terrainCachedClimateAt(vec2 xz) {
  vec2 p = xz * uFrequency + uSeedOffset;
  float temp = 0.0;
  float moist = 0.0;
  float cont = 0.0;
  float erosion = 0.0;
  float region = 0.0;
  float cached = 0.0;
  if (uInfiniteMode < 0.5 && uUseTerrainBiomeTex > 0.5) {
    vec4 baked = texture2D(uTerrainBiomeTex, bakedUvAt(xz));
    temp = baked.r;
    moist = baked.g;
    cont = baked.b;
    erosion = baked.a;
    region = fbm3(p * 0.700 + vec2(631.4, 199.2));
    cached = 1.0;
  } else if (uInfiniteMode > 0.5) {
    float available = 0.0;
    vec4 field = infiniteFieldSampleAt(xz, available);
    if (available > 0.5) {
      vec2 b = p * uBiomeScale;
      temp = field.g;
      moist = field.b;
      cont = field.a;
      erosion = fbm3(b * 0.190 + vec2(157.1, 423.7));
      region = fbm3(p * 0.700 + vec2(631.4, 199.2));
      cached = 1.0;
    }
  }
  if (cached < 0.5) {
    vec2 b = p * uBiomeScale;
    cont = fbm3(b * 0.085 + vec2(211.3, 57.9));
    temp = clamp(fbm3(b * 0.150 + vec2(71.7, 313.1)) * 1.5 - 0.25 + uTempBias, 0.0, 1.0);
    moist = clamp(fbm3(b * 0.130 * uMoistScale + vec2(91.7, 53.9)) * 1.5 - 0.25 + uMoistBias, 0.0, 1.0);
    erosion = fbm3(b * 0.190 + vec2(157.1, 423.7));
    region = fbm3(p * 0.700 + vec2(631.4, 199.2));
  }
  return Climate(temp, moist, cont, erosion, region);
}
`,ra=`
vec2 manualSurfaceUvAt(vec2 xz) {
  return (xz - uManualSurfaceOrigin) / max(uManualSurfaceSpan, vec2(1.0));
}

vec4 manualSurfaceWeightsAAt(vec2 xz) {
  vec2 uv = manualSurfaceUvAt(xz);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);
  return texture2D(uManualSurfaceTextureA, uv);
}

vec4 manualSurfaceWeightsBAt(vec2 xz) {
  vec2 uv = manualSurfaceUvAt(xz);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);
  return texture2D(uManualSurfaceTextureB, uv);
}
`,yo=`
vec3 applyImportedImageryAlbedo(vec3 baseAlbedo, vec2 xz) {
  if (uInfiniteMode < 0.5 && uImportImageryMode > 1.5) {
    vec2 imageryUv = importHeightUvAt(xz);
    if (imageryUv.x >= 0.0 && imageryUv.x <= 1.0 && imageryUv.y >= 0.0 && imageryUv.y <= 1.0) {
      vec3 imageryColor = texture2D(uImportImageryTex, clamp(imageryUv, 0.0, 1.0)).rgb;
      return (uImportImageryMode > 2.5)
        ? mix(baseAlbedo, imageryColor, uImportImageryBlend)
        : imageryColor;
    }
  }
  return baseAlbedo;
}
`,na=`
uniform float uWallThickness;

float waterTileOccupiedAt(vec2 xz) {
  if (uUseTiles < 0.5) return 1.0;
  float wall = max(uWallThickness, 0.0);
  if (uTileShape > 0.5) {
    // The circular plinth wall stays at the analytic disk radius. Expanding
    // only the water mask would create a visibly unsupported floating annulus.
    return step(length(xz), uTileDiskRadius);
  }
  vec2 rel = (xz - uTileGridOrigin) / uTileCellSize;
  vec2 cell = floor(rel);
  vec2 local = rel - cell;
  float band = wall / max(uTileCellSize, 1.0);
  float occupied = tileOccAt(cell);
  if (local.x <= band) occupied = max(occupied, tileOccAt(cell + vec2(-1.0, 0.0)));
  if (local.x >= 1.0 - band) occupied = max(occupied, tileOccAt(cell + vec2(1.0, 0.0)));
  if (local.y <= band) occupied = max(occupied, tileOccAt(cell + vec2(0.0, -1.0)));
  if (local.y >= 1.0 - band) occupied = max(occupied, tileOccAt(cell + vec2(0.0, 1.0)));
  if (local.x <= band && local.y <= band)
    occupied = max(occupied, tileOccAt(cell + vec2(-1.0, -1.0)));
  if (local.x <= band && local.y >= 1.0 - band)
    occupied = max(occupied, tileOccAt(cell + vec2(-1.0, 1.0)));
  if (local.x >= 1.0 - band && local.y <= band)
    occupied = max(occupied, tileOccAt(cell + vec2(1.0, -1.0)));
  if (local.x >= 1.0 - band && local.y >= 1.0 - band)
    occupied = max(occupied, tileOccAt(cell + vec2(1.0, 1.0)));
  return occupied;
}
`,Ue=`
// --- hash without sine precision issues (Dave Hoskins) -----------------------
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// --- quintic value noise -----------------------------------------------------
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 ROT2 = mat2(0.80, -0.60, 0.60, 0.80);

// NOTE: all loop bounds are compile-time constants (OCTAVES is a #define
// injected by the material). Dynamic trip counts / breaks make ANGLE's
// D3D11 shader compiler hang while trying to unroll, so avoid them here.

// --- standard FBM at full octave count (rolling hills / plains) --------------
float fbm(vec2 p) {
  float amp = 0.5;
  float sum = 0.0;
  float norm = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    sum += amp * vnoise(p);
    norm += amp;
    amp *= uPersistence;
    p = ROT2 * p * uLacunarity;
  }
  return sum / max(norm, 1e-4);
}

// --- low-cost 4-octave FBM (domain warp, masks, moisture) --------------------
float fbm4(vec2 p) {
  float amp = 0.5;
  float sum = 0.0;
  float norm = 0.0;
  for (int i = 0; i < 4; i++) {
    sum += amp * vnoise(p);
    norm += amp;
    amp *= uPersistence;
    p = ROT2 * p * uLacunarity;
  }
  return sum / max(norm, 1e-4);
}

// --- ridged multifractal (mountain chains) -----------------------------------
float ridgedFBM(vec2 p) {
  float amp = 0.5;
  float sum = 0.0;
  float norm = 0.0;
  float carry = 1.0;
  for (int i = 0; i < OCTAVES; i++) {
    float v = 1.0 - abs(vnoise(p) * 2.0 - 1.0);
    v = v * v;
    sum += amp * v * carry;     // spectral weighting: detail follows ridges
    carry = clamp(v * 1.4, 0.0, 1.0);
    norm += amp;
    amp *= uPersistence;
    p = ROT2 * p * uLacunarity;
  }
  return sum / max(norm, 1e-4);
}
`;function $e(t){let e="";if(typeof t=="string"&&t.includes("/*__TERRAIN_GRAPH_FUNCTIONS__*/")){const[,o=""]=t.split("/*__TERRAIN_GRAPH_FUNCTIONS__*/"),[a="",r=""]=o.split("/*__TERRAIN_GRAPH_BODY__*/");e=a,t=r}return`
${ea}
${ta}

// Canyon/badlands strata: smooth terrace steps. C1-smooth so normals stay
// clean. Used by the legacy recipe and the Terrace modifier layer.
float terrace(float h, float steps) {
  float t = h * steps;
  float s = smoothstep(0.20, 0.80, fract(t));
  return (floor(t) + s) / steps;
}

// The original biome-coupled recipe (layers 1-6), returning h in ~0..1.35
// BEFORE island falloff and the uHeightScale multiply (the wrapper applies
// those to the whole stack). This is the legacy noise type.
float legacyShape2D(vec2 xz, Climate c) {
  vec2 p = xz * uFrequency + uSeedOffset;
  BiomeWeights bw = biomeWeightsAt(c);

  // layer 1: domain warp (canyons reduce warp so strata stay crisp)
  vec2 w = vec2(
    fbm4(p + vec2(13.7, 41.3)),
    fbm4(p + vec2(87.2,  9.1))
  );
  vec2 q = p + (w - 0.5) * uWarp * (1.0 - bw.canyon * 0.5);

  // layer 2: rolling base terrain, amplitude shaped per biome
  float base = fbm(q);
  float baseAmp = 0.30 * (1.0 - bw.desert * 0.45) * (1.0 - bw.wetland * 0.75);
  float h = base * baseAmp + 0.06;

  // layer 3: desert dunes — anisotropic ridge pattern, gentle amplitude
  float dune = 1.0 - abs(vnoise(vec2(q.x * 2.2 + q.y * 0.4, q.y * 0.8) + vec2(311.7, 89.1)) * 2.0 - 1.0);
  h += dune * dune * 0.05 * bw.desert;

  // layer 4: ridged mountain chains — chain noise picks WHERE within a
  // mountain-friendly climate; deserts and wetlands suppress them
  float ridge = ridgedFBM(q * 1.7 + vec2(31.4, 27.2));
  float smoothAmt = clamp(uTerrainSmoothing, 0.0, 1.0);
  float ridgeNeedle = pow(ridge, 1.35);
  float ridgeRounded = pow(ridge, 0.62) * 0.58;
  float ridgeShape = mix(ridgeNeedle, ridgeRounded, smoothAmt);
  float chain = smoothstep(0.34, 0.66, fbm4(q * 0.35 + vec2(5.1, 17.7)));
  float mountains = chain * mix(0.35, 1.0, bw.mountains)
                  * (1.0 - bw.desert * 0.85)
                  * (1.0 - bw.wetland);
  h += ridgeShape * mountains * uRidge * mix(1.15, 0.82, smoothAmt);

  // layer 5: wetlands settle just above the terrain formation baseline.
  // Live Sea Level moves only water and must not reshape existing terrain.
  float sea01 = uTerrainFormationSeaLevel / max(uHeightScale, 1.0);
  h = mix(h, sea01 + 0.012 + base * 0.03, bw.wetland * 0.85);

  // layer 6: canyon/badlands strata terracing
  h = mix(h, terrace(h, 14.0), bw.canyon * 0.75);

  return h;
}

${e}

// Codegen-injected noise stack. Accumulates h from the ordered layers; pw is
// the (possibly domain-warped) noise-domain coordinate shared by all layers.
// uAmplitude acts as a master strength multiplier for the entire stack.
float stackHeight2D(vec2 xz, Climate c) {
  vec2 pw = xz * uFrequency + uSeedOffset;
  float h = 0.0;
${t}
  return h * uAmplitude;
}

float smoothedStackHeight2D(vec2 xz, Climate c) {
  float h = stackHeight2D(xz, c);
  float amt = clamp(uTerrainSmoothing, 0.0, 1.0);
  if (amt <= 0.0001) return h;

  float t = clamp(h / 1.35, 0.0, 1.0);
  float peakStart = 0.42;
  float peak = max(t - peakStart, 0.0);
  float peakMask = smoothstep(peakStart, 0.72, t);
  float compressed = peakStart + peak / (1.0 + amt * 3.2 * peak / (1.0 - peakStart));
  return mix(h, compressed * 1.35, peakMask * amt);
}

// Finalize: island falloff (studio board only) + clamp + world height scale.
float shapeHeight(vec2 xz, Climate c) {
  float proceduralH = smoothedStackHeight2D(xz, c);
  float h = proceduralH;
  if (uInfiniteMode < 0.5 && uImportNoiseMode > 1.5) {
    float importedNoise = importedMapValue(uImportNoiseTex, tileUvAt(xz)) * uAmplitude;
    h = (uImportNoiseMode > 2.5) ? mix(proceduralH, importedNoise, uImportNoiseBlend) : importedNoise;
  }
  if (uInfiniteMode < 0.5) {
    // rim == 1 means the terrain is unaffected at this point (full height).
    // uFalloff == 0 -> rim is 1 everywhere -> no island attenuation, no edge noise.
    float rim = 1.0;
    if (uUseTiles > 0.5) {
      // multi-cell assembly: affect only the outer rim (seamless interiors)
      rim = assemblyFalloff(xz);
    } else if (uFalloff > 0.0) {
      // island/continent falloff toward board edges (square+radial blend). The
      // fade lives entirely inside the boundary: rim hits 0 exactly at the edge.
      vec2 e = abs(xz) / uBoardHalf;
      float edge = mix(max(e.x, e.y), length(e) * 0.7071, 0.5);
      float t = clamp((1.0 - edge) / uFalloff, 0.0, 1.0);
      rim = rimFalloff(t);
    }
    if (uEdgeFalloffMode < 0.5) {
      h *= rim;
    } else {
      // Mountain edges preserve the existing terrain and add a noisy ridged
      // perimeter. uFalloff controls BOTH the band width (via rim) and the noise
      // amplitude, so a small value (0.05) is a subtle rim, not full-height peaks.
      float edgeMask = 1.0 - rim;
      vec2 edgeP = xz * uFrequency + uSeedOffset + vec2(173.7, 419.2);
      float edgeMountains = pow(ridgedFBM(edgeP * 2.35), 1.25);
      float edgeBreakup = vnoise(edgeP * 5.1 + vec2(61.4, 27.8));
      h += (edgeMountains * 0.55 + edgeBreakup * 0.12) * edgeMask * uAmplitude * clamp(uFalloff, 0.0, 1.0);
    }
  }
  float finalH = finalizeStackHeight(h) * uHeightScale;
  if (uInfiniteMode < 0.5 && uImportHeightMode > 1.5) {
    float importedH = importedMapValue(uImportHeightTex, importHeightUvAt(xz)) * uHeightScale * uImportHeightStrength + uImportHeightOffset;
    finalH = (uImportHeightMode > 2.5) ? mix(finalH, importedH, uImportHeightBlend) : importedH;
  }
  return finalH;
}

vec2 paintUvAt(vec2 xz) {
  return xz / max(uPaintBoardSize, 1.0) + vec2(0.5);
}

float paintHeightOffsetAt(vec2 xz) {
  if (uPaintEnabled < 0.5) return 0.0;
  vec2 uv = paintUvAt(xz);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  // R already carries the signed world-unit delta (HalfFloat texture) — no
  // fixed-range decode needed, matching erosionOffsetAt's convention.
  return texture2D(uPaintHeightTexture, uv).r * uPaintOpacity;
}

vec4 paintBiomeAt(vec2 xz) {
  if (uPaintEnabled < 0.5) return vec4(0.0);
  vec2 uv = paintUvAt(xz);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uPaintBiomeTexture, uv) * uPaintOpacity;
}

${ra}

float manualHeightOffsetAt(vec2 xz) {
  if (uManualEnabled < 0.5) return 0.0;
  vec2 uv = (xz - uManualOrigin) / max(uManualSpan, vec2(1.0));
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  return texture2D(uManualHeightTexture, uv).r;
}

vec2 splineUvAt(vec2 xz) { return (xz - uSplineOrigin) / max(uSplineSpan, vec2(1.0)); }
float splineHeightOffsetAt(vec2 xz) {
  if (uSplineEnabled < .5) return 0.0;
  vec2 uv = splineUvAt(xz);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  return texture2D(uSplineHeightTexture, uv).r;
}
vec4 splineMaskAt(vec2 xz) {
  if (uSplineEnabled < .5) return vec4(0.0);
  vec2 uv = splineUvAt(xz);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);
  return texture2D(uSplineMaskTexture, uv);
}

// Erosion height offset: signed world-unit delta added on top of the analytic
// field, sampled over the studio bake region [uBakeOrigin, +uBakeSpan]. Mirrors
// the paint-offset path; free and zero when disabled or outside the region. The
// base field is never mutated, so erosion stays fully non-destructive.
float erosionOffsetAt(vec2 xz) {
  if (uErosionEnabled < 0.5) return 0.0;
  vec2 uv = (xz - uBakeOrigin) / max(uBakeSpan, vec2(1.0));
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  return texture2D(uErosionOffsetTex, uv).r;
}

float heightAtWithClimate(vec2 xz, Climate climate) {
  return shapeHeight(xz, climate) * uPaintBaseMult
    + paintHeightOffsetAt(xz) + manualHeightOffsetAt(xz)
    + splineHeightOffsetAt(xz) + erosionOffsetAt(xz);
}

float heightAt(vec2 xz) {
  return heightAtWithClimate(xz, climateAt(xz * uFrequency + uSeedOffset));
}

// Moisture field for biome blending — now sourced from the climate system.
float moistureAt(vec2 xz) {
  return climateAt(xz * uFrequency + uSeedOffset).moist;
}
`}const je=`
uniform float uBiomeScale;   // climate frequency multiplier (higher = smaller regions)
uniform float uTempBias;     // global temperature shift (-1 polar .. +1 hot)
uniform float uMoistScale;   // moisture field frequency multiplier
uniform float uMoistBias;    // global moisture shift
uniform float uBiomeDebug;   // 1 = visualize biome regions as flat colors

// 3-octave FBM for low-frequency climate fields. Manually unrolled with
// hardcoded gain/lacunarity so climate maps stay stable while the user
// tweaks the terrain FBM parameters (and loop bounds stay compile-time
// constant for the ANGLE D3D11 compiler).
float fbm3(vec2 p) {
  float v = vnoise(p) * 0.55;
  p = ROT2 * p * 2.13;
  v += vnoise(p) * 0.30;
  p = ROT2 * p * 2.13;
  v += vnoise(p) * 0.15;
  return v;
}

struct Climate {
  float temp;     // 0 polar .. 1 hot (sea-level temperature, no altitude lapse)
  float moist;    // 0 arid .. 1 wet
  float cont;     // continentalness: 0 coastal lowland .. 1 deep inland
  float erosion;  // 0 young & jagged .. 1 old & eroded flat
  float region;   // medium-scale jitter that keeps biome borders organic
};

// p is the noise-domain coordinate: worldXZ * uFrequency + uSeedOffset.
// Each field gets a decorrelated domain offset so they are independent.
Climate climateAt(vec2 p) {
  Climate c = Climate(0.0, 0.0, 0.0, 0.0, 0.0);
  vec2 b = p * uBiomeScale;
  c.cont    = fbm3(b * 0.085 + vec2(211.3,  57.9));
  c.temp    = clamp(fbm3(b * 0.150 + vec2( 71.7, 313.1)) * 1.5 - 0.25 + uTempBias, 0.0, 1.0);
  c.moist   = clamp(fbm3(b * 0.130 * uMoistScale + vec2( 91.7,  53.9)) * 1.5 - 0.25 + uMoistBias, 0.0, 1.0);
  c.erosion = fbm3(b * 0.190 + vec2(157.1, 423.7));
  c.region  = fbm3(p * 0.700 + vec2(631.4, 199.2));
  return c;
}

// Smooth 0..1 weights for the biome families that change terrain SHAPE.
// Weights overlap smoothly — nothing is mutually exclusive, so every border
// is a gradual blend instead of a contour line.
struct BiomeWeights {
  float desert;    // hot + dry: dune fields, low relief
  float canyon;    // dry + eroded inland: terraced mesas / badlands strata
  float wetland;   // wet coastal lowland: flat marsh pinned near sea level
  float mountains; // continental + un-eroded: ridged alpine chains allowed
};

BiomeWeights biomeWeightsAt(Climate c) {
  float j = (c.region - 0.5) * 0.16;   // organic border jitter
  float hot    = smoothstep(0.52, 0.74, c.temp + j);
  float dry    = smoothstep(0.55, 0.30, c.moist - j);
  float wet    = smoothstep(0.55, 0.78, c.moist + j);
  float lowC   = smoothstep(0.55, 0.32, c.cont);
  float eroded = smoothstep(0.40, 0.70, c.erosion + j * 0.5);

  BiomeWeights w;
  w.desert    = hot * dry * (1.0 - eroded * 0.55);
  w.canyon    = dry * eroded * smoothstep(0.30, 0.55, c.cont);
  w.wetland   = wet * lowC * (1.0 - hot * 0.4);
  w.mountains = smoothstep(0.38, 0.62, c.cont) * (1.0 - eroded * 0.7);
  return w;
}

// Vegetation density 0..1 — drives forest color now, tree/rock placement
// later. h01 = height / heightScale, slope = 1 - geometricNormal.y.
float vegetationDensity(Climate c, float h01, float slope) {
  float tempEff = c.temp - h01 * 0.55;   // altitude temperature lapse
  float warmEnough = smoothstep(0.18, 0.34, tempEff) * smoothstep(0.92, 0.70, tempEff);
  float wetEnough  = smoothstep(0.34, 0.62, c.moist);
  float flatGround = smoothstep(0.55, 0.25, slope);
  return warmEnough * wetEnough * flatGround;
}
`,ia=4294967296,qe=1024;function Re(t){const e=Number(t);if(!Number.isFinite(e))return 0;const o=Math.trunc(e);if(o===0)return 0;let a=o>>>0;return a=Math.imul(a^a>>>16,2146121005),a=Math.imul(a^a>>>15,2221713035),a=(a^a>>>16)>>>0,Math.fround(a/ia*qe*2-qe)}const ee=8;function sa(t){return(t.masks||[]).some(e=>e.type==="slope"&&e.enabled!==!1)}function ht(t){return t.some(({layer:e})=>sa(e))}function Xe(t,e,o){const a=ne(t.type);if(!a)return"";const r=a.category==="modifier",n=[];return n.push(`  { // ${e}: ${t.type} (${t.name.replace(/[\n*/]/g," ")})`),n.push(`    float scale = uLayerScale[${e}];`),n.push(`    float eff = uLayerStrength[${e}];`),n.push(`    vec4 pa = uLayerParamsA[${e}];`),n.push(`    vec4 pb = uLayerParamsB[${e}];`),n.push(`    float seed = uLayerSeed[${e}];`),n.push(`    float m = ${ft(t,e,o)};`),r?n.push("    "+(o?a.mod3d(t):a.mod2d(t))):(o?n.push("    vec3 P = pw * scale + vec3(seed, seed * 1.7 + 3.1, seed * 0.7 - 2.3);"):n.push("    vec2 P = pw * scale + vec2(seed, seed * 1.7 + 3.1);"),n.push("    float val = 0.0;"),n.push("    "+(o?a.body3d(t):a.body2d(t))),n.push("    "+Me(t.blendMode,"h","(val * eff * m)"))),n.push("  }"),n.join(`
`)}function Le(t,e,o,a,{xzExpr:r="xz",climateExpr:n="c",is3d:i=!1}={}){if(t.type==="legacy")return i?[`    float ${a} = legacyShape3D(dir);`]:[`    float ${a} = legacyShape2D(${r}, ${n});`];const l=i?e.body3d(t):e.body2d(t),s=[];return s.push(`    float ${a} = 0.0;`),s.push("    {"),i?s.push(`      vec3 P = ${o} * scale + vec3(seed, seed * 1.7 + 3.1, seed * 0.7 - 2.3);`):s.push(`      vec2 P = ${o} * scale + vec2(seed, seed * 1.7 + 3.1);`),s.push("      float val = 0.0;"),s.push(`      ${l}`),s.push(`      ${a} = val;`),s.push("    }"),s}function la(t,e){const o=ne(t.type);if(!o)return"";const a=o.category==="modifier",r=[];return r.push(`  { // ${e}: ${t.type} (${t.name.replace(/[\n*/]/g," ")})`),r.push(`    float scale = uLayerScale[${e}];`),r.push(`    float eff = uLayerStrength[${e}];`),r.push(`    vec4 pa = uLayerParamsA[${e}];`),r.push(`    vec4 pb = uLayerParamsB[${e}];`),r.push(`    float seed = uLayerSeed[${e}];`),r.push("    float slope = stackSlope(h, hDX, hDZ);"),r.push(`    float m = ${ft(t,e,!1,"slope")};`),a?o.modKind==="domain"?(r.push("    "+o.mod2d(t,"pw")),r.push("    "+o.mod2d(t,"pwDX")),r.push("    "+o.mod2d(t,"pwDZ"))):o.modKind==="height"?(r.push("    "+o.mod2d(t,"h")),r.push("    "+o.mod2d(t,"hDX")),r.push("    "+o.mod2d(t,"hDZ"))):r.push("    "+o.mod2d(t)):(r.push(...Le(t,o,"pw","valC",{xzExpr:"xz",climateExpr:"c"})),r.push(...Le(t,o,"pwDX","valDX",{xzExpr:"xzDX",climateExpr:"cDX"})),r.push(...Le(t,o,"pwDZ","valDZ",{xzExpr:"xzDZ",climateExpr:"cDZ"})),r.push("    "+Me(t.blendMode,"h","(valC * eff * m)")),r.push("    "+Me(t.blendMode,"hDX","(valDX * eff * m)")),r.push("    "+Me(t.blendMode,"hDZ","(valDZ * eff * m)"))),r.push("  }"),r.join(`
`)}function ca(t){const e=t.some(({layer:a})=>a.type==="legacy"),o=[`  const float STACK_SLOPE_EPS_WORLD = ${ee.toFixed(1)};`,"  vec2 slopeStepDomain = vec2(max(uFrequency * STACK_SLOPE_EPS_WORLD, 1e-6), 0.0);","  vec2 xzDX = xz + vec2(STACK_SLOPE_EPS_WORLD, 0.0);","  vec2 xzDZ = xz + vec2(0.0, STACK_SLOPE_EPS_WORLD);","  vec2 pwDX = pw + slopeStepDomain;","  vec2 pwDZ = pw + slopeStepDomain.yx;","  float hDX = 0.0;","  float hDZ = 0.0;"];return e&&(o.push("  Climate cDX = climateAt(pwDX);"),o.push("  Climate cDZ = climateAt(pwDZ);")),[...o,...t.map(({layer:a,slot:r})=>la(a,r))].join(`
`)}function ua(t){const e=De(t),o=ht(e)?ca(e):e.map(({layer:r,slot:n})=>Xe(r,n,!1)).join(`
`),a=e.map(({layer:r,slot:n})=>Xe(r,n,!0)).join(`
`);return{sig:zt(t),body2d:o,body3d:a}}function So(t,{solo:e=null}={}){const o=new Array(pe).fill(0),a=new Array(pe).fill(1),r=new Array(pe).fill(0),n=[],i=[],l=[],s=[],c=[];for(let u=0;u<pe;u++)n.push([0,0,0,0]),i.push([0,0,0,0]),l.push([0,0,0,0]),s.push([0,0,0,0]),c.push([0,0,0,0]);for(const{layer:u,slot:d}of De(t)){const f=ne(u.type),h=e&&e!==u.id;o[d]=(u.strength??1)*(u.opacity??1)*(h?0:1),a[d]=f.scaleKey?u.params[f.scaleKey]??1:1,r[d]=Re(u.seedOffset);const p=n[d],m=i[d];(f.paKeys||[]).forEach((g,S)=>{g&&(p[S]=u.params[g]??0)}),(f.pbKeys||[]).forEach((g,S)=>{g&&(m[S]=u.params[g]??0)}),da(u,l[d],s[d],c[d])}return{strength:o,scale:a,seed:r,paramsA:n,paramsB:i,maskA:l,maskB:s,maskC:c}}function da(t,e,o,a){const r=t.masks||[],n=r.find(s=>s.type==="height"&&s.enabled!==!1),i=r.find(s=>s.type==="noise"&&s.enabled!==!1),l=r.find(s=>s.type==="slope"&&s.enabled!==!1);n&&(e[0]=n.params.min??0,e[1]=n.params.max??1,e[2]=n.params.falloff??.05,e[3]=n.invert?1:0),i&&(o[0]=i.params.scale??1,o[1]=i.params.threshold??.5,o[2]=i.params.softness??.1,o[3]=i.invert?1:0),l&&(a[0]=l.params.min??0,a[1]=l.params.max??1,a[2]=l.params.falloff??.1,a[3]=l.invert?1:0)}function ma(t,e,o,a){var r,n;return Math.hypot(e-t,o-t)*Math.max(((r=a.uAmplitude)==null?void 0:r.value)??1,0)*Math.max(((n=a.uHeightScale)==null?void 0:n.value)??1,1)/ee}function Ce(t,e,o,a){if(t.type==="legacy")return e.eval2d(o.x,o.z,t,a);const r=Re(t.seedOffset),n=e.scaleKey?t.params[e.scaleKey]??1:1,i=o.px*n+r,l=o.pz*n+r*1.7+3.1;return e.eval2d?e.eval2d(i,l,t,a):0}function fa(t,e,o,a){var f;const r=a.uniforms,n=r.uFrequency.value,i=r.uSeedOffset.value.x,l=r.uSeedOffset.value.y,s=[{x:e,z:o,px:e*n+i,pz:o*n+l},{x:e+ee,z:o,px:(e+ee)*n+i,pz:o*n+l},{x:e,z:o+ee,px:e*n+i,pz:(o+ee)*n+l}];let c=0,u=0,d=0;for(const{layer:h}of t){const p=ne(h.type),m=(h.strength??1)*(h.opacity??1),g=ma(c,u,d,r),S=Ee(h,{h:c,slope:g});if(p.category==="modifier"){p.modJs2?(p.modJs2(s[0],h,m),p.modJs2(s[1],h,m),p.modJs2(s[2],h,m)):p.modHeightJs&&(c=p.modHeightJs(c,h,m,S),u=p.modHeightJs(u,h,m,S),d=p.modHeightJs(d,h,m,S));continue}const b=Ce(h,p,s[0],a),v=Ce(h,p,s[1],a),x=Ce(h,p,s[2],a);c=fe(h.blendMode,c,b*m*S),u=fe(h.blendMode,u,v*m*S),d=fe(h.blendMode,d,x*m*S)}return c*(((f=r.uAmplitude)==null?void 0:f.value)??1)}function wo(t,e,o,a){var d;const r=a.uniforms,n=r.uFrequency.value,i=r.uSeedOffset.value.x,l=r.uSeedOffset.value.y,s={px:e*n+i,pz:o*n+l};let c=0;const u=De(t);if(ht(u))return fa(u,e,o,a);for(const{layer:f}of u){const h=ne(f.type),p=(f.strength??1)*(f.opacity??1);if(h.category==="modifier"){h.modJs2?h.modJs2(s,f,p):h.modHeightJs&&(c=h.modHeightJs(c,f,p,1));continue}const m=Re(f.seedOffset),g=h.scaleKey?f.params[h.scaleKey]??1:1,S=s.px*g+m,b=s.pz*g+m*1.7+3.1;let v=h.eval2d?h.eval2d(S,b,f,a):0;f.type==="legacy"&&(v=h.eval2d(e,o,f,a));const x=Ee(f,{h:c});c=fe(f.blendMode,c,v*p*x)}return c*(((d=r.uAmplitude)==null?void 0:d.value)??1)}function Mo(t,e,o,a,r){var d;const n=r.uniforms,i=n.uPlanetRadius.value*n.uFrequency.value,l=n.uSeedOffset.value.x,s=n.uSeedOffset.value.y,c={px:e*i+l,py:o*i+s,pz:a*i+(s-l)};let u=0;for(const{layer:f}of De(t)){const h=ne(f.type),p=(f.strength??1)*(f.opacity??1);if(h.category==="modifier"){h.modJs3?h.modJs3(c,f,p):h.modHeightJs&&(u=h.modHeightJs(u,f,p,1));continue}const m=Re(f.seedOffset),g=h.scaleKey?f.params[h.scaleKey]??1:1;let S;f.type==="legacy"?S=h.eval3d(e,o,a,f,r):S=h.eval3d?h.eval3d(c.px*g+m,c.py*g+m*1.7+3.1,c.pz*g+m*.7-2.3,f,r):0;const b=Ee(f,{h:u});u=fe(f.blendMode,u,S*p*b)}return u*(((d=n.uAmplitude)==null?void 0:d.value)??1)}const ha=`
uniform vec3 uColDeep;
uniform vec3 uColShallow;
uniform vec3 uColSand;
uniform vec3 uColDune;
uniform vec3 uColDryGrass;
uniform vec3 uColGrass;
uniform vec3 uColForest;
uniform vec3 uColJungle;
uniform vec3 uColSwamp;
uniform vec3 uColTundra;
uniform vec3 uColRedRock;
uniform vec3 uColRedRock2;
uniform vec3 uColRock;
uniform vec3 uColRockHi;
uniform vec3 uColSnow;
uniform vec3 uColFoam;

uniform float uPaletteSaturation;
uniform float uPaletteContrast;
uniform vec3  uPaletteTint;
uniform vec3  uTerrainSunCol;
uniform float uTerrainSunIntensity;
uniform vec3  uTerrainSkyAmb;
uniform vec3  uTerrainBounce;

// Used by computeTerrainAlbedo — must be declared before TERRAIN_COLOR_FUNCTIONS_GLSL.
uniform float uSnowLine;

// Slope gates (Materials realism). Defaults reproduce the previously hard-coded
// thresholds, so scenes that never touch the sliders render identically.
uniform float uRockSlopeLo;   // slope where rock starts bleeding in   (was 0.42)
uniform float uRockSlopeHi;   // slope of full rock exposure           (was 0.72)
uniform float uSnowSlopeMin;  // slope below which snow holds fully    (was 0.30)
uniform float uSnowSlopeMax;  // slope above which snow sheds entirely (was 0.62)

// Ridge accent: brightens convex crests in the AO term. 0 (default) = off.
uniform float uAORidge;
`,ko=`
vec3 applyPalettePost(vec3 col) {
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, uPaletteSaturation);
  col = (col - 0.5) * uPaletteContrast + 0.5;
  col *= uPaletteTint;
  return max(col, vec3(0.0));
}

// Compute terrain albedo from climate, biome weights, height, slope.
// Returns albedo before lighting; also outputs snow/shore/micro helpers.
struct TerrainColorResult {
  vec3 albedo;
  float snow;
  float sandBand;
  float flatness;
  float rockBlend;
};

// microN is the high-frequency albedo grain noise, supplied by the caller so
// the same function serves both the flat board (a plain xz value noise) and the
// planet (triplanar, to avoid sphere stretching) without forking.
TerrainColorResult computeTerrainAlbedo(
  Climate cl, BiomeWeights bw,
  float hC, float hRel, float h01, float slope, float detail, float jitter, float microN
) {
  TerrainColorResult res;
  float tempEff = clamp(cl.temp - h01 * 0.55, 0.0, 1.0);
  float veg = vegetationDensity(cl, h01, slope);
  float jt = jitter * 0.06;

  vec3 hotBand = mix(uColDune,
    mix(uColDryGrass, uColJungle, smoothstep(0.45, 0.75, cl.moist)),
    smoothstep(0.20, 0.50, cl.moist));
  vec3 midBand = mix(uColDryGrass,
    mix(uColGrass, uColForest, veg * (0.5 + 0.5 * smoothstep(0.35, 0.65, detail))),
    smoothstep(0.22, 0.52, cl.moist));
  vec3 coldBand = mix(uColTundra, mix(uColTundra, uColForest * 0.85, veg),
    smoothstep(0.30, 0.60, cl.moist));

  vec3 lowland = mix(coldBand, midBand, smoothstep(0.20, 0.38, tempEff + jt));
  lowland = mix(lowland, hotBand, smoothstep(0.55, 0.72, tempEff + jt));
  lowland = mix(lowland, uColSwamp, bw.wetland * 0.8);

  float sandBand = (mix(3.0, 9.0, smoothstep(0.30, 0.70, tempEff)) + jitter * 4.0)
                 * (1.0 - bw.wetland * 0.85);
  vec3 albedo = mix(uColSand, lowland, smoothstep(sandBand * 0.4, max(sandBand, 0.3), hRel));

  float band = fract(h01 * 14.0 + detail * 0.15);
  vec3 canyonCol = mix(uColRedRock, uColRedRock2, smoothstep(0.25, 0.75, band));
  albedo = mix(albedo, canyonCol, bw.canyon * smoothstep(1.0, 6.0, hRel));

  float highBlend = smoothstep(0.30, 0.62, h01 + jitter * 0.08);
  albedo = mix(albedo, uColRockHi, highBlend * 0.65 * (1.0 - bw.desert * 0.7));

  float rockBlend = smoothstep(uRockSlopeLo, uRockSlopeHi, slope + jitter * 0.06);
  vec3 slopeRock = mix(mix(uColRock, uColRockHi, detail), uColRedRock, bw.canyon * 0.8);
  albedo = mix(albedo, slopeRock, rockBlend);

  float snowLine01 = uSnowLine * (0.40 + 1.20 * cl.temp);
  float flatness = smoothstep(uSnowSlopeMax, uSnowSlopeMin, slope);
  float snow = smoothstep(snowLine01 - 0.03, snowLine01 + 0.05, h01 + jitter * 0.04) * flatness;
  snow = max(snow, smoothstep(0.10, 0.02, tempEff) * smoothstep(0.50, 0.25, slope));
  snow *= 1.0 - bw.desert;
  albedo = mix(albedo, uColSnow, snow);

  // Terrain owns only the physical ground albedo. Water color, absorption and
  // underwater tint are composited by the water/underwater passes. Baking a
  // uColDeep tint into terrain here made blue ground visible whenever the water
  // wet mask and a rendered LOD triangle disagreed at the shoreline.

  float micro = mix(0.20, 0.06, max(bw.desert * (1.0 - rockBlend), bw.wetland * 0.8));
  micro = mix(micro, 0.30, max(rockBlend * 0.6, bw.canyon * 0.4));
  albedo *= (1.0 - micro * 0.5) + micro * microN;

  res.albedo = applyPalettePost(albedo);
  res.snow = snow;
  res.sandBand = sandBand;
  res.flatness = flatness;
  res.rockBlend = rockBlend;
  return res;
}

// Ridge accent: convex is the positive counterpart of the concavity AO term
// (crest sticking up above its neighbours). Brightens crests so alpine ridges
// catch light; capped so lighting never blows out. uAORidge 0 = exact no-op.
float applyRidgeAccent(float ao, float convex) {
  return min(ao * (1.0 + uAORidge * clamp(convex, 0.0, 1.0) * 0.45), 1.25);
}

vec3 terrainBiomeDebugColor(BiomeWeights bw, float h01) {
  vec3 dbg = vec3(0.20, 0.50, 0.25);
  dbg = mix(dbg, uColDune, bw.desert);
  dbg = mix(dbg, uColRedRock, bw.canyon);
  dbg = mix(dbg, uColShallow, bw.wetland);
  dbg = mix(dbg, uColRockHi, bw.mountains * smoothstep(0.3, 0.6, h01));
  return applyPalettePost(dbg);
}

vec3 terrainLighting(vec3 albedo, vec3 n, vec3 sunDir, float ao,
  float snow, float sandBand, float hRel, float flatness, float bwWetland,
  vec3 viewDir) {
  float diff = max(dot(n, sunDir), 0.0);
  vec3 sunCol = uTerrainSunCol * uTerrainSunIntensity;
  vec3 skyAmb = uTerrainSkyAmb * 0.50 * (n.y * 0.5 + 0.5);
  vec3 bounce = uTerrainBounce * 0.25 * (1.0 - n.y * 0.5);
  // Keep the 1.0.0-b lighting baseline authoritative. The later procedural
  // cloud-mask projection could suppress nearly all direct light over a tile,
  // which made a correctly baked terrain look flat and unlit.
  vec3 col = albedo * (sunCol * diff + skyAmb + bounce) * ao;

  float spec = pow(max(dot(reflect(-sunDir, n), viewDir), 0.0), 32.0);
  float shoreSheen = 1.0 - smoothstep(0.0, max(sandBand, 0.5), abs(hRel));
  col += spec * (snow * 0.30 + shoreSheen * 0.10 + bwWetland * flatness * 0.15);
  return col;
}
`,pa=`
uniform sampler2D uWaterTerrainHeightTex;
uniform sampler2D uWaterTerrainBiomeTex;
uniform float uUseWaterTerrainBiomeTex;

vec2 waterBakedUvAt(vec2 xz) {
  return (xz - uBakeOrigin) / max(uBakeSpan, vec2(1.0));
}

float waterBakedHeightAt(vec2 xz) {
  return texture2D(uWaterTerrainHeightTex, waterBakedUvAt(xz)).a * uHeightScale;
}
`;function ga(t,e){return e?{dependencies:`${Ue}
${je}
${$e(t.body2d)}
${oa}`,terrainHeightFunction:`
float waterTerrainHeightAt(vec2 xz) {
  return terrainCachedHeightAt(xz);
}
`}:{dependencies:`${Ue}
${je}
${$e(t.body2d)}`,terrainHeightFunction:`
float waterTerrainHeightAt(vec2 xz) {
  if (uUseWaterTerrainBiomeTex > 0.5) {
    return waterBakedHeightAt(xz);
  }
  return heightAt(xz);
}
`}}const va=`
uniform float uWaterAtmosphereInfluence;
uniform float uWaterSunResponse;
uniform float uWaterAmbientResponse;
uniform float uWaterFoamLighting;

vec3 waterResolveLighting(
  vec3 normal,
  vec3 localUp,
  float diffuse,
  vec3 legacyLight
) {
  float upFacing = clamp(
    dot(normalize(normal), normalize(localUp)),
    -1.0,
    1.0
  );
  float skyFacing = upFacing * 0.5 + 0.5;

  vec3 directLight = uTerrainSunCol
    * uTerrainSunIntensity
    * diffuse
    * uWaterSunResponse;
  vec3 ambientLight = uTerrainSkyAmb
    * 0.50
    * skyFacing
    * uWaterAmbientResponse;
  vec3 bounceLight = uTerrainBounce
    * 0.25
    * (1.0 - upFacing * 0.5)
    * uWaterAmbientResponse;
  vec3 environmentLight = max(
    directLight + ambientLight + bounceLight,
    vec3(0.0)
  );

  return mix(
    legacyLight,
    environmentLight,
    clamp(uWaterAtmosphereInfluence, 0.0, 1.0)
  );
}

vec3 waterResolveSunLight(vec3 legacySunLight) {
  vec3 environmentSunLight = uTerrainSunCol
    * uTerrainSunIntensity
    * uWaterSunResponse;
  return mix(
    legacySunLight,
    environmentSunLight,
    clamp(uWaterAtmosphereInfluence, 0.0, 1.0)
  );
}

vec3 waterResolveSkyLight(vec3 legacySkyLight) {
  vec3 environmentSkyLight = uTerrainSkyAmb
    * 0.50
    * uWaterAmbientResponse;
  return mix(
    legacySkyLight,
    environmentSkyLight,
    clamp(uWaterAtmosphereInfluence, 0.0, 1.0)
  );
}

vec3 waterResolveFoamColor(vec3 foamColor, vec3 resolvedLight) {
  vec3 environmentLight = max(resolvedLight, vec3(0.0));
  float environmentPeak = max(
    max(environmentLight.r, environmentLight.g),
    environmentLight.b
  );

  // Preserve the environment's hue when lifting very dark foam. The previous
  // mix from vec3(1.0) left a large neutral-white term (35% at the default
  // setting), which became a bright emissive-looking outline after gamma.
  vec3 environmentTint = environmentPeak > 0.0001
    ? environmentLight / environmentPeak
    : vec3(0.30, 0.38, 0.50);
  float readabilityFloor = mix(
    0.12,
    0.015,
    clamp(uWaterFoamLighting, 0.0, 1.0)
  );
  vec3 foamLight = max(
    environmentLight,
    environmentTint * readabilityFloor
  );
  return foamColor * foamLight;
}
`;function ba(){return{uWaterAtmosphereInfluence:{value:1},uWaterSunResponse:{value:1},uWaterAmbientResponse:{value:1},uWaterFoamLighting:{value:.65}}}function Do(t,e={}){t&&(t.uWaterAtmosphereInfluence&&(t.uWaterAtmosphereInfluence.value=e.waterAtmosphereInfluence??1),t.uWaterSunResponse&&(t.uWaterSunResponse.value=e.waterSunResponse??1),t.uWaterAmbientResponse&&(t.uWaterAmbientResponse.value=e.waterAmbientResponse??1),t.uWaterFoamLighting&&(t.uWaterFoamLighting.value=e.waterFoamLighting??.65))}const O=256,xa="https://elevation-tiles-prod.s3.dualstack.us-east-1.amazonaws.com/terrarium",Ze=6,ya="rgb(128,0,0)",Ao="표고: AWS Open Data의 지형 타일 (Terrarium) — Mapzen, SRTM 등";function ze(t,e){const o=Math.pow(2,e);return(t%o+o)%o}const _e={satellite:{id:"satellite",label:"위성",shortLabel:"위성",attribution:"영상: Esri World Imagery — Esri, Maxar, Earthstar Geographics & others",missingFill:"#243028",tileUrl(t,e,o){const a=ze(e,t);return`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t}/${o}/${a}`}},opentopo:{id:"opentopo",label:"지형도",shortLabel:"OpenTopoMap",attribution:"지도: © OpenTopoMap (CC-BY-SA) — © OpenStreetMap 기여자, SRTM",missingFill:"#d8d8d8",tileUrl(t,e,o){const a=ze(e,t),r=["https://a.tile.opentopomap.org","https://b.tile.opentopomap.org","https://c.tile.opentopomap.org"];return`${r[(a+o)%r.length]}/${t}/${a}/${o}.png`}}},Sa="satellite";_e.satellite.attribution;function wa(t){return _e[t]||_e[Sa]}const Ma=[{id:"grand-canyon",name:"그랜드 캐년",blurb:"미국 애리조나 깎인 협곡",bbox:{minLat:35.95,maxLat:36.35,minLon:-112.45,maxLon:-111.95},zoom:11},{id:"everest",name:"에베레스트 산",blurb:"히말라야, 네팔 / 티벳",bbox:{minLat:27.8,maxLat:28.18,minLon:86.7,maxLon:87.1},zoom:11},{id:"fuji",name:"후지 산",blurb:"성층 화산, 일본",bbox:{minLat:35.21,maxLat:35.55,minLon:138.55,maxLon:138.93},zoom:11},{id:"matterhorn",name:"마터호른",blurb:"페닌 알프스, 스위스 / 이탈리아",bbox:{minLat:45.83,maxLat:46.13,minLon:7.46,maxLon:7.86},zoom:11},{id:"grand-teton",name:"그랜드 테톤",blurb:"테톤 산맥, �이오밍 미국",bbox:{minLat:43.58,maxLat:43.92,minLon:-110.98,maxLon:-110.62},zoom:11},{id:"crater-lake",name:"분화구 호수",blurb:"캘데라, 오리건 USA",bbox:{minLat:42.83,maxLat:43.07,minLon:-122.27,maxLon:-121.97},zoom:11},{id:"yosemite",name:"요세미티 계곡",blurb:"Sierra Nevada, California USA",bbox:{minLat:37.62,maxLat:37.88,minLon:-119.7,maxLon:-119.4},zoom:11},{id:"big-island",name:"하와이 (빅 아일랜드)",blurb:"마우나로아 & 마우나케아",bbox:{minLat:19.3,maxLat:19.9,minLon:-155.9,maxLon:-155.2},zoom:10},{id:"vatnajokull",name:"Vatnajökull",blurb:"빙하 고지대, 아이슬란드",bbox:{minLat:64.2,maxLat:64.62,minLon:-17.25,maxLon:-16.45},zoom:10},{id:"eiger",name:"아이거 & 융프라우",blurb:"베르니나 알프스 북쪽 면, 스위스",bbox:{minLat:46.5,maxLat:46.62,minLon:7.93,maxLon:8.07},zoom:12},{id:"monte-rosa",name:"몬테 로사",blurb:"스위스 최고 산괴, 페닌 알프스",bbox:{minLat:45.86,maxLat:46,minLon:7.8,maxLon:7.94},zoom:12},{id:"piz-bernina",name:"피츠 베르니나",blurb:"베르니나 산맥 빙하, 엥가딘",bbox:{minLat:46.32,maxLat:46.44,minLon:9.84,maxLon:9.98},zoom:12},{id:"mont-blanc",name:"몽블랑",blurb:"알프스 최고봉, 프랑스 / 이탈리아",bbox:{minLat:45.78,maxLat:45.92,minLon:6.79,maxLon:6.95},zoom:12},{id:"landmannalaugar",name:"란드만날라우가르",blurb:"아이슬란드 유리질암 고지대",bbox:{minLat:63.92,maxLat:64.1,minLon:-19.2,maxLon:-18.95},zoom:11},{id:"askja",name:"아스캬",blurb:"캘데라 & 용암 사막, 아이슬란드 고원",bbox:{minLat:65,maxLat:65.12,minLon:-16.85,maxLon:-16.65},zoom:11},{id:"snaefellsjokull",name:"Snæfellsjökull",blurb:"Glacier-capped volcano, W Iceland",bbox:{minLat:64.74,maxLat:64.86,minLon:-23.88,maxLon:-23.7},zoom:11},{id:"taupo-volcanic",name:"타우포 화산 지대",blurb:"뉴질랜드 지열 지대 & 분화구",bbox:{minLat:-39.3,maxLat:-39.06,minLon:175.55,maxLon:175.82},zoom:11},{id:"mount-cook",name:"아오라키 / 쿡 산",blurb:"남부 알프스, 뉴질랜드",bbox:{minLat:-43.66,maxLat:-43.52,minLon:170.05,maxLon:170.23},zoom:11},{id:"fiordland",name:"밀포드 사운드",blurb:"피오르드랜드 빙하 계곡, 뉴질랜드",bbox:{minLat:-44.72,maxLat:-44.54,minLon:167.78,maxLon:168.02},zoom:11},{id:"fitz-roy",name:"몬테 피츠로이",blurb:"화강암 첨탑, 파타고니아, 아르헨티나",bbox:{minLat:-49.36,maxLat:-49.2,minLon:-73.1,maxLon:-72.92},zoom:11},{id:"torres-del-paine",name:"토레스 델 파이네",blurb:"Massif & lakes, Chilean Patagonia",bbox:{minLat:-51.1,maxLat:-50.9,minLon:-73.1,maxLon:-72.8},zoom:11},{id:"denali",name:"데날리",blurb:"북아메리카 최고봉, 알래스카 USA",bbox:{minLat:63,maxLat:63.2,minLon:-151.18,maxLon:-150.8},zoom:11},{id:"kilimanjaro",name:"킬리만자로",blurb:"아프리카 최고봉, 탄자니아",bbox:{minLat:-3.15,maxLat:-2.97,minLon:37.27,maxLon:37.47},zoom:11},{id:"k2",name:"K2",blurb:"카라코람, 파키스탄 / 중국",bbox:{minLat:35.79,maxLat:35.97,minLon:76.41,maxLon:76.61},zoom:11},{id:"aconcagua",name:"아콩카과",blurb:"아메리카 대륙 최고봉, 아르헨티나",bbox:{minLat:-32.74,maxLat:-32.56,minLon:-70.1,maxLon:-69.9},zoom:11},{id:"annapurna",name:"안나푸르나",blurb:"깊은 히말라야 산괴, 네팔",bbox:{minLat:28.5,maxLat:28.68,minLon:83.74,maxLon:83.94},zoom:11},{id:"zion",name:"자이언 캐년",blurb:"사암 협곡, 유타 USA",bbox:{minLat:37.18,maxLat:37.36,minLon:-113.1,maxLon:-112.9},zoom:11},{id:"monument-valley",name:"모뉴먼트 밸리",blurb:"사암 메사, 애리조나 / 유타 USA",bbox:{minLat:36.94,maxLat:37.1,minLon:-110.2,maxLon:-110},zoom:11},{id:"dolomites",name:"돌로미티",blurb:"트레 치메, 이탈리아의 석회암 타워",bbox:{minLat:46.58,maxLat:46.7,minLon:12.25,maxLon:12.4},zoom:12},{id:"mount-rainier",name:"레니어 산",blurb:"빙하 성층 화산, 워싱턴 USA",bbox:{minLat:46.78,maxLat:46.92,minLon:-121.83,maxLon:-121.65},zoom:11},{id:"etna",name:"에트나 산",blurb:"활성 화산, 시칠리아, 이탈리아",bbox:{minLat:37.68,maxLat:37.82,minLon:14.93,maxLon:15.07},zoom:11}];function Ro(t){return Ma.find(e=>e.id===t)||null}const ka={lat:{min:-85,max:85,step:.01},lon:{min:-180,max:180,step:.01},sizeKm:{min:4,max:160,step:1},zoom:{min:6,max:15,step:1}},Ve=85.051,be=(t,e,o)=>Math.min(o,Math.max(e,t)),Da=/([+-]?)(\d+(?:\.\d+)?)\s*(?:°|deg)?(?:\s*(\d+(?:\.\d+)?)\s*['′])?(?:\s*(\d+(?:\.\d+)?)\s*["″])?\s*([NnSsEeWw])?/g;function Aa(t){return String(t).trim().replace(/\u00b0/g,"°").replace(/[′ʼ]/g,"'").replace(/[″ʺ]/g,'"')}function Ra(t,e){if(!e)return t;const o=e.toUpperCase();return o==="S"||o==="W"?-Math.abs(t):o==="N"||o==="E"?Math.abs(t):t}function La(t,e){if(!t)return!0;const o=t.toUpperCase();return e==="lat"?o==="N"||o==="S":o==="E"||o==="W"}function Ke(t,e){const o=t[1]||"",a=parseFloat(`${o}${t[2]}`),r=t[3]!=null?parseFloat(t[3]):0,n=t[4]!=null?parseFloat(t[4]):0,i=t[5]||null;if(![a,r,n].every(Number.isFinite)||!La(i,e)||r<0||r>=60||n<0||n>=60)return null;const l=Math.abs(a)+r/60+n/3600,s=a<0||o==="-"?-l:l;return Ra(s,i)}function Lo(t){if(t==null)return null;const e=Aa(t);if(!e)return null;const o=[...e.matchAll(Da)].filter(l=>l[0].trim().length>0);if(o.length!==2)return null;const a=o.map(l=>l[0]).join("").replace(/[\s,;\t]+/g,""),r=e.replace(/[\s,;\t]+/g,"");if(a!==r)return null;const n=Ke(o[0],"lat"),i=Ke(o[1],"lon");return n==null||i==null||Math.abs(n)>90||Math.abs(i)>180?null:{lat:n,lon:i}}function Co({lat:t,lon:e}){const o=t>=0?"N":"S",a=e>=0?"E":"W";return`${Math.abs(t).toFixed(5)}°${o}, ${Math.abs(e).toFixed(5)}°${a}`}function Ca({lat:t,lon:e,sizeKm:o,zoom:a}){const r=ka,n=be(+t||0,r.lat.min,r.lat.max),i=be(+e||0,r.lon.min,r.lon.max),l=be(+o||r.sizeKm.min,r.sizeKm.min,r.sizeKm.max),s=l/2/110.574,c=l/2/(111.32*Math.max(Math.cos(n*Math.PI/180),.05));return{id:"custom",name:`Custom ${n.toFixed(2)}°, ${i.toFixed(2)}°`,blurb:`${Math.round(l)} km area`,bbox:{minLat:Math.max(n-s,-Ve),maxLat:Math.min(n+s,Ve),minLon:Math.max(i-c,-180),maxLon:Math.min(i+c,180)},zoom:Math.round(be(+a||r.zoom.min,r.zoom.min,r.zoom.max))}}function zo(t){const e=Ca(t),o=pt(e),a=oe(e.bbox.minLon,o),r=oe(e.bbox.maxLon,o),n=re(e.bbox.maxLat,o),i=re(e.bbox.minLat,o),l=Math.floor(r)-Math.floor(a)+1,s=Math.floor(i)-Math.floor(n)+1,c=Math.max(1,Math.round((r-a)*O)),u=Math.max(1,Math.round((i-n)*O)),d=(e.bbox.minLat+e.bbox.maxLat)/2,f=40075016686e-3*Math.cos(d*Math.PI/180)/(O*Math.pow(2,o));return{loc:e,zoom:o,zoomClamped:o<e.zoom,tilesX:l,tilesY:s,outW:c,outH:u,metersPerPixel:f}}function oe(t,e){return(t+180)/360*Math.pow(2,e)}function re(t,e){const o=t*Math.PI/180;return(1-Math.asinh(Math.tan(o))/Math.PI)/2*Math.pow(2,e)}function pt(t){for(let e=t.zoom;e>0;e--){const o=Math.floor(oe(t.bbox.maxLon,e))-Math.floor(oe(t.bbox.minLon,e))+1,a=Math.floor(re(t.bbox.minLat,e))-Math.floor(re(t.bbox.maxLat,e))+1;if(o<=Ze&&a<=Ze)return e}return 1}function za(t,e){return new Promise(o=>{const a=new Image;a.crossOrigin="anonymous",a.decoding="async",a.onload=()=>o(a),a.onerror=()=>o(null),e&&e.addEventListener("abort",()=>{a.src="",o(null)},{once:!0}),a.src=t})}function _a(t,e,o){return`${xa}/${t}/${ze(e,t)}/${o}.png`}async function gt(t,e,o,a,{onProgress:r,signal:n}={}){const i=oe(t.minLon,e),l=oe(t.maxLon,e),s=re(t.maxLat,e),c=re(t.minLat,e),u=Math.floor(i),d=Math.floor(l),f=Math.floor(s),h=Math.floor(c),p=d-u+1,m=h-f+1,g=document.createElement("canvas");g.width=p*O,g.height=m*O;const S=g.getContext("2d",{willReadFrequently:!0}),b=p*m;let v=0,x=0;for(let D=f;D<=h;D++)for(let B=u;B<=d;B++){if(n!=null&&n.aborted)throw new DOMException("Aborted","AbortError");const C=await za(o(e,B,D),n),P=(B-u)*O,H=(D-f)*O;C?(S.drawImage(C,P,H),x++):(S.fillStyle=a,S.fillRect(P,H,O,O)),v++,r==null||r(v/b)}const k=Math.max(0,Math.round((i-u)*O)),w=Math.max(0,Math.round((s-f)*O)),y=Math.min(g.width-k,Math.max(1,Math.round((l-i)*O))),A=Math.min(g.height-w,Math.max(1,Math.round((c-s)*O))),R=S.getImageData(k,w,y,A);return{imageData:R,width:R.width,height:R.height,ok:x}}function Ta(t,e,o,a=160){const r=Math.min(1,a/Math.max(e,o)),n=Math.max(1,Math.round(e*r)),i=Math.max(1,Math.round(o*r)),l=document.createElement("canvas");l.width=n,l.height=i;const s=l.getContext("2d"),c=s.createImageData(n,i);for(let u=0;u<i;u++)for(let d=0;d<n;d++){const f=Math.min(e-1,Math.floor(d/r)),h=Math.min(o-1,Math.floor(u/r)),p=Math.round(t[h*e+f]*255),m=(u*n+d)*4;c.data[m]=c.data[m+1]=c.data[m+2]=p,c.data[m+3]=255}return s.putImageData(c,0,0),l.toDataURL("image/png")}function Fa(t,e,o,a=160){const r=Math.min(1,a/Math.max(e,o)),n=Math.max(1,Math.round(e*r)),i=Math.max(1,Math.round(o*r)),l=document.createElement("canvas");l.width=n,l.height=i;const s=l.getContext("2d"),c=s.createImageData(n,i);for(let u=0;u<i;u++)for(let d=0;d<n;d++){const f=Math.min(e-1,Math.floor(d/r)),p=(Math.min(o-1,Math.floor(u/r))*e+f)*4,m=(u*n+d)*4;c.data[m]=t[p],c.data[m+1]=t[p+1],c.data[m+2]=t[p+2],c.data[m+3]=255}return s.putImageData(c,0,0),l.toDataURL("image/png")}function _o(t){return pt(t)}async function To(t,e,{onProgress:o,signal:a}={}){const{imageData:r,width:n,height:i,ok:l}=await gt(t,e,_a,ya,{onProgress:o,signal:a});if(l===0)throw new Error("No elevation tiles could be loaded (network or CORS blocked).");const s=r.data,c=new Float32Array(n*i);for(let u=0,d=0;u<s.length;u+=4,d++)c[d]=s[u]*256+s[u+1]+s[u+2]/256-32768;return{elev:c,width:n,height:i}}async function Fo(t,e,{style:o,onProgress:a,signal:r}={}){const n=wa(o),{imageData:i,width:l,height:s,ok:c}=await gt(t,e,n.tileUrl.bind(n),n.missingFill,{onProgress:a,signal:r});if(c===0)throw new Error(`No ${n.shortLabel} tiles could be loaded (network or CORS blocked).`);return{rgba:new Uint8ClampedArray(i.data),width:l,height:s,style:n.id}}function Po(t,e,o){const a=t.maxLon-t.minLon,r=t.maxLat-t.minLat;return{minLon:t.minLon+e*a,maxLon:t.maxLon+e*a,minLat:t.minLat-o*r,maxLat:t.maxLat-o*r}}function Pa(t,e,o){const{elev:a,width:r,height:n}=t,i=Math.min(Math.max(e,0),1)*(r-1),l=Math.min(Math.max(o,0),1)*(n-1),s=Math.floor(i),c=Math.floor(l),u=Math.min(s+1,r-1),d=Math.min(c+1,n-1),f=i-s,h=l-c,p=a[c*r+s]+(a[c*r+u]-a[c*r+s])*f,m=a[d*r+s]+(a[d*r+u]-a[d*r+s])*f;return p+(m-p)*h}function Eo(t,e,{maxSide:o=4096}={}){let a=1/0,r=1/0,n=-1/0,i=-1/0;for(const v of e)v.cx<a&&(a=v.cx),v.cz<r&&(r=v.cz),v.cx>n&&(n=v.cx),v.cz>i&&(i=v.cz);e.length||(a=r=n=i=0);const l=n-a+1,s=i-r+1,c=t["0,0"]??Object.values(t)[0];if(!c)throw new Error("No elevation patches to composite.");const u=Math.min(1,o/(l*c.width),o/(s*c.height)),d=Math.max(1,Math.round(c.width*u)),f=Math.max(1,Math.round(c.height*u)),h=l*d,p=s*f;let m=1/0,g=-1/0;for(const v of e){const x=t[`${v.cx},${v.cz}`];if(x)for(let k=0;k<x.elev.length;k++){const w=x.elev[k];w<m&&(m=w),w>g&&(g=w)}}Number.isFinite(m)||(m=0,g=1);const S=g>m?g-m:1,b=new Float32Array(h*p);for(const v of e){const x=t[`${v.cx},${v.cz}`];if(!x)continue;const k=(v.cx-a)*d,w=(v.cz-r)*f;for(let y=0;y<f;y++){const A=f>1?y/(f-1):0,R=(w+y)*h+k;for(let D=0;D<d;D++){const B=d>1?D/(d-1):0;b[R+D]=(Pa(x,B,A)-m)/S}}}return{floatData:b,width:h,height:p,minElev:m,maxElev:g,preview:Ta(b,h,p),bounds:{minX:a,minZ:r,maxX:n,maxZ:i,cols:l,rows:s}}}function Ea(t,e,o,a,r){const{rgba:n,width:i,height:l}=t,s=Math.min(Math.max(e,0),1)*(i-1),c=Math.min(Math.max(o,0),1)*(l-1),u=Math.floor(s),d=Math.floor(c),f=Math.min(u+1,i-1),h=Math.min(d+1,l-1),p=s-u,m=c-d,g=(d*i+u)*4,S=(d*i+f)*4,b=(h*i+u)*4,v=(h*i+f)*4;for(let x=0;x<3;x++){const k=n[g+x]+(n[S+x]-n[g+x])*p,w=n[b+x]+(n[v+x]-n[b+x])*p;a[r+x]=Math.round(k+(w-k)*m)}a[r+3]=255}function Bo(t,e,{maxSide:o=4096}={}){let a=1/0,r=1/0,n=-1/0,i=-1/0;for(const g of e)g.cx<a&&(a=g.cx),g.cz<r&&(r=g.cz),g.cx>n&&(n=g.cx),g.cz>i&&(i=g.cz);e.length||(a=r=n=i=0);const l=n-a+1,s=i-r+1,c=t["0,0"]??Object.values(t)[0];if(!c)throw new Error("No imagery patches to composite.");const u=Math.min(1,o/(l*c.width),o/(s*c.height)),d=Math.max(1,Math.round(c.width*u)),f=Math.max(1,Math.round(c.height*u)),h=l*d,p=s*f,m=new Uint8ClampedArray(h*p*4);for(let g=0;g<m.length;g+=4)m[g]=216,m[g+1]=216,m[g+2]=216,m[g+3]=255;for(const g of e){const S=t[`${g.cx},${g.cz}`];if(!S)continue;const b=(g.cx-a)*d,v=(g.cz-r)*f;for(let x=0;x<f;x++){const k=f>1?x/(f-1):0;for(let w=0;w<d;w++){const y=d>1?w/(d-1):0;Ea(S,y,k,m,((v+x)*h+b+w)*4)}}}return{rgba:m,width:h,height:p,preview:Fa(m,h,p),bounds:{minX:a,minZ:r,maxX:n,maxZ:i,cols:l,rows:s}}}const Ba=`
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec3 uSkySunColor;
uniform vec3 uSkyFogColor;
uniform vec3 uSkySunDir;
uniform float uSkyLightIntensity;
uniform float uSkyBrightness;
uniform float uSkyHaze;
uniform float uSkyStars;
uniform float uSkyHdrIntensity;
uniform float uSkySunGlow;
uniform float uSkyHorizonGlow;
uniform vec3 uSkyAtmosphereTint;
`,Wa=`
vec3 evaluateProceduralSkyLinear(
  vec3 direction,
  float sunDiscStrength,
  float starStrength
) {
  vec3 dir = normalize(direction);
  float y = dir.y;

  float horizonBlend = 1.0 - pow(max(y, 0.0), 0.45);
  vec3 skyCol = mix(uSkyZenith, uSkyHorizon, horizonBlend) * uSkyAtmosphereTint;

  float hazeBand = exp(-abs(y) * 8.0);
  skyCol = mix(skyCol, uSkyFogColor, hazeBand * uSkyHaze);
  if (y < 0.0) {
    float belowBlend = clamp(-y * 5.0, 0.0, 1.0);
    skyCol = mix(skyCol, uSkyFogColor, belowBlend);
  }

  float sunDot = max(dot(dir, normalize(uSkySunDir)), 0.0);
  float sunDisc = smoothstep(0.9994, 0.9998, sunDot);
  float sunGlow = pow(sunDot, 256.0) * 0.8;
  float sunHalo = pow(sunDot, 32.0) * 0.25;
  float sunScatter = pow(sunDot, 8.0) * 0.08;
  vec3 sunCol = uSkySunColor * uSkyLightIntensity;
  skyCol += sunCol * (
    sunDisc * 3.0 * sunDiscStrength
    + sunGlow * mix(0.35, 1.0, sunDiscStrength)
    + sunHalo * uSkySunGlow
  ) * uSkySunGlow;

  float scatterMask = exp(-abs(y) * 3.0);
  skyCol += uSkySunColor * sunScatter * scatterMask * uSkyLightIntensity;

  float horizonWarmth = pow(sunDot, 4.0) * hazeBand * 0.3;
  skyCol += uSkySunColor * horizonWarmth * uSkyLightIntensity * (1.0 + uSkyHorizonGlow);
  skyCol += uSkyHorizon * hazeBand * uSkyHorizonGlow * 0.35;

  float nightFactor = smoothstep(0.15, -0.1, uSkySunDir.y)
    * uSkyStars * starStrength;
  if (nightFactor > 0.01 && y > 0.0) {
    vec3 starGrid = floor(dir * 300.0);
    vec3 p = fract(starGrid * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    float starHash = fract((p.x + p.y) * p.z);
    float star = step(0.998, starHash) * pow(max(y, 0.0), 0.3);
    float twinkle = 0.7 + 0.3 * sin(starHash * 6283.0 + starGrid.x * 0.5);
    skyCol += vec3(0.8, 0.85, 1.0) * star * twinkle * nightFactor * 0.6;
  }

  return max(skyCol * uSkyBrightness * uSkyHdrIntensity, vec3(0.0));
}
`;function Ia(){return{uSkyZenith:{value:new Y(.18,.35,.72)},uSkyHorizon:{value:new Y(.5,.62,.78)},uSkySunColor:{value:new Y(1,.98,.92)},uSkyFogColor:{value:new Y(.55,.62,.75)},uSkySunDir:{value:new I(.5,.7,.3).normalize()},uSkyLightIntensity:{value:1},uSkyBrightness:{value:1},uSkyHaze:{value:.55},uSkyStars:{value:1},uSkyHdrIntensity:{value:1.08},uSkySunGlow:{value:1},uSkyHorizonGlow:{value:.35},uSkyAtmosphereTint:{value:new Y(1,.98,.92)}}}function Oa(t){return Object.fromEntries(Object.entries(t).map(([e,o])=>[e,Tt(o)]))}function j(t,e){const o=_t[t];return Object.freeze({label:o.label,description:o.description,nodePreset:t,palette:Oa(e)})}const vt=Object.freeze({"terrain-alpine":j("alpine",{deep:"#0b1b24",shallow:"#244c58",sand:"#776f5e",dune:"#887e69",dryGrass:"#6b725b",grass:"#59634e",forest:"#25362f",jungle:"#1c2c27",swamp:"#314842",tundra:"#766f62",redRock:"#695a4c",redRock2:"#877363",rock:"#766f62",rockHi:"#979186",snow:"#b7b0a2",foam:"#dce5e2"}),"terrain-temperate":j("temperate",{deep:"#0c2027",shallow:"#315763",sand:"#80745a",dune:"#918466",dryGrass:"#596348",grass:"#40563b",forest:"#1e3128",jungle:"#172820",swamp:"#29433a",tundra:"#746b52",redRock:"#66523f",redRock2:"#806c52",rock:"#746b52",rockHi:"#918c7d",snow:"#aaa596",foam:"#d8e1dc"}),"terrain-arid":j("arid",{deep:"#18303a",shallow:"#42616a",sand:"#a88b68",dune:"#c0aa8b",dryGrass:"#a18361",grass:"#927055",forest:"#6b5844",jungle:"#514a35",swamp:"#536054",tundra:"#9d826a",redRock:"#8a5841",redRock2:"#a46c4d",rock:"#8a5841",rockHi:"#a77d65",snow:"#c0aa8b",foam:"#e4ddd0"}),"terrain-volcanic":j("volcanic",{deep:"#080b0d",shallow:"#202a2c",sand:"#44372f",dune:"#55443a",dryGrass:"#35352e",grass:"#2d302c",forest:"#171a18",jungle:"#101311",swamp:"#202521",tundra:"#55443a",redRock:"#744131",redRock2:"#98523a",rock:"#55443a",rockHi:"#6f685f",snow:"#928b7f",foam:"#c0b6a6"}),"terrain-coastal":j("coastal",{deep:"#092735",shallow:"#276273",sand:"#afa37c",dune:"#c0b58e",dryGrass:"#647059",grass:"#4d6049",forest:"#34483e",jungle:"#263b32",swamp:"#34534c",tundra:"#74766c",redRock:"#6b6256",redRock2:"#83796c",rock:"#74766c",rockHi:"#92938a",snow:"#aaa99f",foam:"#e1e7e3"}),"terrain-river":j("river",{deep:"#09292f",shallow:"#28636b",sand:"#81745a",dune:"#9a8966",dryGrass:"#687052",grass:"#536448",forest:"#183a38",jungle:"#12312f",swamp:"#183a38",tundra:"#81745a",redRock:"#6e5947",redRock2:"#88705a",rock:"#81745a",rockHi:"#8e8876",snow:"#9b9b91",foam:"#d5e2df"}),"terrain-canyon":j("canyon",{deep:"#162c35",shallow:"#3d6670",sand:"#b98c5f",dune:"#c4a57f",dryGrass:"#8d704e",grass:"#76503c",forest:"#3a302b",jungle:"#2d2723",swamp:"#3d5147",tundra:"#a06d48",redRock:"#76503c",redRock2:"#a06d48",rock:"#a06d48",rockHi:"#ae8864",snow:"#c4a57f",foam:"#e5ded2"}),"terrain-dunes":j("dunes",{deep:"#17323d",shallow:"#446a72",sand:"#c79a62",dune:"#e0c18e",dryGrass:"#b18859",grass:"#a47b50",forest:"#6a5541",jungle:"#514334",swamp:"#4b5a4d",tundra:"#b99163",redRock:"#8f5f3f",redRock2:"#b77849",rock:"#c79a62",rockHi:"#d2ad78",snow:"#e0c18e",foam:"#eee3ce"})}),Wo=Object.freeze(Object.entries(vt).map(([t,e])=>Object.freeze({value:t,label:e.label,nodePreset:e.nodePreset}))),Qe={...vt,earth:{label:"지구",palette:ct()},desert:{label:"사막 행성",palette:{deep:[.08,.05,.03],shallow:[.35,.22,.12],sand:[.82,.68,.38],dune:[.9,.72,.4],dryGrass:[.65,.48,.22],grass:[.55,.42,.18],forest:[.42,.32,.14],jungle:[.38,.3,.12],swamp:[.35,.28,.14],tundra:[.72,.62,.42],redRock:[.72,.38,.18],redRock2:[.85,.5,.22],rock:[.55,.42,.28],rockHi:[.68,.55,.38],snow:[.95,.9,.82],foam:[.92,.85,.72]}},ice:{label:"얼음 행성",palette:{deep:[.02,.06,.14],shallow:[.12,.35,.55],sand:[.55,.62,.72],dune:[.62,.7,.8],dryGrass:[.45,.55,.65],grass:[.35,.5,.62],forest:[.22,.38,.48],jungle:[.18,.32,.42],swamp:[.15,.28,.38],tundra:[.72,.78,.85],redRock:[.45,.52,.62],redRock2:[.58,.65,.75],rock:[.38,.45,.55],rockHi:[.55,.62,.72],snow:[.92,.95,.98],foam:[.88,.94,.98]}},toxic:{label:"독성 외계",palette:{deep:[.02,.1,.05],shallow:[.08,.45,.22],sand:[.35,.55,.18],dune:[.42,.62,.22],dryGrass:[.28,.48,.12],grass:[.18,.55,.15],forest:[.08,.42,.1],jungle:[.05,.38,.08],swamp:[.12,.35,.18],tundra:[.25,.45,.28],redRock:[.45,.55,.12],redRock2:[.55,.65,.18],rock:[.18,.28,.15],rockHi:[.28,.38,.22],snow:[.75,.92,.55],foam:[.65,.95,.45]}},fungal:{label:"보라 균류",palette:{deep:[.06,.02,.12],shallow:[.28,.12,.42],sand:[.55,.35,.62],dune:[.62,.42,.68],dryGrass:[.42,.25,.48],grass:[.32,.18,.42],forest:[.22,.1,.32],jungle:[.18,.08,.28],swamp:[.25,.12,.35],tundra:[.48,.38,.55],redRock:[.58,.28,.52],redRock2:[.68,.38,.58],rock:[.32,.22,.38],rockHi:[.45,.32,.48],snow:[.85,.78,.92],foam:[.82,.72,.95]}},canyon:{label:"레드 캐년",palette:{deep:[.08,.03,.02],shallow:[.32,.12,.08],sand:[.78,.45,.22],dune:[.85,.52,.25],dryGrass:[.62,.35,.18],grass:[.48,.28,.14],forest:[.35,.2,.1],jungle:[.3,.18,.08],swamp:[.28,.18,.12],tundra:[.65,.42,.28],redRock:[.82,.32,.15],redRock2:[.92,.45,.18],rock:[.55,.28,.15],rockHi:[.72,.38,.2],snow:[.92,.85,.78],foam:[.9,.8,.72]}},volcanic:{label:"화산성",palette:{deep:[.02,.02,.03],shallow:[.12,.08,.06],sand:[.35,.22,.15],dune:[.42,.28,.18],dryGrass:[.28,.18,.12],grass:[.22,.15,.1],forest:[.15,.1,.08],jungle:[.12,.08,.06],swamp:[.1,.08,.06],tundra:[.32,.25,.22],redRock:[.55,.18,.08],redRock2:[.72,.28,.1],rock:[.18,.14,.12],rockHi:[.28,.22,.2],snow:[.55,.52,.5],foam:[.85,.55,.25]}},tropical:{label:"열대 해양",palette:{deep:[.01,.08,.18],shallow:[.05,.42,.48],sand:[.88,.82,.62],dune:[.92,.85,.65],dryGrass:[.45,.52,.22],grass:[.15,.42,.18],forest:[.05,.32,.12],jungle:[.03,.28,.1],swamp:[.08,.25,.12],tundra:[.35,.48,.38],redRock:[.52,.32,.22],redRock2:[.62,.42,.28],rock:[.32,.35,.28],rockHi:[.45,.48,.38],snow:[.95,.98,.95],foam:[.9,.98,.95]}},cartoon:{label:"만화 지형",palette:{deep:[.02,.18,.55],shallow:[.02,.55,.85],sand:[1,.86,.32],dune:[1,.68,.24],dryGrass:[.78,.86,.2],grass:[.18,.78,.18],forest:[.02,.5,.16],jungle:[0,.4,.18],swamp:[.1,.44,.26],tundra:[.62,.86,.82],redRock:[.9,.3,.18],redRock2:[1,.48,.22],rock:[.44,.42,.48],rockHi:[.64,.62,.7],snow:[.98,.98,.92],foam:[1,1,.92]}},neon:{label:"네온 사이파이",palette:{deep:[.02,0,.08],shallow:[.1,.05,.45],sand:[.55,.15,.65],dune:[.62,.22,.72],dryGrass:[.35,.12,.55],grass:[.12,.55,.45],forest:[.05,.35,.55],jungle:[.05,.28,.48],swamp:[.08,.22,.42],tundra:[.35,.25,.55],redRock:[.75,.12,.55],redRock2:[.85,.22,.62],rock:[.15,.12,.25],rockHi:[.28,.22,.38],snow:[.75,.85,.98],foam:[.55,.95,.85]}},moon:{label:"황무지 달",palette:{deep:[.04,.04,.05],shallow:[.12,.12,.14],sand:[.52,.5,.48],dune:[.58,.56,.54],dryGrass:[.45,.43,.41],grass:[.4,.38,.36],forest:[.35,.33,.31],jungle:[.32,.3,.28],swamp:[.28,.26,.24],tundra:[.62,.6,.58],redRock:[.48,.44,.4],redRock2:[.55,.5,.45],rock:[.32,.3,.28],rockHi:[.45,.43,.41],snow:[.88,.88,.9],foam:[.85,.85,.88]}},methane:{label:"얼어붙은 메탄",palette:{deep:[.02,.05,.12],shallow:[.08,.22,.42],sand:[.35,.55,.72],dune:[.42,.62,.78],dryGrass:[.28,.48,.65],grass:[.22,.42,.58],forest:[.15,.32,.48],jungle:[.12,.28,.42],swamp:[.1,.22,.35],tundra:[.55,.68,.82],redRock:[.32,.48,.62],redRock2:[.42,.58,.72],rock:[.22,.35,.48],rockHi:[.35,.48,.62],snow:[.82,.9,.95],foam:[.78,.88,.95]}},rust:{label:"녹슨 행성",palette:{deep:[.06,.02,.01],shallow:[.28,.1,.05],sand:[.72,.35,.15],dune:[.78,.42,.18],dryGrass:[.58,.28,.12],grass:[.48,.22,.1],forest:[.38,.18,.08],jungle:[.32,.15,.06],swamp:[.25,.12,.06],tundra:[.62,.38,.22],redRock:[.85,.28,.1],redRock2:[.92,.38,.12],rock:[.48,.22,.1],rockHi:[.62,.32,.15],snow:[.88,.72,.58],foam:[.85,.65,.45]}},pastel:{label:"파스텔 외계",palette:{deep:[.55,.62,.78],shallow:[.68,.75,.88],sand:[.92,.82,.75],dune:[.95,.85,.78],dryGrass:[.85,.78,.72],grass:[.72,.88,.75],forest:[.62,.82,.72],jungle:[.58,.78,.68],swamp:[.65,.75,.82],tundra:[.88,.85,.92],redRock:[.92,.72,.78],redRock2:[.95,.78,.82],rock:[.78,.72,.75],rockHi:[.85,.8,.82],snow:[.98,.95,.98],foam:[.95,.92,.98]}},monolith:{label:"모놀리스",palette:{deep:[.1,.1,.11],shallow:[.32,.32,.34],sand:[.8,.79,.77],dune:[.84,.83,.81],dryGrass:[.72,.71,.69],grass:[.68,.67,.65],forest:[.62,.61,.59],jungle:[.58,.57,.55],swamp:[.55,.54,.52],tundra:[.76,.75,.73],redRock:[.64,.5,.35],redRock2:[.74,.58,.41],rock:[.58,.46,.33],rockHi:[.78,.64,.46],snow:[.87,.74,.56],foam:[.88,.88,.87]}},obsidian:{label:"어둠의 흑요석",palette:{deep:[.01,.01,.02],shallow:[.05,.05,.08],sand:[.12,.1,.12],dune:[.15,.12,.15],dryGrass:[.1,.08,.1],grass:[.08,.06,.08],forest:[.05,.04,.06],jungle:[.04,.03,.05],swamp:[.06,.05,.07],tundra:[.18,.16,.18],redRock:[.22,.08,.1],redRock2:[.32,.12,.14],rock:[.08,.07,.09],rockHi:[.15,.14,.16],snow:[.35,.32,.38],foam:[.55,.45,.5]}},biolum:{label:"생물 발광",palette:{deep:[.01,.03,.08],shallow:[.05,.15,.35],sand:[.15,.35,.42],dune:[.18,.42,.48],dryGrass:[.1,.38,.35],grass:[.05,.55,.42],forest:[.02,.42,.35],jungle:[.02,.38,.3],swamp:[.05,.32,.38],tundra:[.12,.35,.45],redRock:[.35,.12,.55],redRock2:[.45,.18,.62],rock:[.08,.12,.18],rockHi:[.12,.22,.28],snow:[.55,.85,.78],foam:[.45,.92,.75]}}};function Io(t){return Qe[t]??Qe.earth}const Ha=[{key:"random",label:"무작위"},{key:"earth",label:"Earth-like"},{key:"alien",label:"에일리언"},{key:"desert",label:"사막"},{key:"ice",label:"Ice"},{key:"toxic",label:"유독성"},{key:"volcanic",label:"화산성"},{key:"fungal",label:"균사체"}];function Ga(t){return function(){t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function Ye(t,e,o){const a=(1-Math.abs(2*o-1))*e,r=a*(1-Math.abs(t/60%2-1)),n=o-a/2;let i=0,l=0,s=0;return t<60?(i=a,l=r):t<120?(i=r,l=a):t<180?(l=a,s=r):t<240?(l=r,s=a):t<300?(i=r,s=a):(i=a,s=r),[i+n,l+n,s+n]}function F(t,e,o=.08){return t.map(a=>Math.max(0,Math.min(1,a+(e()-.5)*o)))}function Te(t){return t.map(e=>Math.max(0,Math.min(1,e)))}function xe(t,e,o){return Te(t.map((a,r)=>a*(1-o)+e[r]*o))}const Be={earth:{hueBase:200,hueSpread:30,sat:[.35,.65],lit:[.35,.55],waterHue:-10},alien:{hueBase:null,hueSpread:360,sat:[.5,.9],lit:[.3,.6],waterHue:-25},desert:{hueBase:35,hueSpread:20,sat:[.4,.7],lit:[.45,.7],waterHue:15},ice:{hueBase:205,hueSpread:25,sat:[.15,.45],lit:[.55,.85],waterHue:0},toxic:{hueBase:110,hueSpread:40,sat:[.55,.85],lit:[.35,.55],waterHue:-20},volcanic:{hueBase:15,hueSpread:25,sat:[.2,.5],lit:[.2,.45],waterHue:-5},fungal:{hueBase:285,hueSpread:30,sat:[.4,.7],lit:[.35,.6],waterHue:-15}},Je=Object.keys(Be);function Na(t,e){return t&&t!=="random"&&Be[t]?t:Je[Math.floor(e()*Je.length)]}function et(t,[e,o]){return e+t()*(o-e)}function Ua(t,e){const o=t.hueBase!=null?t.hueBase+(e()-.5)*t.hueSpread:e()*360,a=et(e,t.sat),r=et(e,t.lit),n=(o+t.waterHue)%360,i=(c,u=1,d=1)=>Ye((o+c)%360,Math.min(1,a*u),Math.max(.05,Math.min(.92,r*d))),l=(c,u=1,d=1)=>Ye((n+c)%360,Math.min(1,a*u),Math.max(.05,Math.min(.92,r*d))),s=ct(Oe);s.deep=F(l(-20,1.2,.35),e,.04),s.shallow=F(l(-8,1,.55),e,.05),s.foam=F(l(5,.5,.88),e,.03),s.sand=F(i(25,.7,1.15),e,.06),s.dune=F(i(30,.65,1.2),e,.05),s.dryGrass=F(i(50,.8,.85),e,.06),s.grass=F(i(90,1,.55),e,.05),s.forest=F(i(110,1.1,.38),e,.04),s.jungle=F(i(115,1.15,.32),e,.04),s.swamp=F(i(140,.9,.35),e,.05),s.tundra=F(i(200,.25,.78),e,.04),s.redRock=F(i(-50,.85,.48),e,.05),s.redRock2=F(i(-40,.9,.58),e,.05),s.rock=F(i(0,.15,.38),e,.04),s.rockHi=F(i(5,.12,.52),e,.04),s.snow=F(i(210,.08,.92),e,.03);for(const c of Ft)s[c]||(s[c]=[...Oe[c]]);return s}function $a(t,e){const o=xe(t.shallow,t.deep,.35),a=xe(o,[.55,.65,.82],e==="ice"?.55:.4),r=xe(t.sand,t.dryGrass,.5),n=xe(r,t.rock,.35);return{skyAmbient:Te(a),groundBounce:Te(n)}}function Oo(t=Date.now(),e="random"){var s;const o=Ga(t>>>0),a=Na(e,o),r=Be[a],n=Ua(r,o),i=$a(n,a),l=((s=Ha.find(c=>c.key===a))==null?void 0:s.label)??a;return{palette:n,skyAmbient:i.skyAmbient,groundBounce:i.groundBounce,seed:t>>>0,type:a,typeLabel:l,alien:a==="alien"||a==="toxic"||a==="fungal"}}const tt={default:{label:"기본",params:{}},smooth:{label:"부드러운 롤링",params:{terrainSmoothing:.45,ridge:.18,warp:.6,persistence:.42,lacunarity:2,noiseStrength:.85,falloff:.4}},rugged:{label:"울퉁불퉁한 산맥",params:{ridge:.92,warp:.5,persistence:.55,lacunarity:2.2,noiseStrength:1.15,heightScale:680}},eroded:{label:"Eroded Badlands",params:{ridge:.35,warp:2.2,persistence:.48,lacunarity:2.5,moistBias:-.4,tempBias:.3}},dunes:{label:"사구 지대",params:{ridge:.08,warp:1.9,persistence:.38,noiseScale:58,moistBias:-.8,tempBias:.55,heightScale:160}},crystalline:{label:"수정 첨탑",params:{ridge:.78,warp:1.4,persistence:.62,lacunarity:2.8,noiseStrength:1.2,octaves:8}},fractured:{label:"균열된 플레이트",params:{ridge:.65,warp:2.8,persistence:.52,lacunarity:2.6,noiseScale:35,falloff:.25}},alien:{label:"에일리언 지형",params:{ridge:.55,warp:2,persistence:.58,lacunarity:2.7,noiseScale:48,biomeScale:1.4,moistBias:.1}},cartoon:{label:"단순 만화",params:{terrainSmoothing:.28,ridge:.16,warp:.28,persistence:.36,lacunarity:1.85,noiseStrength:.72,noiseScale:72,octaves:4,heightScale:260,falloff:.35,biomeScale:.7,moistScale:.8,snowLine:.82,normalStrength:.8,aoStrength:.35}},flat:{label:"낮은 relief",params:{terrainSmoothing:.35,ridge:.05,warp:.3,persistence:.35,noiseStrength:.6,heightScale:120,falloff:.2}}};function Ho(t){return tt[t]??tt.default}const M=(t,e)=>Pt(t,e),We={classic:{label:"클래식 지형",build:()=>W([M("legacy",{name:"클래식 지형",blendMode:"replace"})])},rollingHills:{label:"구르는 언덕",build:()=>W([M("fbm",{name:"기본",blendMode:"add",strength:.5,params:{scale:1,octaves:4,persistence:.5}}),M("billow",{name:"부드러운 언덕",blendMode:"add",strength:.25,params:{scale:2.2,octaves:3}}),M("fbm",{name:"디테일",blendMode:"add",strength:.06,params:{scale:6,octaves:3}})])},sharpMountains:{label:"Sharp Mountains",build:()=>W([M("fbm",{name:"대륙",blendMode:"add",strength:.45,params:{scale:.6,octaves:4}}),M("domainWarp",{name:"Breakup Warp",blendMode:"add",strength:.6,params:{scale:1.2}}),M("ridged",{name:"산등성이",blendMode:"add",strength:.9,params:{scale:2.4,octaves:5,sharpness:2.5}}),M("fbm",{name:"작은 디테일",blendMode:"add",strength:.05,params:{scale:8,octaves:3}})])},canyonTerraces:{label:"협곡 단구",build:()=>W([M("fbm",{name:"기본",blendMode:"add",strength:.5,params:{scale:.8,octaves:4}}),M("ridged",{name:"Mesa Edges",blendMode:"add",strength:.35,params:{scale:2,octaves:4,sharpness:3}}),M("terrace",{name:"지층",blendMode:"replace",strength:.9,params:{count:14,smoothness:.35}})])},desertDunes:{label:"사막 모래언덕",build:()=>W([M("fbm",{name:"기본",blendMode:"add",strength:.3,params:{scale:.6,octaves:3}}),M("dune",{name:"Dunes",blendMode:"add",strength:.35,params:{scale:1.4}}),M("white",{name:"그레인",blendMode:"add",strength:.02,params:{scale:10}})])},moonCraters:{label:"달 분화구",build:()=>W([M("fbm",{name:"레골리스",blendMode:"add",strength:.25,params:{scale:1.2,octaves:4}}),M("crater",{name:"큰 분화구",blendMode:"add",strength:.7,params:{scale:1,density:.5,depth:.7,rim:.35}}),M("crater",{name:"작은 분화구",blendMode:"add",strength:.35,params:{scale:3.5,density:.4,depth:.4,rim:.2}})])},alienCellular:{label:"에일리언 셀룰러",build:()=>W([M("fbm",{name:"기본",blendMode:"add",strength:.3,params:{scale:.8,octaves:3}}),M("voronoi",{name:"플레이트",blendMode:"add",strength:.5,params:{scale:1.8,jitter:1,outputMode:3}}),M("domainWarp",{name:"비틀기",blendMode:"add",strength:.8,params:{scale:1.5}})])},islandContinents:{label:"섬 대륙",build:()=>W([M("fbm",{name:"대륙",blendMode:"add",strength:.7,params:{scale:.4,octaves:5}}),M("billow",{name:"Coastal Hills",blendMode:"add",strength:.15,params:{scale:2,octaves:3}}),M("fbm",{name:"디테일",blendMode:"add",strength:.05,params:{scale:7,octaves:3}})])},erodedValleys:{label:"침식된 계곡",build:()=>W([M("ridged",{name:"고지대",blendMode:"add",strength:.7,params:{scale:1.4,octaves:5,sharpness:1.8}}),M("flow",{name:"River Carving",blendMode:"subtract",strength:.4,params:{scale:.8}}),M("fbm",{name:"디테일",blendMode:"add",strength:.06,params:{scale:8,octaves:3}})])},geologicalHybrid:{label:"지질 하이브리드",terrainParams:{heightScale:620,noiseScale:42,noiseStrength:1,terrainSmoothing:0,normalStrength:1.4,aoStrength:.88,aoRidge:.28,rockSlopeLo:.34,rockSlopeHi:.64,snowSlopeMin:.24,snowSlopeMax:.56,snowLine:.76},build:()=>W([M("domainWarp",{name:"Geological Warp",blendMode:"add",strength:.62,params:{scale:.58,octaves:4}}),M("fbm",{name:"테라스식 산괴",blendMode:"add",strength:.68,params:{scale:.55,octaves:6,persistence:.51,lacunarity:2.03,erosion:.12,warp:.18}}),M("terrace",{name:"풍화된 테라스",blendMode:"replace",strength:.68,params:{count:7,smoothness:.34}}),M("fbm",{name:"Derivative Weathering",blendMode:"add",strength:.2,params:{scale:.72,octaves:6,persistence:.51,lacunarity:2.03,erosion:.62,warp:.25}}),M("ridged",{name:"Rock Ridges",blendMode:"add",strength:.12,params:{scale:1.7,octaves:6,persistence:.51,lacunarity:2.03,sharpness:2.25,erosion:.28,warp:.2}}),M("fbm",{name:"Fine Geological Detail",blendMode:"add",strength:.05,params:{scale:2.9,octaves:4,persistence:.48,lacunarity:2.08,erosion:.16,warp:0}})],{normalizeOutput:!0,outputMin:.05,outputMax:.92})},alpineRanges:{label:"Alpine Ranges",build:()=>W([M("fbm",{name:"Massif Base",blendMode:"add",strength:.42,params:{scale:.55,octaves:4,persistence:.5,erosion:.25,warp:.45}}),M("domainWarp",{name:"Range Bend",blendMode:"add",strength:.7,params:{scale:.9,octaves:3}}),M("ridged",{name:"Eroded Ridges",blendMode:"add",strength:.85,params:{scale:2,octaves:6,sharpness:2.2,erosion:.55,warp:.4}}),M("fbm",{name:"Scree Detail",blendMode:"add",strength:.07,params:{scale:7,octaves:3,erosion:.2,warp:0},masks:[{type:"slope",enabled:!0,invert:!1,params:{min:.18,max:1,falloff:.12}}]})],{normalizeOutput:!0,outputMin:0,outputMax:1.15})},graniteSpires:{label:"Granite Spires",build:()=>W([M("fbm",{name:"Valley Floor",blendMode:"add",strength:.28,params:{scale:.7,octaves:4,persistence:.48,erosion:.3,warp:.3}}),M("ridged",{name:"Spire Clusters",blendMode:"add",strength:1.05,params:{scale:2.6,octaves:6,sharpness:3.4,erosion:.3,warp:.65},masks:[{type:"noise",enabled:!0,invert:!1,params:{scale:.5,threshold:.58,softness:.14}}]}),M("fbm",{name:"Talus & Scree",blendMode:"add",strength:.09,params:{scale:6,octaves:3,erosion:.15,warp:0},masks:[{type:"slope",enabled:!0,invert:!1,params:{min:.22,max:1,falloff:.1}}]})],{normalizeOutput:!0,outputMin:0,outputMax:1.25})},foothillRanges:{label:"Foothill Ranges",build:()=>W([M("fbm",{name:"Rolling Base",blendMode:"add",strength:.45,params:{scale:1.1,octaves:5,persistence:.47,erosion:.35,warp:.35}}),M("domainWarp",{name:"Flow Warp",blendMode:"add",strength:.5,params:{scale:1.1,octaves:3}}),M("ridged",{name:"Mountain Belts",blendMode:"add",strength:.55,params:{scale:1.6,octaves:5,sharpness:1.9,erosion:.5,warp:.3},masks:[{type:"noise",enabled:!0,invert:!1,params:{scale:.35,threshold:.55,softness:.2}}]}),M("fbm",{name:"Soft Detail",blendMode:"add",strength:.05,params:{scale:8,octaves:3,erosion:.1,warp:0}})],{normalizeOutput:!0,outputMin:0,outputMax:1.05})}},Go=Object.keys(We);function No(t){const e=We[t];return e?e.build():null}function Uo(t){const e=We[t];return e?{stack:e.build(),terrainParams:{...e.terrainParams||{}}}:null}function T(t){return t<0?0:t>1?1:t}function E(t,e,o){const a=T((o-t)/(e-t||1e-4));return a*a*(3-2*a)}const Z={UPRIGHT:"upright",NORMAL:"normal",BLEND:"blend"},V={EXCLUDE:"exclude",SHORELINE:"shoreline",SHALLOW:"shallow"};function bt(t,e){const o=e.shoreDistance;if(t.waterRule===V.SHORELINE){const r=t.shoreMin??.2,n=t.shoreMax??6;return E(r-1.2,r+.4,o)*(1-E(n,n+2,o))}if(t.waterRule===V.SHALLOW)return o>-(t.shallowDepth??1.5)?1:0;const a=t.waterClearance??1.5;return o>a?1:E(a-1,a,o)}function xt(t,e){const[o,a]=t.slopeRange??[0,1];return E(o-.06,o+.04,e.slope)*(1-E(a-.05,a+.08,e.slope))}function yt(t,e){if(!t.heightRange)return 1;const[o,a]=t.heightRange;let r=1;return o!=null&&(r*=E(o-8,o+8,e.height)),a!=null&&(r*=1-E(a-8,a+8,e.height)),r}function ja(t,e){if((e.excludeProps??0)>.45||e.water)return 0;const o=bt(t,e),a=xt(t,e),r=yt(t,e);if(o<=0||a<=0||r<=0)return 0;const n=t.biomeScore?T(t.biomeScore(e)):1;return T(o*a*r*n*(t.density??1))}const ye=[{id:"grass",render:"grass",cellSize:8,density:.92,densityParam:"propsGrassDensity",scaleParam:"propsGrass",waterRule:V.EXCLUDE,waterClearance:1.2,slopeRange:[0,.34],scaleRange:[.25,.75],alignMode:Z.BLEND,alignAmount:.45,rootDepth:.05,biomeScore:t=>{const e=t.biomeWeights,o=Math.max(e.desert,e.canyon),a=T(1-Math.max(o,e.mountains*.55));return(1-o*.9)*(.18+t.moisture*.72+a*.34+e.wetland*.2)}},{id:"flower",render:"flower",cellSize:13,density:.34,densityParam:"propsFlowers",waterRule:V.EXCLUDE,waterClearance:1.8,slopeRange:[0,.22],scaleRange:[.25,.9],alignMode:Z.UPRIGHT,alignAmount:0,rootDepth:.04,biomeScore:t=>(1-t.biomeWeights.desert)*(1-t.biomeWeights.canyon)*(1-t.biomeWeights.mountains*.75)*E(.3,.78,t.moisture)},{id:"rock",render:"rock",cellSize:25,density:.34,densityParam:"propsRocks",scaleParam:"propsRockScale",waterRule:V.EXCLUDE,waterClearance:.8,slopeRange:[.015,.68],scaleRange:[.4,2.05],alignMode:Z.BLEND,alignAmount:.78,rootDepthRatio:.24,biomeScore:t=>.06+t.biomeWeights.desert*.78+t.biomeWeights.canyon*.92+t.biomeWeights.mountains*.72+T(t.slope*1.8)*.42-t.biomeWeights.wetland*.28-t.moisture*.12},{id:"broadleaf",render:"broadleaf",cellSize:20,density:.29,densityParam:"propsTreeDensity",scaleParam:"propsTreeScale",waterRule:V.EXCLUDE,waterClearance:3.5,slopeRange:[0,.27],scaleRange:[8,18],alignMode:Z.UPRIGHT,alignAmount:0,rootDepthRatio:.025,biomeScore:t=>{const e=t.biomeWeights,o=E(.26,.54,t.temperature)*(1-E(.82,.98,t.temperature));return T(1-Math.max(e.desert,e.canyon,e.mountains*.72))*o*E(.34,.78,t.moisture)*(1-e.wetland*.35)}},{id:"conifer",render:"conifer",cellSize:22,density:.3,densityParam:"propsTreeDensity",scaleParam:"propsTreeScale",waterRule:V.EXCLUDE,waterClearance:3,slopeRange:[0,.34],scaleRange:[10,24],alignMode:Z.UPRIGHT,alignAmount:0,rootDepthRatio:.02,biomeScore:t=>{const e=t.biomeWeights,o=1-E(.55,.82,t.temperature);return(1-Math.max(e.desert,e.canyon)*.92)*o*(.2+t.moisture*.62+e.mountains*.48)*(1-e.wetland*.55)}}];function N(t,e,o){return[t[0]+(e[0]-t[0])*o,t[1]+(e[1]-t[1])*o,t[2]+(e[2]-t[2])*o]}function qa(t){const e=t.biomeWeights,o=Math.max(e.desert,e.canyon);let a=N([.82,1.02,.72],[1.2,1.03,.62],T(1-t.moisture));a=N(a,[1.42,1.02,.55],o);const r=T(1-E(.18,.42,t.temperature));return N(a,[1.05,1.15,1.1],r*.7)}function Xa(t){const e=t.biomeWeights,o=T(1-E(.18,.42,t.temperature)),a=T((t.height||0)/Math.max(t.heightScale||560,1));let r=N([.62,.59,.53],[.82,.79,.71],T(a+t.slope*.45));return r=N(r,[.82,.52,.3],T(e.canyon*.9)),r=N(r,[.72,.62,.4],T(e.desert*.72)),r=N(r,[.42,.5,.37],T(e.wetland*t.moisture*.6)),N(r,[.86,.88,.86],o*(.45+a*.35))}function at(t,e=!1){const o=T(1-E(.18,.46,t.temperature)),a=T(1-t.moisture);let r=e?[.62,.83,.68]:[.78,1,.72];return r=N(r,e?[.74,.78,.58]:[1.02,.88,.55],a*.55),N(r,[.82,.9,.86],o*.35)}function Za(t){const e=[[1,.92,.68],[1,.58,.62],[.68,.72,1],[.94,.7,.96]];return e[Math.min(e.length-1,Math.floor(T(t)*e.length))]}function Fe(t){return t<0?0:t>1?1:t}function ot(t,e,o){return t<e?e:t>o?o:t}function L(t,e,o=0){let a=Math.imul(t|0,374761393)^Math.imul(e|0,668265263)^Math.imul(o|0,1442695041);return a=a^a>>>13|0,((Math.imul(a,1274126177)^a)>>>0)/4294967295}function rt(t,e,o,a=0){const n=Math.floor(t/96),i=Math.floor(e/96),l=t/96-n,s=e/96-i,c=l*l*(3-2*l),u=s*s*(3-2*s),d=L(n+a,i-a,o),f=L(n+1+a,i-a,o),h=L(n+a,i+1-a,o),p=L(n+1+a,i+1-a,o),m=d+(f-d)*c,g=h+(p-h)*c;return m+(g-m)*u}function Va(t,e,o){const a=ot(e.propsDensity??.65,0,2);let r=ot(e[t.densityParam]??1,0,2);const n=o.mask;let i=0;t.id==="grass"&&n&&(i=(n.grass||0)+(n.mixed||0)*.55),t.id==="flower"&&n&&(i=(n.flowers||0)+(n.mixed||0)*.45),t.id==="rock"&&n&&(i=n.rocks||0),(t.id==="broadleaf"||t.id==="conifer")&&n&&(i=n.trees||0),r+=i;const l=a*r*ja(t,o),s=(o.excludeProps??0)>.45||o.water?0:bt(t,o)*xt(t,o)*yt(t,o);return Fe(l+a*i*s*1.15)}function nt(t,e,o,{roll:a,macro:r=.5}={}){const n=Va(t,o,e);if(n<=0)return!1;const i=t.id==="rock"?.35+r*.9:t.id==="broadleaf"||t.id==="conifer"?Fe((r-.2)*1.35):.42+r*.72;return(a??0)<Fe(n*i)}function Ka(){const t=new J(1,.35).normalize();return{uTime:{value:0},uWindDir:{value:t},uWindStrength:{value:.22},uWindSpeed:{value:1.6},uGustScale:{value:.012},uGustIntensity:{value:.45}}}const Qa=`
attribute float aBend;
uniform float uTime;
uniform vec2  uWindDir;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform float uGustScale;
uniform float uGustIntensity;
uniform float uWindStrengthMul;
`,Ya=`
{
  #ifdef USE_INSTANCING
    vec2 iw = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
  #else
    vec2 iw = vec2(0.0);
  #endif
  float phase = dot(iw, vec2(1.0)) * uGustScale * 6.2831;
  float sway = sin(uTime * uWindSpeed + phase);
  float gust = sin(uTime * uWindSpeed * 0.37 + phase * 0.5) * uGustIntensity;
  float bend = pow(clamp(aBend, 0.0, 1.0), 1.5);
  float amt = (sway + gust) * uWindStrength * uWindStrengthMul * bend;
  transformed.x += uWindDir.x * amt;
  transformed.z += uWindDir.y * amt;
}
`;function Se(t,{strengthMul:e=1,name:o="wind"}={}){const a=new ut({vertexColors:!0,side:Ae});return a.name=o,a.onBeforeCompile=r=>{r.uniforms.uTime=t.uTime,r.uniforms.uWindDir=t.uWindDir,r.uniforms.uWindStrength=t.uWindStrength,r.uniforms.uWindSpeed=t.uWindSpeed,r.uniforms.uGustScale=t.uGustScale,r.uniforms.uGustIntensity=t.uGustIntensity,r.uniforms.uWindStrengthMul={value:e},r.vertexShader=Qa+r.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
`+Ya)},a.customProgramCacheKey=()=>`windprop:${e}`,a}function z(t,e,o){return Math.max(e,Math.min(o,t))}function $(t,e,o){return t+(e-t)*o}const it=Object.freeze([Object.freeze({grass:900,flowers:80,rocks:180,trees:440,distanceScale:.65,buildMs:1.5,grassDistance:140,nearDistance:80}),Object.freeze({grass:1800,flowers:180,rocks:320,trees:900,distanceScale:1,buildMs:2.5,grassDistance:220,nearDistance:180}),Object.freeze({grass:2800,flowers:260,rocks:480,trees:1400,distanceScale:1.15,buildMs:3,grassDistance:320,nearDistance:280}),Object.freeze({grass:5e3,flowers:450,rocks:800,trees:2500,distanceScale:1.35,buildMs:4,grassDistance:480,nearDistance:420})]),q=4,X=512,_=Object.freeze({grass:0,flower:1,broadleaf:2,conifer:3,bark:4});function we(t,e,o){const a=t%q,r=Math.floor(t/q),n=2/(X/q);return[(a+n+e*(1-n*2))/q,(r+n+o*(1-n*2))/q]}function St(){const t=new Uint8Array(X*X*4),e=X/q,o=(n,i,l,s,c)=>{const u=n%q,d=Math.floor(n/q),f=u*e+i,p=((d*e+l)*X+f)*4;t[p]=s[0],t[p+1]=s[1],t[p+2]=s[2],t[p+3]=c},a=(n,i,l)=>L(n+l*13,i-l*7,l*97);for(let n=0;n<e;n++){const i=n/(e-1);for(let l=0;l<e;l++){const s=l/(e-1);o(_.grass,l,n,[72,138,56],0),o(_.flower,l,n,[82,145,66],0),o(_.broadleaf,l,n,[82,146,72],0),o(_.conifer,l,n,[62,116,78],0);let c=0;for(let y=0;y<9;y++){const A=.08+y*.105,R=.48+a(y,3,1)*.5;if(i>R)continue;const D=i/R,B=A+Math.sin(D*2.4+y)*(.025+y%2*.01),C=(.022+a(y,5,2)*.018)*(1-D*.9);Math.abs(s-B)<C&&(c=255)}if(c){const y=.72+i*.28+a(l,n,3)*.08;o(_.grass,l,n,[82*y,156*y,66*y],c)}const u=Math.abs(s-.5-Math.sin(i*5)*.012)<.018&&i<.78,d=i>.28&&i<.54&&Math.abs(s-(.5+(i-.4)*1.2))<.04,f=s-.5,h=i-.82,p=Math.atan2(h,f)*5,m=.12+Math.cos(p)*.035,g=Math.hypot(f,h)<m;if(u||d||g){const y=g?[250,242,221]:[78,151,63];o(_.flower,l,n,y,255)}const S=(s-.5)/.47,b=(i-.52)/.46,v=S*S+b*b+(a(l>>2,n>>2,4)-.5)*.24,x=a(l,n,5)>.985&&v<.78;if(v<1&&!x){const y=.72+i*.25+a(l>>1,n>>1,6)*.16;o(_.broadleaf,l,n,[91*y,158*y,79*y],255)}let k=!1;for(let y=0;y<3;y++){const A=.08+y*.23,R=.62+y*.18;if(i>=A&&i<=R){const D=(i-A)/(R-A),B=(.46-y*.08)*(1-D);k||(k=Math.abs(s-.5)<B)}}if(k&&a(l,n,7)>.025){const y=.68+i*.2+a(l>>1,n>>1,8)*.12;o(_.conifer,l,n,[68*y,126*y,84*y],255)}const w=.62+a(l>>2,n,9)*.28+Math.sin(s*44)*.08;o(_.bark,l,n,[145*w,106*w,72*w],255)}}const r=new Gt(t,X,X,Nt,Ut);return r.name="procedural-props-foliage-atlas",r.colorSpace=$t,r.wrapS=r.wrapT=jt,r.minFilter=qt,r.magFilter=Xt,r.generateMipmaps=!0,r.needsUpdate=!0,r}function wt(){const t=[],e=[],o=[],a=[],r=[],n=(s,c,u,d=[1,1,1])=>(t.push(s[0],s[1],s[2]),a.push(c[0],c[1]),o.push(u),e.push(d[0],d[1],d[2]),t.length/3-1);return{addQuad:(s,c,u,d,f,h=0,p=1,m=[1,1,1])=>{const g=t.length/3;n(s,we(f,0,0),h,m),n(c,we(f,1,0),h,m),n(u,we(f,1,1),p,m),n(d,we(f,0,1),p,m),r.push(g,g+1,g+2,g,g+2,g+3)},finish:s=>{const c=new Vt;return c.name=s,c.setAttribute("position",new ue(t,3)),c.setAttribute("color",new ue(e,3)),c.setAttribute("aBend",new ue(o,1)),c.setAttribute("uv",new ue(a,2)),c.setIndex(r),c.computeVertexNormals(),c.computeBoundingSphere(),c}}}function ke(t,{angle:e=0,width:o=1,height:a=1,y:r=0,x:n=0,z:i=0,tile:l,bendBottom:s=0,bendTop:c=1}){const u=Math.cos(e)*o*.5,d=Math.sin(e)*o*.5;t.addQuad([n-u,r,i-d],[n+u,r,i+d],[n+u,r+a,i+d],[n-u,r+a,i-d],l,s,c)}function ae({name:t,cards:e,tile:o,width:a=1,height:r=1}){const n=wt();for(let i=0;i<e;i++)ke(n,{angle:i/e*Math.PI,width:a,height:r,tile:o});return n.finish(t)}function st(t,{height:e,bottomRadius:o,topRadius:a,segments:r=6}){for(let n=0;n<r;n++){const i=n/r*Math.PI*2,l=(n+1)/r*Math.PI*2;t.addQuad([Math.cos(i)*o,0,Math.sin(i)*o],[Math.cos(l)*o,0,Math.sin(l)*o],[Math.cos(l)*a,e,Math.sin(l)*a],[Math.cos(i)*a,e,Math.sin(i)*a],_.bark,0,.12)}}function de(t,e=!1){const o=t==="conifer"?_.conifer:_.broadleaf;if(e)return ae({name:`${t}-far`,cards:2,tile:o,width:t==="conifer"?.58:.72,height:1});const a=wt();if(t==="conifer"){st(a,{height:.78,bottomRadius:.045,topRadius:.018});const r=[{y:.18,h:.55,w:.62},{y:.38,h:.48,w:.49},{y:.57,h:.43,w:.36}];for(const n of r)for(let i=0;i<3;i++)ke(a,{angle:i*Math.PI/3,width:n.w,height:n.h,y:n.y,tile:o,bendBottom:.22,bendTop:.72})}else{st(a,{height:.64,bottomRadius:.06,topRadius:.025});const r=[[-.12,.43,.02,.56,.48],[.14,.48,-.05,.52,.46],[0,.55,.09,.62,.45]];for(const[n,i,l,s,c]of r)ke(a,{angle:.15,width:s,height:c,x:n,y:i,z:l,tile:o,bendBottom:.25,bendTop:.8}),ke(a,{angle:Math.PI*.5+.15,width:s,height:c,x:n,y:i,z:l,tile:o,bendBottom:.25,bendTop:.8})}return a.finish(`${t}-near`)}function Pe(t,e){const o=new Zt(1,t);o.name=e;const a=o.getAttribute("position"),r=[];for(let n=0;n<a.count;n++){const i=a.getX(n),l=a.getY(n),s=a.getZ(n),c=.84+Math.sin(i*4.9+s*2.7)*.1+Math.cos(l*6.1-i*2.2)*.06;a.setXYZ(n,i*c,Math.max(-.72,l*(.82+Math.sin(s*3.8)*.08)),s*c);const u=z(.68+l*.17+Math.sin(i*8.1+s*5.7)*.09,.42,1);r.push(u,u*.98,u*.92)}return o.setAttribute("color",new ue(r,3)),o.computeVertexNormals(),o.computeBoundingSphere(),o}function me(t,e,o=.42){return t.map=e,t.emissive&&(t.emissive.setHex(16777215),t.emissiveMap=e,t.emissiveIntensity=.48),t.alphaTest=o,t.transparent=!1,t.depthWrite=!0,t.side=Ae,t.needsUpdate=!0,t}function le(t){var r;const e=t.onBeforeCompile,o=(r=t.customProgramCacheKey)==null?void 0:r.bind(t),a={center:{value:new I},ranges:{value:new Jt(0,0,1e6,1000001)}};return t.userData.propFadeUniforms=a,t.onBeforeCompile=(n,i)=>{e==null||e(n,i),n.uniforms.uPropFadeCenter=a.center,n.uniforms.uPropFadeRanges=a.ranges,n.vertexShader=`varying vec3 vPropWorldPosition;
${n.vertexShader}`.replace("#include <project_vertex>",`vec4 propWorldPosition = vec4(transformed, 1.0);
      #ifdef USE_BATCHING
        propWorldPosition = batchingMatrix * propWorldPosition;
      #endif
      #ifdef USE_INSTANCING
        propWorldPosition = instanceMatrix * propWorldPosition;
      #endif
      vPropWorldPosition = (modelMatrix * propWorldPosition).xyz;
      #include <project_vertex>`),n.fragmentShader=`
      uniform vec3 uPropFadeCenter;
      uniform vec4 uPropFadeRanges;
      varying vec3 vPropWorldPosition;
      float propDither(vec2 p) {
        return fract(52.9829189 * fract(dot(floor(p), vec2(0.06711056, 0.00583715))));
      }
    ${n.fragmentShader}`.replace("#include <alphatest_fragment>",`#include <alphatest_fragment>
      float propDistance = distance(vPropWorldPosition, uPropFadeCenter);
      float propFadeIn = uPropFadeRanges.y <= 0.0
        ? 1.0 : smoothstep(uPropFadeRanges.x, uPropFadeRanges.y, propDistance);
      float propFadeOut = 1.0 - smoothstep(
        uPropFadeRanges.z, uPropFadeRanges.w, propDistance
      );
      if (propDither(gl_FragCoord.xy) > propFadeIn * propFadeOut) discard;`)},t.customProgramCacheKey=()=>`${(o==null?void 0:o())??t.type}:prop-distance-fade-v1`,t}function Ja(t){return Number.isFinite(Number(t==null?void 0:t.propQuality))?z(Math.round(t.propQuality),0,3):{performance:0,balanced:1,high:2,ultra:3}[t==null?void 0:t.preset]??2}function $o(t){const e=Et(t),o=St();let a,r;e.type==="rock"?(a=Pe(1,`preview-${e.id}`),r=new Ge({color:e.color,vertexColors:!0,roughness:.92,metalness:0})):(a=e.type==="grass"?ae({name:`preview-${e.id}`,cards:3,tile:_.grass,width:1.1}):e.type==="flower"?ae({name:`preview-${e.id}`,cards:2,tile:_.flower,width:.56}):de(e.type,!1),r=me(new Ge({color:e.color,roughness:.85,metalness:0}),o,e.type==="grass"||e.type==="flower"?.42:.46));const n=new Ht(a,r);return n.name=`prop-asset-preview-${e.id}`,n.scale.set(e.scale*e.width,e.scale*e.height,e.scale*e.width),n.userData.disposePreview=()=>{a.dispose(),r.dispose(),o.dispose()},n}function ce(){return{grass:[],flower:[],rock:[],broadleaf:[],conifer:[]}}class jo{constructor(e){this.scene=e,this.group=new Kt,this.group.name="procedural-props",this.scene.add(this.group),this.atlas=St(),this.grassNearGeometry=ae({name:"grass-near",cards:3,tile:_.grass,width:1.1}),this.grassMidGeometry=ae({name:"grass-mid",cards:2,tile:_.grass,width:1.25}),this.flowerGeometry=ae({name:"flowers",cards:2,tile:_.flower,width:.56}),this.rockNearGeometry=Pe(1,"rock-near"),this.rockFarGeometry=Pe(0,"rock-far"),this.broadleafNearGeometry=de("broadleaf",!1),this.broadleafFarGeometry=de("broadleaf",!0),this.coniferNearGeometry=de("conifer",!1),this.coniferFarGeometry=de("conifer",!0),this.windUniforms=Ka(),this.grassNearMaterial=le(me(Se(this.windUniforms,{strengthMul:1,name:"grass-near"}),this.atlas)),this.grassMidMaterial=le(me(Se(this.windUniforms,{strengthMul:.72,name:"grass-mid"}),this.atlas)),this.flowerMaterial=le(me(Se(this.windUniforms,{strengthMul:.62,name:"flowers"}),this.atlas)),this.treeMaterial=le(me(Se(this.windUniforms,{strengthMul:.18,name:"trees"}),this.atlas,.46)),this.rockMaterial=le(new ut({vertexColors:!0})),this.meshes=[],this._meshPool=new Map,this._sectors=new Map,this._desiredSectors=new Set,this._buildQueue=[],this._queued=new Set,this._scatterKey="",this._centerSectorKey="",this._lastPaintRevision=-1,this._lastPlanetKey="",this._planetBuildState=null,this._lastCenter=new I(1/0,1/0,1/0),this._sectorSize=192,this._quality=2,this._qualityBudget=it[2],this._containsPoint=null,this._tmpMat=new dt,this._tmpPos=new I,this._tmpScale=new I,this._qAlign=new ge,this._qFull=new ge,this._qYaw=new ge,this._qIdentity=new ge,this._up=new I(0,1,0),this._tmpNormal=new I,this._tmpColor=new Y,this._centerScratch=new I,this._planetCamDir=new I,this._planetRef=new I,this._planetT1=new I,this._planetT2=new I,this._planetDir=new I,this._diagnostics={instances:{grass:0,flowers:0,rocks:0,trees:0},lod:{},buildMs:0,samples:0,sectors:0,queuedSectors:0,cacheHits:0,cacheMisses:0,surfaceReadbacks:0,triangles:0,drawCalls:0}}update({mode:e,camera:o,params:a,perf:r=null,boardSize:n,sampler:i,planetSampler:l,paintLayers:s,splineRevision:c=-1,terrainRevision:u=-1,containsPoint:d=null,centerOverride:f=null,dirtyBounds:h=null}){var y;const p=!!a.propsEnabled;if(this.group.visible=p,!p||!o)return;const m=performance.now();this._quality=Ja(r),this._qualityBudget=it[this._quality],this._sectorSize=z((a.chunkSize||128)*1.5,128,256),this._containsPoint=d;const g=this._resolveCenter(e,o,n,f),S=(s==null?void 0:s.revision)??-1,b=Bt(a.propsAssets);this._assetsByType=Object.fromEntries(ye.map(A=>[A.id,Wt(b,A.id)]));const v=[e,a.seed,a.propsDensity,a.propsGrassDensity,a.propsGrass,a.propsFlowers,a.propsRocks,a.propsRockScale,a.propsTreeDensity,a.propsTreeScale,a.seaLevel,n,JSON.stringify(b),c,u].join("|"),x=v!==this._scatterKey,k=S!==this._lastPaintRevision,w=x||k&&(!h||h.all);this._scatterKey=v,this._lastPaintRevision=S,!x&&k&&h&&!h.all&&e!=="planet"&&this._invalidateBounds(h),e==="planet"?this._updatePlanet({camera:o,center:g,params:a,planetSampler:l,scatterChanged:w}):this._updateFlat({mode:e,center:g,params:a,sampler:i,scatterChanged:w,synchronous:!r}),this._diagnostics.buildMs=performance.now()-m,this._diagnostics.surfaceReadbacks=((y=i==null?void 0:i.surfaceField)==null?void 0:y.readbackCount)??(i==null?void 0:i.surfaceReadbacks)??0}_resolveCenter(e,o,a,r=null){if(e==="studio"){if(r)return this._centerScratch.set(r.x,0,r.z);const n=a/2;return this._centerScratch.set(z(o.position.x,-n,n),0,z(o.position.z,-n,n))}return this._centerScratch.copy(o.position)}_updateFlat({mode:e,center:o,params:a,sampler:r,scatterChanged:n,synchronous:i}){var x,k;if(!r)return;n&&(this._sectors.clear(),this._buildQueue.length=0,this._queued.clear());const s=Math.max(32,a.propsCullDistance||760)*this._qualityBudget.distanceScale,c=this._lastCenter.distanceToSquared(o)>=16,u=Math.floor(o.x/this._sectorSize),d=Math.floor(o.z/this._sectorSize),f=`${u}:${d}:${this._quality}`,h=new Set,p=Math.ceil(s/this._sectorSize)+1,m=[];for(let w=d-p;w<=d+p;w++)for(let y=u-p;y<=u+p;y++){const A=(y+.5)*this._sectorSize,R=(w+.5)*this._sectorSize;if(Math.hypot(A-o.x,R-o.z)>s+this._sectorSize*.72)continue;const D=`${y},${w}`;h.add(D),!this._sectors.has(D)&&!this._queued.has(D)&&m.push({key:D,sx:y,sz:w,d:Math.hypot(A-o.x,R-o.z)})}for(const w of this._sectors.keys())h.has(w)||this._sectors.delete(w);m.sort((w,y)=>w.d-y.d);for(const w of m)this._buildQueue.push(w),this._queued.add(w.key);this._desiredSectors=h;const g=n||c||f!==this._centerSectorKey||m.length>0;this._centerSectorKey=f,this._lastCenter.copy(o);let S=!1;const b=performance.now(),v=this._buildQueue.length>0;v&&((x=r.beginBatch)==null||x.call(r,o.x,o.z));try{for(;this._buildQueue.length&&!(!i&&S&&performance.now()-b>=this._qualityBudget.buildMs);){const w=this._buildQueue.shift();this._queued.delete(w.key),this._desiredSectors.has(w.key)&&(this._sectors.set(w.key,this._buildFlatSector(w.sx,w.sz,a,r)),S=!0)}}finally{v&&((k=r.endBatch)==null||k.call(r))}g||S?this._commitFlat(o,s,a):this._diagnostics.cacheHits++,this._diagnostics.sectors=this._sectors.size,this._diagnostics.queuedSectors=this._buildQueue.length}_invalidateBounds(e){const o=Math.floor(e.minX/this._sectorSize),a=Math.floor(e.maxX/this._sectorSize),r=Math.floor(e.minZ/this._sectorSize),n=Math.floor(e.maxZ/this._sectorSize);for(let i=r;i<=n;i++)for(let l=o;l<=a;l++){const s=`${l},${i}`;this._sectors.delete(s),this._queued.has(s)&&(this._queued.delete(s),this._buildQueue=this._buildQueue.filter(c=>c.key!==s))}}_buildFlatSector(e,o,a,r){var d,f,h;const n=ce(),i=e*this._sectorSize,l=o*this._sectorSize,s=i+this._sectorSize,c=l+this._sectorSize,u=z(a.propsDensity??.65,0,2);for(let p=0;p<ye.length;p++){const m=ye[p],g=((d=this._assetsByType)==null?void 0:d[m.id])||[],S=g.length?1:0,b=m.cellSize,v=Math.floor(i/b),x=Math.ceil(s/b),k=Math.floor(l/b),w=Math.ceil(c/b),y=z(a[m.densityParam]??1,0,2);if(!(u<=0||y<=0||S<=0))for(let A=k;A<w;A++)for(let R=v;R<x;R++){const D=31+p*101,B=L(R+D,A-17,a.seed),C=L(R-43,A+D,a.seed),P=R*b+(B-.5)*b*.84,H=A*b+(C-.5)*b*.84;if(P<i||P>=s||H<l||H>=c||this._containsPoint&&!this._containsPoint(P,H)||(m.id==="broadleaf"||m.id==="conifer")&&!this._treeSpacingWinner(R,A,a.seed,D))continue;const ie=L(R+D*2,A-D*3,a.seed),se=((f=r.paintDensityForTypeAt)==null?void 0:f.call(r,m.id,P,H))??(m.id==="grass"||m.id==="flower"?((h=r.paintDensityAt)==null?void 0:h.call(r,P,H))??0:0),G=z(u*(y+se)*S*(m.density??1),0,1);if(ie>G)continue;const K=r.sampleAt(P,H);this._diagnostics.samples++;const Q=rt(P,H,a.seed,D);if(!nt(m,K,a,{roll:ie,macro:Q}))continue;const U=He(g,L(R-D*5,A+D*7,a.seed));U&&n[m.render].push(this._composeItem(m,K,R,A,a,ie,null,U))}}return this._diagnostics.cacheMisses++,n}_treeSpacingWinner(e,o,a,r){const n=L(e+r,o-r,a);return n>=L(e-1+r,o-r,a)&&n>=L(e+1+r,o-r,a)&&n>=L(e+r,o-1-r,a)&&n>=L(e+r,o+1-r,a)}_composeItem(e,o,a,r,n,i,l=null,s=null){const c=L(a+29,r+11,n.seed);let u=$(e.scaleRange[0],e.scaleRange[1],c);e.scaleParam&&(u*=z(n[e.scaleParam]??1,.05,2.5));const d=e.rootDepth??u*(e.rootDepthRatio??0);let f,h,p=e.alignAmount??(e.alignMode===Z.NORMAL?1:0);if(l){const v=o.surfaceRadius-d;f=[l.x*v,l.y*v,l.z*v],e.alignMode===Z.UPRIGHT?h=[l.x,l.y,l.z]:h=[$(l.x,o.normal.x,p),$(l.y,o.normal.y,p),$(l.z,o.normal.z,p)],p=1}else{const[v,x,k]=o.position;f=[v,x-d,k],h=[o.normal.x,o.normal.y,o.normal.z]}let m=u;if(e.id==="grass"){const v=$(.85,1.8,L(a+61,r-23,n.seed));m=[v,u,v]}else e.id==="rock"&&(m=[u*$(.75,1.45,L(a+61,r-23,n.seed)),u*$(.55,.95,L(a-19,r+67,n.seed)),u*$(.7,1.35,L(a+101,r+7,n.seed))]);if(s){const v=s.scale,x=s.width,k=s.height;Array.isArray(m)?m=[m[0]*v*x,m[1]*v*k,m[2]*v*x]:x===k?m*=v*x:m=[m*v*x,m*v*k,m*v*x]}const g=e.id==="grass"?qa(o):e.id==="rock"?Xa(o):e.id==="broadleaf"?at(o,!1):e.id==="conifer"?at(o,!0):Za(L(a+3,r+41,n.seed)),S=It(s),b=s?g.map((v,x)=>$(v,S[x],.68)):g;return{render:e.render,pos:f,normal:h,yaw:L(a,r,n.seed)*Math.PI*2,scale:m,alignAmount:p,tint:b,priority:i,assetId:s==null?void 0:s.id}}_commitFlat(e,o,a){const r=ce();for(const n of this._sectors.values())for(const i of Object.keys(r))r[i].push(...n[i]);this._commitBuckets(r,e,o,a,!1)}_updatePlanet({camera:e,params:o,planetSampler:a,scatterChanged:r}){if(!a)return;const n=this._planetCamDir.copy(e.position).normalize(),i=Math.max(32,o.propsCullDistance||760)*this._qualityBudget.distanceScale,l=Math.max(1,o.planetRadius||16e3),s=Math.max(0,e.position.length()-l),c=this._sectorSize/Math.max(1,o.planetRadius||16e3),u=Math.asin(z(n.y,-1,1)),d=Math.atan2(n.z,n.x),f=s<=Math.max(1e3,i*1.5),h=f?Math.round(s/Math.max(8,i*.08)):"orbit",p=`${Math.round(u/c)}:${Math.round(d/c)}:${h}:${this._quality}:${this._scatterKey}`;if(!f){r||p!==this._lastPlanetKey||this._planetBuildState?(this._planetBuildState=null,this._lastPlanetKey=p,this._commitBuckets(ce(),e.position,i,o,!0),this._diagnostics.sectors=0,this._diagnostics.queuedSectors=0):this._diagnostics.cacheHits++;return}const m=r||p!==this._lastPlanetKey;if(!m&&!this._planetBuildState){this._diagnostics.cacheHits++;return}if(this._lastPlanetKey=p,m){const b=Math.abs(n.y)<.96?this._planetRef.set(0,1,0):this._planetRef.set(1,0,0),v=this._planetT1.crossVectors(b,n).normalize(),x=this._planetT2.crossVectors(n,v).normalize();this._commitBuckets(ce(),e.position,i,o,!0),this._planetBuildState=this._createPlanetBuildState({key:p,dir:n,t1:v,t2:x,radius:i,params:o,planetSampler:a})}const g=this._planetBuildState;(this._processPlanetBuild(g)||g.complete)&&this._commitBuckets(g.buckets,e.position,i,o,!0),this._diagnostics.sectors=1,this._diagnostics.queuedSectors=g.complete?0:1,g.complete&&(this._diagnostics.cacheMisses++,this._planetBuildState=null)}_createPlanetBuildState({key:e,dir:o,t1:a,t2:r,radius:n,params:i,planetSampler:l}){const s=z(i.propsDensity??.65,0,2),c=[Math.ceil(this._qualityBudget.trees*.55),Math.floor(this._qualityBudget.trees*.45)],u={grass:this._qualityBudget.grass,flower:this._qualityBudget.flowers,rock:this._qualityBudget.rocks,broadleaf:c[0],conifer:c[1]},d=ye.map((f,h)=>{var x;const p=Math.ceil(n/f.cellSize),m=z(i[f.densityParam]??1,0,2),g=((x=this._assetsByType)==null?void 0:x[f.id])||[],S=g.length?1:0,b=z(s*m*S*(f.density??1),0,1),v=Math.max(1,Math.PI*(n/f.cellSize)**2);return{desc:f,assets:g,typeIndex:h,range:p,gx:-p,gy:-p,salt:31+h*101,preGate:Math.min(b,u[f.id]*1.7/v)}});return{key:e,dir:o.clone(),t1:a.clone(),t2:r.clone(),radius:n,params:i,planetSampler:l,types:d,typeIndex:0,buckets:ce(),complete:!1}}_processPlanetBuild(e){if(!e||e.complete)return!1;const o=performance.now();let a=!1,r=0;for(;e.typeIndex<e.types.length;){const n=e.types[e.typeIndex],{desc:i,range:l,salt:s}=n;if(n.gy>l){e.typeIndex++;continue}const c=n.gx,u=n.gy;if(n.gx++,n.gx>l&&(n.gx=-l,n.gy++),r++,n.preGate>0&&(!(i.id==="broadleaf"||i.id==="conifer")||this._treeSpacingWinner(c,u,e.params.seed,s))){const d=c*i.cellSize+(L(c+s,u-17,e.params.seed)-.5)*i.cellSize*.84,f=u*i.cellSize+(L(c-43,u+s,e.params.seed)-.5)*i.cellSize*.84;if(Math.hypot(d,f)<=e.radius){const h=L(c+s*2,u-s*3,e.params.seed);if(h<=n.preGate){const p=this._planetDir.copy(e.dir).multiplyScalar(e.params.planetRadius).addScaledVector(e.t1,d).addScaledVector(e.t2,f).normalize(),m=e.planetSampler.sampleAt3D(p.x,p.y,p.z);this._diagnostics.samples++;const g=rt(c*i.cellSize,u*i.cellSize,e.params.seed,s);if(nt(i,m,e.params,{roll:h,macro:g})){const S=He(n.assets,L(c-s*5,u+s*7,e.params.seed));if(!S)continue;e.buckets[i.render].push(this._composeItem(i,m,c,u,e.params,h,p,S)),a=!0}}}}if(!(r&63)&&performance.now()-o>=this._qualityBudget.buildMs)return a}return e.complete=!0,a}_commitBuckets(e,o,a,r,n=!1){const i=this._qualityBudget,l=n?G=>Math.hypot(G.pos[0]-o.x,G.pos[1]-o.y,G.pos[2]-o.z):G=>Math.hypot(G.pos[0]-o.x,G.pos[2]-o.z),s=(G,K,Q=a)=>G.filter(U=>l(U)<=Q).sort((U,he)=>he.priority-U.priority).slice(0,K),c=Math.min(a,i.grassDistance),u=Math.min(c,i.grassDistance*.78),d=s(e.grass,i.grass,c),f=s(e.flower,i.flowers,u),h=s(e.rock,i.rocks),p=Math.ceil(i.trees*.55),m=s(e.broadleaf,p),g=s(e.conifer,Math.max(0,i.trees-p)),S=Math.max(24,r.propsLodDistance||280),b=Math.min(S,i.nearDistance),v=(G,K=b)=>{const Q=[],U=[];for(const he of G)(l(he)<K?Q:U).push(he);return[Q,U]},[x,k]=v(d,Math.min(b,c*.6)),[w,y]=v(h),[A,R]=v(m),[D,B]=v(g),C=z(b*.12,6,28),P=Math.min(b,c*.6),H=z(c*.1,8,36),ie=z(u*.12,6,28),se=z(a*.06,10,42);this._fadeRanges={grassNear:[0,0,P-C,P+C],grassMid:[P-C,P+C,c-H,c],flowers:[0,0,u-ie,u],rocksNear:[0,0,b-C,b+C],rocksFar:[b-C,b+C,a-se,a],broadleafNear:[0,0,b-C,b+C],broadleafFar:[b-C,b+C,a-se,a],coniferNear:[0,0,b-C,b+C],coniferFar:[b-C,b+C,a-se,a]},this._replaceMeshes({grassNear:x,grassMid:k,flowers:f,rockNear:w,rockFar:y,broadleafNear:A,broadleafFar:R,coniferNear:D,coniferFar:B})}_replaceMeshes(e){const o=new Set,a=[["grass-near",this.grassNearGeometry,this.grassNearMaterial,e.grassNear],["grass-mid",this.grassMidGeometry,this.grassMidMaterial,e.grassMid],["flowers",this.flowerGeometry,this.flowerMaterial,e.flowers],["rocks-near",this.rockNearGeometry,this.rockMaterial,e.rockNear],["rocks-far",this.rockFarGeometry,this.rockMaterial,e.rockFar],["broadleaf-near",this.broadleafNearGeometry,this.treeMaterial,e.broadleafNear],["broadleaf-far",this.broadleafFarGeometry,this.treeMaterial,e.broadleafFar],["conifer-near",this.coniferNearGeometry,this.treeMaterial,e.coniferNear],["conifer-far",this.coniferFarGeometry,this.treeMaterial,e.coniferFar]];let r=0,n=0;for(const[i,l,s,c]of a)if(this._updateInstanced(i,l,s,c,o),c.length){n++;const u=l.index?l.index.count/3:l.getAttribute("position").count/3;r+=u*c.length}for(const[i,l]of this._meshPool)o.has(i)||(l.count=0);this.meshes=[...this._meshPool.values()],this._diagnostics.instances={grass:e.grassNear.length+e.grassMid.length,flowers:e.flowers.length,rocks:e.rockNear.length+e.rockFar.length,trees:e.broadleafNear.length+e.broadleafFar.length+e.coniferNear.length+e.coniferFar.length},this._diagnostics.lod=Object.fromEntries(Object.entries(e).map(([i,l])=>[i,l.length])),this._diagnostics.triangles=r,this._diagnostics.drawCalls=n}_updateInstanced(e,o,a,r,n){var c;let i=this._meshPool.get(e);if(!i&&!r.length)return;if(!i||i.instanceMatrix.count<r.length){const u=Math.max(16,2**Math.ceil(Math.log2(r.length||1)));i&&this.group.remove(i),i=new Qt(o,a,u),i.name=`procedural-${e}`,i.frustumCulled=!1,i.instanceMatrix.setUsage(Yt),this._meshPool.set(e,i),this.group.add(i)}i.count=r.length,n.add(e);const l=e.replace(/-([a-z])/g,(u,d)=>d.toUpperCase()),s=((c=this._fadeRanges)==null?void 0:c[l])||[0,0,1e6,1000001];i.userData.propFadeRanges=s,i.onBeforeRender=(u,d,f)=>{const h=i.material.userData.propFadeUniforms;h&&(h.center.value.copy(f.position),h.ranges.value.fromArray(i.userData.propFadeRanges))};for(let u=0;u<r.length;u++){const d=r[u];this._tmpPos.fromArray(d.pos),this._tmpNormal.fromArray(d.normal).normalize(),this._qFull.setFromUnitVectors(this._up,this._tmpNormal),this._qAlign.copy(this._qIdentity).slerp(this._qFull,d.alignAmount??1),this._qYaw.setFromAxisAngle(this._up,d.yaw),this._qAlign.multiply(this._qYaw),Array.isArray(d.scale)?this._tmpScale.fromArray(d.scale):this._tmpScale.setScalar(d.scale),this._tmpMat.compose(this._tmpPos,this._qAlign,this._tmpScale),i.setMatrixAt(u,this._tmpMat),this._tmpColor.fromArray(d.tint||[1,1,1]),i.setColorAt(u,this._tmpColor)}i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}tickWind(e,o){const a=this.windUniforms;a.uTime.value=e,a.uWindStrength.value=.3*Math.max(0,(o==null?void 0:o.propsWind)??.6),a.uWindSpeed.value=(o==null?void 0:o.propsWindSpeed)??1.6,a.uGustIntensity.value=(o==null?void 0:o.propsGust)??.45}getDiagnostics(){return{...this._diagnostics,instances:{...this._diagnostics.instances},lod:{...this._diagnostics.lod},quality:this._quality}}_clearMeshes(){for(const e of this._meshPool.values())this.group.remove(e);this._meshPool.clear(),this.meshes=[]}dispose(){this._clearMeshes(),this._sectors.clear(),this._planetBuildState=null,this._buildQueue.length=0,this.scene.remove(this.group),[this.grassNearGeometry,this.grassMidGeometry,this.flowerGeometry,this.rockNearGeometry,this.rockFarGeometry,this.broadleafNearGeometry,this.broadleafFarGeometry,this.coniferNearGeometry,this.coniferFarGeometry].forEach(e=>e.dispose()),[this.grassNearMaterial,this.grassMidMaterial,this.flowerMaterial,this.treeMaterial,this.rockMaterial].forEach(e=>e.dispose()),this.atlas.dispose()}}const eo=`
const float WATER_PI = 3.141592653589793;
const float WATER_F0 = 0.02037;

float waterSchlickFresnel(vec3 normal, vec3 viewDir, float strength) {
  float noV = clamp(dot(normal, viewDir), 0.0, 1.0);
  float schlick = WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - noV, 5.0);
  return clamp(WATER_F0 + (schlick - WATER_F0) * max(strength, 0.0), 0.0, 1.0);
}

vec3 waterAbsorptionCoefficients(
  vec3 deepColor,
  float absorptionStrength,
  float density,
  float depthOpacityStrength
) {
  vec3 safeColor = max(deepColor, vec3(0.0001));
  float peak = max(max(safeColor.r, safeColor.g), safeColor.b);
  vec3 penetrationTint = safeColor / max(peak, 0.0001);

  // The palette's strongest channel penetrates farthest. A wavelength bias
  // still removes red first for neutral palettes, matching the underwater pass.
  vec3 wavelengthBias = vec3(0.018, 0.014, 0.010);
  vec3 paletteAbsorption = (vec3(1.0) - penetrationTint)
    * vec3(0.110, 0.055, 0.028);
  float userDensity = mix(0.35, 1.65, clamp(density, 0.0, 1.0));
  return (wavelengthBias + paletteAbsorption)
    * max(absorptionStrength, 0.001)
    * userDensity
    * max(depthOpacityStrength, 0.05);
}

vec3 waterBeerLambert(vec3 absorptionRGB, float opticalDepth) {
  return exp(-absorptionRGB * max(opticalDepth, 0.0));
}

float waterVolumeOpacity(vec3 transmittance) {
  return clamp(1.0 - dot(transmittance, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
}

float waterGgxSunSpecular(
  vec3 normal,
  vec3 viewDir,
  vec3 lightDir,
  float roughness
) {
  float noV = max(dot(normal, viewDir), 0.001);
  float noL = max(dot(normal, lightDir), 0.0);
  if (noL <= 0.0) return 0.0;

  vec3 halfDir = normalize(viewDir + lightDir);
  float noH = max(dot(normal, halfDir), 0.0);
  float voH = max(dot(viewDir, halfDir), 0.0);
  float alpha = max(roughness * roughness, 0.0025);
  float alpha2 = alpha * alpha;
  float denom = noH * noH * (alpha2 - 1.0) + 1.0;
  float distribution = alpha2 / max(WATER_PI * denom * denom, 0.0001);

  float k = (roughness + 1.0);
  k = k * k * 0.125;
  float gv = noV / (noV * (1.0 - k) + k);
  float gl = noL / (noL * (1.0 - k) + k);
  float fresnel = WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - voH, 5.0);
  return distribution * gv * gl * fresnel * noL / max(4.0 * noV * noL, 0.001);
}
`,te=Object.freeze({domainScale:.055,largeMultiplier:3.2,mediumMultiplier:7.4,tertiaryMultiplier:13}),Mt=`
vec2 waterGeometryRotateDirection(vec2 direction, float radians) {
  float c = cos(radians);
  float s = sin(radians);
  return vec2(
    direction.x * c - direction.y * s,
    direction.x * s + direction.y * c
  );
}

void waterGeometryPhases(
  vec2 xz,
  float t,
  out vec2 dirA,
  out vec2 dirB,
  out vec2 dirC,
  out float phaseA,
  out float phaseB,
  out float phaseC
) {
  dirA = normalize(uWaveDir);
  dirB = waterGeometryRotateDirection(dirA, 0.6108652);
  dirC = waterGeometryRotateDirection(dirA, 0.9250245);
  // Bend the three analytic wave trains over broad, incommensurate regions.
  // This only perturbs phase direction; the legacy-compatible local
  // frequencies below remain unchanged.
  float macroA = sin(
    dot(xz, vec2(0.00417, 0.00531))
      + t * max(uWaveSpeed, 0.0) * 0.027
  );
  float macroB = sin(
    dot(xz, vec2(-0.00613, 0.00377))
      - t * max(uWaveSpeed, 0.0) * 0.019
      + macroA * 0.43
  );
  float macroC = cos(
    dot(xz, vec2(0.00289, -0.00719))
      + t * max(uWaveSpeed, 0.0) * 0.013
      - macroB * 0.37
  );
  vec2 waveXZ = xz + vec2(
    macroA + macroC * 0.46,
    macroB - macroA * 0.38
  ) * 7.0;
  float domain = ${te.domainScale}
    * max(uWaveScale, 0.2);
  float speed = uWaveSpeed;
  phaseA = dot(waveXZ, dirA) * domain
    * ${te.largeMultiplier}
    + t * speed * 3.1
    + macroB * 0.42;
  phaseB = dot(waveXZ, dirB) * domain * 4.15
    - t * speed * 2.6
    - macroA * 0.36;
  phaseC = dot(waveXZ, dirC) * domain * 6.1
    + t * speed * 4.3
    + macroC * 0.48;
}

float waterCinematicCrest(vec2 xz, float t) {
  vec2 dirA;
  vec2 dirB;
  vec2 dirC;
  float phaseA;
  float phaseB;
  float phaseC;
  waterGeometryPhases(
    xz,
    t,
    dirA,
    dirB,
    dirC,
    phaseA,
    phaseB,
    phaseC
  );
  float combined = sin(phaseA) * 0.56
    + sin(phaseB) * 0.29
    + sin(phaseC) * 0.15;
  return clamp(combined * 0.5 + 0.5, 0.0, 1.0);
}

vec3 waterCinematicDisplacement(vec2 xz, float t, out float crest) {
  vec2 dirA;
  vec2 dirB;
  vec2 dirC;
  float phaseA;
  float phaseB;
  float phaseC;
  waterGeometryPhases(
    xz,
    t,
    dirA,
    dirB,
    dirC,
    phaseA,
    phaseB,
    phaseC
  );

  float strength = uWaveStrength * uWaveComplexity;
  float mediumWeight = mix(uLargeWaveStr, uSmallWaveStr, 0.65);
  float ampA = 0.52 * uLargeWaveStr * strength;
  float ampB = 0.30 * uLargeWaveStr * strength;
  float ampC = 0.16 * mediumWeight * strength;
  float horizontal = 0.22;
  vec2 xzOffset = dirA * cos(phaseA) * ampA * horizontal;
  xzOffset += dirB * cos(phaseB) * ampB * horizontal;
  xzOffset += dirC * cos(phaseC) * ampC * horizontal;
  float height = sin(phaseA) * ampA
    + sin(phaseB) * ampB
    + sin(phaseC) * ampC;
  crest = clamp(
    (sin(phaseA) * 0.56 + sin(phaseB) * 0.29 + sin(phaseC) * 0.15)
      * 0.5 + 0.5,
    0.0,
    1.0
  );
  return vec3(xzOffset.x, height, xzOffset.y);
}
`,to=`
vec2 waterRotateDirection(vec2 direction, float radians) {
  float c = cos(radians);
  float s = sin(radians);
  return vec2(
    direction.x * c - direction.y * s,
    direction.x * s + direction.y * c
  );
}

vec3 waterDirectionalNormal(vec2 xz, float t, float cameraDistance, float roughness) {
  vec2 primary = normalize(uWaveDir);
  vec2 primaryB = waterRotateDirection(primary, 0.6108652);  // 35 degrees
  vec2 mediumA = waterRotateDirection(primary, 0.9250245);   // 53 degrees
  vec2 mediumB = waterRotateDirection(primary, 1.3089969);   // 75 degrees
  vec2 smallA = waterRotateDirection(primary, -0.8203047);   // -47 degrees
  vec2 smallB = waterRotateDirection(primary, 2.1467550);    // 123 degrees
  float scale = max(uWaveScale, 0.2);
  float speed = uWaveSpeed;

  // Preserve the original shader's 0.055 world-to-wave domain. The analytic
  // multipliers reproduce its roughly 18-unit primary and 7-unit secondary
  // feature spacing (half a sine cycle), so existing Wave Scale values retain
  // their previous visual size instead of producing oversized ocean swells.
  float legacyDomainScale = ${te.domainScale} * scale;

  // Bend the wave fronts and vary their energy over very broad regions. These
  // incommensurate fields are intentionally much larger than the visible wave
  // features: they break up ruler-straight bands without changing ripple size.
  float macroPhaseA = dot(xz, vec2(0.00417, 0.00531))
    + t * speed * 0.027;
  float macroPhaseB = dot(xz, vec2(-0.00613, 0.00377))
    - t * speed * 0.019;
  float macroPhaseC = dot(xz, vec2(0.00289, -0.00719))
    + t * speed * 0.013;
  float macroA = sin(macroPhaseA);
  float macroB = sin(macroPhaseB + macroA * 0.43);
  float macroC = cos(macroPhaseC - macroB * 0.37);
  vec2 macroWarp = vec2(
    macroA + macroC * 0.46,
    macroB - macroA * 0.38
  ) * 8.0;

  // Smooth hash noise keeps the broad energy patches aperiodic. The two
  // samples use different domains so no wave family remains dominant across
  // the full tile.
  vec2 regionalP = xz * (legacyDomainScale * 0.065)
    + primary * t * speed * 0.012;
  vec2 regionalQ = waterRotateDirection(xz, 1.1170107)
    * (legacyDomainScale * 0.093)
    - mediumB * t * speed * 0.009;
  float regionalA = smoothstep(0.08, 0.92, vnoise(regionalP));
  float regionalB = smoothstep(0.08, 0.92, vnoise(regionalQ));
  vec2 regionalWarp = (vec2(regionalA, regionalB) - 0.5) * 9.0;
  vec2 waveXZ = xz + macroWarp + regionalWarp;

  float largePatchA = mix(
    0.44,
    1.0,
    clamp(regionalA * 0.68 + (0.5 + 0.5 * macroA) * 0.32, 0.0, 1.0)
  );
  float largePatchB = mix(
    0.44,
    1.0,
    clamp(regionalB * 0.66 + (0.5 - 0.5 * macroB) * 0.34, 0.0, 1.0)
  );
  float mediumPatchA = mix(
    0.58,
    1.0,
    clamp(
      regionalB * 0.52 + regionalA * 0.18 + (0.5 + 0.5 * macroC) * 0.30,
      0.0,
      1.0
    )
  );
  float mediumPatchB = mix(
    0.58,
    1.0,
    clamp(
      regionalA * 0.48 + (1.0 - regionalB) * 0.22
        + (0.5 - 0.5 * macroA) * 0.30,
      0.0,
      1.0
    )
  );
  float smallPatch = mix(
    0.68,
    1.0,
    clamp(
      (regionalA + regionalB) * 0.33 + (0.5 + 0.5 * macroB) * 0.34,
      0.0,
      1.0
    )
  );

  float bend = sin(
    dot(waveXZ, mediumA) * legacyDomainScale * 1.37
    - t * speed * 0.65
    + macroC * 0.34
  );
  float largePhaseA = dot(waveXZ, primary) * legacyDomainScale
    * ${te.largeMultiplier}
    + t * speed * 3.1
    + bend * 0.62
    + macroB * 0.48
    + (regionalB - 0.5) * 0.86;
  float largePhaseB = dot(waveXZ, primaryB) * legacyDomainScale * 4.15
    - t * speed * 2.6
    - bend * 0.38
    - macroA * 0.42
    - (regionalA - 0.5) * 0.74;
  float mediumPhaseA = dot(waveXZ, mediumA) * legacyDomainScale * 6.1
    + t * speed * 4.3
    + sin(largePhaseB * 0.41) * 0.28
    + macroC * 0.55
    + (regionalA - regionalB) * 0.46;
  float mediumPhaseB = dot(waveXZ, mediumB) * legacyDomainScale
    * ${te.mediumMultiplier}
    - t * speed * 3.7
    - sin(largePhaseA * 0.37) * 0.24
    - macroB * 0.38
    + (regionalA + regionalB - 1.0) * 0.39;
  float smallPhaseA = dot(waveXZ, smallA) * legacyDomainScale * 9.6
    + t * speed * 5.6
    + macroA * 0.29;
  float smallPhaseB = dot(waveXZ, smallB) * legacyDomainScale
    * ${te.tertiaryMultiplier.toFixed(1)}
    - t * speed * 6.8
    - macroC * 0.33;

  float mediumWeight = mix(uLargeWaveStr, uSmallWaveStr, 0.65);
  vec2 slope = primary * cos(largePhaseA) * 0.060
    * uLargeWaveStr * largePatchA;
  slope += primaryB * cos(largePhaseB) * 0.050
    * uLargeWaveStr * largePatchB;
  slope += mediumA * cos(mediumPhaseA) * 0.045
    * mediumWeight * mediumPatchA;
  slope += mediumB * cos(mediumPhaseB) * 0.035
    * mediumWeight * mediumPatchB;
  slope += smallA * cos(smallPhaseA) * 0.025
    * uSmallWaveStr * smallPatch;
  slope += smallB * cos(smallPhaseB) * 0.018
    * uSmallWaveStr * smallPatch;

  float microFade = 1.0 - smoothstep(320.0, 1900.0, cameraDistance);
  microFade *= 1.0 - clamp(roughness, 0.0, 1.0) * 0.55;
  if (uWaterQuality > 0.5 && microFade > 0.001) {
    vec2 microXZ = xz + macroWarp * 0.35;
    vec2 microP = microXZ * (legacyDomainScale * 2.6)
      + primary * t * speed * 0.75
      - mediumA * t * speed * 0.35;
    float epsilon = 0.18;
    float center = vnoise(microP);
    float dx = vnoise(microP + vec2(epsilon, 0.0)) - center;
    float dz = vnoise(microP + vec2(0.0, epsilon)) - center;
    slope += vec2(dx, dz) * (0.20 / epsilon)
      * uSmallWaveStr * uWaterDetail * uMicroWaveDetail
      * smallPatch * microFade;
  }

  float strength = uNormalIntensity * uWaveStrength * uWaveComplexity;
  return normalize(vec3(-slope.x * strength, 1.0, -slope.y * strength));
}
`,kt=ua(Ot()),Dt=`
uniform float uTime;
uniform float uWaterAnim;
uniform float uWaterTier;
uniform float uWaveComplexity;
uniform float uWaveSpeed;
uniform float uWaveScale;
uniform float uWaveStrength;
uniform float uSmallWaveStr;
uniform float uLargeWaveStr;
uniform vec2 uWaveDir;
uniform float uAnimSpeed;
uniform vec2 uGeometryFocus;
uniform float uGeometryDisplacementEnabled;

varying vec3 vWorldPos;

${Mt}

float waterConcentratedGridAxis(float coordinate, float focus) {
  float u = coordinate + 0.5;
  float densityPower = 1.72;
  if (u < 0.5) {
    float sideT = u * 2.0;
    return focus - (focus + 0.5)
      * pow(max(1.0 - sideT, 0.0), densityPower);
  }
  float sideT = (u - 0.5) * 2.0;
  return focus + (0.5 - focus)
    * pow(max(sideT, 0.0), densityPower);
}

void main() {
  float geometryEnabled = uGeometryDisplacementEnabled
    * step(2.5, uWaterTier);
  vec3 localPosition = position;
  if (geometryEnabled > 0.5) {
    localPosition.x = waterConcentratedGridAxis(
      position.x,
      clamp(uGeometryFocus.x, -0.42, 0.42)
    );
    localPosition.z = waterConcentratedGridAxis(
      position.z,
      clamp(uGeometryFocus.y, -0.42, 0.42)
    );
  }

  vec4 wp = modelMatrix * vec4(localPosition, 1.0);
  if (geometryEnabled > 0.5) {
    float crest;
    float t = uTime * uWaterAnim * uAnimSpeed;
    vec3 displacement = waterCinematicDisplacement(wp.xz, t, crest);
    float distanceFade = 1.0 - smoothstep(
      900.0,
      2200.0,
      length(cameraPosition.xz - wp.xz)
    );
    wp.xyz += displacement * distanceFade;
  }
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,Ie=(t,e=!1)=>{const{dependencies:o,terrainHeightFunction:a}=ga(t,e);return`
precision highp float;

${aa}
${na}
${o}
${pa}
${ha}
${a}
${Ba}
${va}

uniform float uWaterAnim;
uniform float uWaterFadeStart;
uniform float uWaterFadeEnd;

uniform float uWaterQuality;
uniform float uWaterDetail;
uniform float uWaterReflection;
uniform float uWaveComplexity;
uniform float uRoughness;
uniform float uReflectionQuality;
uniform float uMicroWaveDetail;
uniform float uSkyReflectionEnabled;
uniform float uBiomeColorEnabled;
uniform float uBiomeColorStrength;

// realistic water controls
uniform float uWaterTier;          // 1=realistic, 2=volumetric, 3=cinematic
uniform float uWaterOpacity;
uniform float uFresnelStrength;
uniform float uRefractionStrength;
uniform float uSpecularStrength;
uniform float uDepthColorStr;
uniform float uDepthOpacityStr;
uniform float uMaxVisibleDepth;
uniform float uDepthFalloff;
uniform float uShallowDist;
uniform float uDeepDist;
uniform float uAbsorptionStr;
uniform float uWaveSpeed;
uniform float uWaveScale;
uniform float uWaveStrength;
uniform float uSmallWaveStr;
uniform float uLargeWaveStr;
uniform float uNormalIntensity;
uniform vec2  uWaveDir;
uniform float uAnimSpeed;
uniform float uFoamEnabled;
uniform float uFoamStrength;
uniform float uFoamWidth;
uniform float uFoamSoftness;
uniform float uFoamAnimSpeed;
uniform float uSlopeFoam;
uniform float uCliffFoam;
uniform float uCausticsStr;
uniform float uCausticMinDepth;
uniform float uCausticMinDepthFalloff;
uniform float uRefractionQual;
uniform float uFoamQual;
uniform float uCausticsQual;
uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform vec2 uSceneTexelSize;
uniform vec2 uSceneViewportInv;
uniform float uSceneNear;
uniform float uSceneFar;
uniform float uSceneRefractionEnabled;
uniform sampler2D uPlanarReflection;
uniform mat4 uPlanarReflectionMatrix;
uniform vec2 uPlanarReflectionTexelSize;
uniform float uPlanarReflectionEnabled;
uniform vec2 uGeometryFocus;
uniform float uGeometryDisplacementEnabled;
uniform float uDebugMode;          // see WaterDebugViews / setWaterDebugMode
uniform float uVisualFoamBreakup;
uniform float uVisualWetSandRange;
uniform float uVisualShallowWaterSoftness;

varying vec3 vWorldPos;

${Wa}
${eo}
${Mt}
${to}
${e?`
vec4 waterBiomeClimateAt(vec2 xz) {
  float available = 0.0;
  vec4 field = infiniteFieldSampleAt(xz, available);
  if (available > 0.5) {
    float region = fbm3((xz * uFrequency + uSeedOffset) * 0.700 + vec2(631.4, 199.2));
    return vec4(field.g, field.b, field.a, region);
  }
  Climate climate = climateAt(xz * uFrequency + uSeedOffset);
  return vec4(climate.temp, climate.moist, climate.cont, climate.region);
}

float waterBiomeClimateAvailable() {
  return 1.0;
}
`:`
vec4 waterBiomeClimateAt(vec2 xz) {
  if (uUseWaterTerrainBiomeTex > 0.5) {
    return texture2D(uWaterTerrainBiomeTex, waterBakedUvAt(xz));
  }
  Climate climate = climateAt(xz * uFrequency + uSeedOffset);
  return vec4(climate.temp, climate.moist, climate.cont, climate.region);
}

float waterBiomeClimateAvailable() {
  return 1.0;
}
`}

float terrainHeightAt(vec2 xz) {
  return waterTerrainHeightAt(xz);
}

vec4 waterPaintedBiomeAt(vec2 xz) {
  if (uPaintEnabled < 0.5) return vec4(0.0);
  vec2 uv = xz / max(uPaintBoardSize, 1.0) + vec2(0.5);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    return vec4(0.0);
  }
  return texture2D(uPaintBiomeTexture, uv) * uPaintOpacity;
}

// Return a relative tint rather than an absolute color so custom palettes and
// water presets remain authoritative. The broad climate fields and filtered
// Studio bake make transitions gradual across biome borders.
vec3 waterBiomeColorMultiplier(vec2 xz) {
  vec4 climate = waterBiomeClimateAt(xz);
  float borderJitter = (climate.a - 0.5) * 0.16;
  float hot = smoothstep(0.52, 0.76, climate.r + borderJitter);
  float cold = smoothstep(0.34, 0.12, climate.r + borderJitter);
  float dry = smoothstep(0.56, 0.28, climate.g - borderJitter);
  float wet = smoothstep(0.54, 0.80, climate.g + borderJitter);
  float coastal = smoothstep(0.58, 0.30, climate.b);
  float inland = smoothstep(0.42, 0.72, climate.b);

  float desert = hot * dry;
  float tropical = hot * wet;
  float wetland = wet * coastal * (1.0 - hot * 0.35);
  float alpine = cold * inland;

  vec4 painted = waterPaintedBiomeAt(xz);
  desert = max(desert, painted.r);
  wetland = max(wetland, painted.b);
  alpine = max(alpine, painted.a);
  float canyon = painted.g;

  vec3 tint = vec3(1.0);
  tint = mix(tint, vec3(0.88, 1.07, 1.12), desert * 0.70);
  tint = mix(tint, vec3(0.76, 1.12, 1.01), tropical * 0.78);
  tint = mix(tint, vec3(0.72, 0.99, 0.76), wetland * 0.82);
  tint = mix(tint, vec3(0.82, 0.94, 1.11), alpine * 0.72);
  tint = mix(tint, vec3(0.94, 1.03, 0.92), canyon * 0.55);

  float paintedAvailable = max(max(painted.r, painted.g), max(painted.b, painted.a));
  float available = max(waterBiomeClimateAvailable(), paintedAvailable);
  float strength = uBiomeColorEnabled
    * uBiomeColorStrength
    * clamp(available, 0.0, 1.0);
  return mix(vec3(1.0), tint, clamp(strength, 0.0, 1.5));
}

// Cheap cross-kernel smoothing for depth tint. Reuses center sample when provided.
float smoothedFloorHeight(vec2 xz, float centerH) {
  float e = mix(8.0, 16.0, clamp(uVisualShallowWaterSoftness, 0.0, 1.0));
  float h1 = terrainHeightAt(xz + vec2(e, 0.0));
  float h2 = terrainHeightAt(xz - vec2(e, 0.0));
  float h3 = terrainHeightAt(xz + vec2(0.0, e));
  float h4 = terrainHeightAt(xz + vec2(0.0, -e));
  return (centerH + h1 + h2 + h3 + h4) * 0.2;
}

float slopeFromCenter(vec2 xz, float centerH) {
  float e = 4.0;
  float hx = terrainHeightAt(xz + vec2(e, 0.0));
  float hz = terrainHeightAt(xz + vec2(0.0, e));
  return length(vec2(hx - centerH, hz - centerH)) / e;
}

float waterLinearSceneDepth(float rawDepth) {
  float z = rawDepth * 2.0 - 1.0;
  return (2.0 * uSceneNear * uSceneFar)
    / max(uSceneFar + uSceneNear - z * (uSceneFar - uSceneNear), 0.0001);
}

void main() {
  vec2 xz = vWorldPos.xz;

#ifndef INFINITE_MODE
  if (waterTileOccupiedAt(xz) < 0.5) discard;
#endif

  float floorH = terrainHeightAt(xz);
  // Mean sea level and the exact terrain field are the single shoreline
  // authority. Geometry waves are visual displacement only and cannot turn a
  // dry mountain into water or detach the foam band from the coast.
  float depth = uSeaLevel - floorH;
  if (depth <= 0.02) discard;

  // Smoothed bathymetry for depth tint — 4 extra samples max (not 20+).
  float visualDepth = depth;
  if (uDepthColorStr > 0.05 || uDepthOpacityStr > 0.05) {
    visualDepth = uSeaLevel - smoothedFloorHeight(xz, floorH);
  }
  visualDepth = max(visualDepth, 0.0);

  float camDist = length(cameraPosition - vWorldPos);
  float farWater = smoothstep(700.0, 2400.0, camDist);
  float roughness = clamp(uRoughness + farWater * 0.18, 0.04, 1.0);
  float t = uTime * uWaterAnim * uAnimSpeed;
  vec3 n = waterDirectionalNormal(xz, t, camDist, roughness);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  if (dot(n, viewDir) < 0.0) n = -n;

  // depth grading — smoothed bathymetry only (not raw relief)
  float shoreSoft = clamp(uVisualShallowWaterSoftness, 0.0, 1.0);
  float shallowT = smoothstep(0.0, uShallowDist * (1.0 + shoreSoft * 0.85), visualDepth);
  float deepT = smoothstep(uShallowDist, uDeepDist * (1.0 + shoreSoft * 0.45), visualDepth);
  float dGrade = pow(clamp(visualDepth / max(uMaxVisibleDepth, 1.0), 0.0, 1.0), max(uDepthFalloff, 0.1));
  dGrade = mix(shallowT * 0.35, deepT, dGrade) * uDepthColorStr;

  vec3 shallowColor = mix(
    vec3(dot(uColShallow, vec3(0.299, 0.587, 0.114))),
    uColShallow,
    uPaletteSaturation
  ) * uPaletteTint;
  vec3 deepColor = mix(
    vec3(dot(uColDeep, vec3(0.299, 0.587, 0.114))),
    uColDeep,
    uPaletteSaturation
  ) * uPaletteTint;
  vec3 biomeColorMultiplier = waterBiomeColorMultiplier(xz);
  shallowColor *= biomeColorMultiplier;
  deepColor *= mix(vec3(1.0), biomeColorMultiplier, 0.68);
  vec3 scatteringColor = mix(shallowColor, deepColor, clamp(dGrade, 0.0, 1.0));

  // Beer–Lambert absorption. Looking across the surface increases the path
  // length, so shallow grazing views naturally become denser than top-down ones.
  float opticalDepth = visualDepth / max(abs(viewDir.y), 0.15);
  vec3 absorptionRGB = waterAbsorptionCoefficients(
    deepColor,
    uAbsorptionStr,
    uWaterOpacity,
    uDepthOpacityStr
  );
  vec3 transmittance = waterBeerLambert(absorptionRGB, opticalDepth);
  float transmissionExponent = pow(
    0.45 / max(uRefractionStrength, 0.05),
    0.18
  );
  transmittance = pow(
    transmittance,
    vec3(clamp(transmissionExponent, 0.72, 1.45))
  );
  float volumeAlpha = waterVolumeOpacity(transmittance);

  // Schlick Fresnel now follows the animated wave normal.
  float fres = waterSchlickFresnel(n, viewDir, uFresnelStrength);

  // Screen-space refraction for Volumetric/Cinematic modes. The water-free
  // capture is decoded back to linear space before optical composition.
  float sceneCaptureEnabled = uSceneRefractionEnabled
    * step(1.5, uWaterTier);
  // Once the floor is no longer visible, refraction should not replace the
  // palette-defined water body. This keeps Medium and High optically matched
  // while retaining true refraction in shallow and medium-depth water.
  float visibleFloor = 1.0 - smoothstep(
    max(uShallowDist * 1.15, 2.0),
    max(uDeepDist * 0.82, uShallowDist * 1.5),
    visualDepth
  );
  float sceneRefractionWeight = sceneCaptureEnabled * visibleFloor;
  // Derive capture UVs from the rasterized pixel. Interpolating clip
  // coordinates across the water plane's two triangles can differ by a few
  // ulps on their shared diagonal, which becomes a visible refraction cut.
  vec2 screenUv = gl_FragCoord.xy * uSceneViewportInv;
  vec2 refractedUv = screenUv;
  vec3 refractedSceneLinear = vec3(0.0);
  if (sceneCaptureEnabled > 0.5) {
    float refractionDetail = clamp(uRefractionQual, 0.0, 1.5) / 1.5;
    float distortionScale = mix(0.018, 0.065, refractionDetail)
      * uRefractionStrength
      * (1.0 - fres);
    vec2 uvMargin = uSceneTexelSize * 1.5;
    vec2 distortedUv = clamp(
      screenUv + n.xz * distortionScale,
      uvMargin,
      vec2(1.0) - uvMargin
    );

    // Reject samples that cross a terrain/prop silhouette. Sampling the
    // undistorted pixel instead prevents cliffs from smearing across the sea.
    float centerDepth = waterLinearSceneDepth(
      texture2D(uSceneDepth, screenUv).r
    );
    float distortedDepth = waterLinearSceneDepth(
      texture2D(uSceneDepth, distortedUv).r
    );
    float rejectStart = max(
      1.5,
      min(centerDepth, distortedDepth) * 0.035
    );
    float silhouetteReject = smoothstep(
      rejectStart,
      rejectStart * 3.0,
      abs(distortedDepth - centerDepth)
    );
    refractedUv = mix(distortedUv, screenUv, silhouetteReject);
    vec3 encodedScene = texture2D(uSceneColor, refractedUv).rgb;
    refractedSceneLinear = pow(
      max(encodedScene, vec3(0.0)),
      vec3(2.2)
    );
  }

  // Evaluate the same live procedural sky as the sky dome. Rough water blends
  // toward a broad reflection direction; distant water trends toward horizon
  // radiance and suppresses micro detail through waterDirectionalNormal().
  vec3 reflectedDirection = reflect(-viewDir, n);
  float reflectionDetail = clamp(uReflectionQuality, 0.0, 1.0);
  float reflectionBlur = clamp(
    roughness * roughness + (1.0 - reflectionDetail) * 0.32,
    0.0,
    1.0
  );
  vec3 broadDirection = normalize(vec3(
    reflectedDirection.x * 0.42,
    max(reflectedDirection.y, 0.08),
    reflectedDirection.z * 0.42
  ));
  vec3 reflectedSkySharp = evaluateProceduralSkyLinear(
    reflectedDirection,
    mix(1.0, 0.12, reflectionBlur),
    mix(0.35, 0.0, reflectionBlur)
  );
  vec3 reflectedSkyBroad = evaluateProceduralSkyLinear(broadDirection, 0.0, 0.0);
  vec3 reflectedSky = mix(
    reflectedSkySharp,
    reflectedSkyBroad,
    reflectionBlur * 0.82
  );
  vec3 horizonDirection = normalize(vec3(
    reflectedDirection.x,
    0.06,
    reflectedDirection.z
  ));
  reflectedSky = mix(
    reflectedSky,
    evaluateProceduralSkyLinear(horizonDirection, 0.0, 0.0),
    farWater * 0.42
  );
  vec3 fallbackReflection = mix(
    uSkyFogColor,
    vec3(0.12, 0.24, 0.38),
    clamp(reflectedDirection.y, 0.0, 1.0)
  );
  float liveSkyAmount = uSkyReflectionEnabled
    * mix(0.35, 1.0, reflectionDetail);
  reflectedSky = mix(fallbackReflection, reflectedSky, liveSkyAmount);

  // Cinematic planar reflection captures terrain, props, clouds, and the live
  // sky from a sea-level mirrored camera. Roughness broadens the four-tap
  // sample, while invalid projected coordinates retain analytical sky.
  vec3 reflectedSurface = reflectedSky;
  float planarReflectionWeight = uPlanarReflectionEnabled
    * step(2.5, uWaterTier);
  if (planarReflectionWeight > 0.5) {
    vec4 planarProjected = uPlanarReflectionMatrix * vec4(vWorldPos, 1.0);
    vec2 planarUv = planarProjected.xy
      / max(planarProjected.w, 0.0001)
      * 0.5 + 0.5;
    float planarValid = step(0.0001, planarProjected.w)
      * step(0.0, planarUv.x)
      * step(planarUv.x, 1.0)
      * step(0.0, planarUv.y)
      * step(planarUv.y, 1.0);
    float planarDistortion = mix(0.012, 0.045, reflectionDetail)
      * (1.0 - roughness * 0.45);
    vec2 planarMargin = uPlanarReflectionTexelSize * 4.0;
    planarUv = clamp(
      planarUv + n.xz * planarDistortion,
      planarMargin,
      vec2(1.0) - planarMargin
    );
    vec2 blurOffset = uPlanarReflectionTexelSize
      * mix(1.0, 8.0, roughness * roughness);
    vec3 planarEncoded = texture2D(uPlanarReflection, planarUv).rgb * 0.40;
    planarEncoded += texture2D(
      uPlanarReflection,
      planarUv + vec2(blurOffset.x, 0.0)
    ).rgb * 0.15;
    planarEncoded += texture2D(
      uPlanarReflection,
      planarUv - vec2(blurOffset.x, 0.0)
    ).rgb * 0.15;
    planarEncoded += texture2D(
      uPlanarReflection,
      planarUv + vec2(0.0, blurOffset.y)
    ).rgb * 0.15;
    planarEncoded += texture2D(
      uPlanarReflection,
      planarUv - vec2(0.0, blurOffset.y)
    ).rgb * 0.15;
    vec3 planarLinear = pow(max(planarEncoded, vec3(0.0)), vec3(2.2));
    float planarQuality = clamp(
      (uReflectionQuality - 1.0) * 2.0,
      0.0,
      1.0
    );
    float planarBlend = planarReflectionWeight
      * planarValid
      * planarQuality
      * (1.0 - roughness * 0.38);
    reflectedSurface = mix(reflectedSky, planarLinear, planarBlend);
  }

  float reflectionScale = clamp(uWaterReflection, 0.0, 1.5);
  vec3 reflectionTerm = reflectedSurface * fres * reflectionScale;

  // Roughness-aware GGX sunlight uses the current sky sun color/intensity.
  vec3 skySunDir = normalize(uSkySunDir);
  float sunSpecular = min(
    waterGgxSunSpecular(n, viewDir, skySunDir, roughness),
    8.0
  );
  vec3 sunSpecularTerm = waterResolveSunLight(
    uSkySunColor * uSkyLightIntensity
  )
    * sunSpecular
    * uSpecularStrength
    * reflectionScale;

  // Realistic mode keeps the transparent single-pass approximation. Higher
  // tiers overwrite the water pixel with a complete refracted volume composite,
  // because the same opaque scene is already behind the transparent surface.
  float diff = max(dot(n, uSunDir), 0.0);
  vec3 waterLight = waterResolveLighting(
    n,
    vec3(0.0, 1.0, 0.0),
    diff,
    vec3(0.62 + 0.38 * diff)
  );
  vec3 bodyPremultiplied = scatteringColor
    * (vec3(1.0) - transmittance)
    * waterLight
    * (1.0 - fres);
  vec3 premultipliedColor = bodyPremultiplied + reflectionTerm + sunSpecularTerm;
  float reflectionAlpha = clamp(fres * reflectionScale, 0.0, 0.98);
  float alpha = 1.0 - (1.0 - volumeAlpha) * (1.0 - reflectionAlpha);
  // Preserve only a restrained amount of wavelength separation in the scene
  // sample. Full RGB transmission made the High tier turn electric blue while
  // the otherwise identical Medium tier remained teal.
  float neutralTransmission = dot(
    transmittance,
    vec3(0.2126, 0.7152, 0.0722)
  );
  vec3 sceneTransmittance = mix(
    vec3(neutralTransmission),
    transmittance,
    0.30
  );
  vec3 refractedVolume = refractedSceneLinear * sceneTransmittance
    + scatteringColor
      * (vec3(1.0) - transmittance)
      * waterLight;
  vec3 sceneComposite = refractedVolume * (1.0 - fres)
    + reflectionTerm
    + sunSpecularTerm;
  premultipliedColor = mix(
    premultipliedColor,
    sceneComposite,
    sceneRefractionWeight
  );
  alpha = mix(alpha, 1.0, sceneRefractionWeight);

  // shoreline foam — depth-based only; slope foam restricted to very shallow water
  float shoreDist = depth;
  float foamNoise = 0.0;
  if (uFoamEnabled > 0.5 && uFoamQual > 0.1) {
    foamNoise = vnoise(xz * 0.18 + vec2(t * uFoamAnimSpeed * 1.4, -t * uFoamAnimSpeed * 1.1));
  }
  float breakup = clamp(uVisualFoamBreakup, 0.0, 1.0);
  float foamEdgeNoise = foamNoise * mix(1.4, 4.2, breakup);
  float foamPatch = mix(1.0, smoothstep(0.18, 0.82, vnoise(xz * 0.055 + vec2(t * 0.35, t * -0.28))), breakup);
  float shoreFoam = smoothstep(uFoamWidth + uFoamSoftness + uVisualWetSandRange * 0.05, uFoamSoftness, shoreDist + foamEdgeNoise);
  float nearShore = smoothstep(10.0 + uVisualWetSandRange * 0.35, 0.0, shoreDist);
  float slopeFoam = 0.0;
  float cliffFoam = 0.0;
  if (uFoamEnabled > 0.5 && nearShore > 0.01 && (uSlopeFoam > 0.01 || uCliffFoam > 0.01)) {
    float slope = slopeFromCenter(xz, floorH);
    slopeFoam = smoothstep(0.35, 1.1, slope) * uSlopeFoam * nearShore;
    cliffFoam = smoothstep(0.85, 1.8, slope) * uCliffFoam * nearShore;
  }
  // Cinematic whitecaps follow the same Gerstner phases as vertex movement.
  // A delayed sample leaves a short advected trail, approximating temporal
  // foam persistence without another history render target.
  float crestFoam = 0.0;
  float breakingFoam = 0.0;
  if (
    uWaterTier > 2.5
    && uGeometryDisplacementEnabled > 0.5
    && uFoamEnabled > 0.5
    && uFoamQual > 0.75
  ) {
    float crestNow = waterCinematicCrest(xz, t);
    float crestPrevious = waterCinematicCrest(
      xz - normalize(uWaveDir) * 1.8,
      t - 0.42 * uFoamAnimSpeed
    );
    float foamPersistence = max(crestNow, crestPrevious * 0.78);
    float crestAa = max(fwidth(foamPersistence) * 1.35, 0.018);
    crestFoam = smoothstep(
      0.86 - crestAa,
      0.86 + crestAa,
      foamPersistence
    );
    // Break the remaining crests into sparse streaks. Reusing the existing
    // foam fields avoids a new noise lookup and keeps whitecaps from forming
    // repeated rows over a large ocean.
    float crestBreakup = smoothstep(
      0.42,
      0.76,
      foamNoise * 0.62 + foamPatch * 0.38
    );
    crestFoam *= crestBreakup;
    float waveEnergy = smoothstep(
      0.82,
      1.72,
      uWaveStrength * uLargeWaveStr
    );
    float crestDistanceFade = 1.0 - smoothstep(520.0, 1750.0, camDist);
    crestFoam *= waveEnergy * crestDistanceFade;

    float breakingBand = 1.0 - smoothstep(
      max(uFoamWidth * 0.7, 1.0),
      max(uShallowDist * 1.65, uFoamWidth * 2.0),
      visualDepth
    );
    float shoreApproach = smoothstep(0.35, 0.82, foamPatch);
    breakingFoam = crestFoam * breakingBand * shoreApproach;
  }
  float foam = clamp(
    (
      shoreFoam * foamPatch
      + slopeFoam * 0.2
      + cliffFoam * 0.15
      + crestFoam * 0.13
      + breakingFoam * 0.48
    ) * uFoamStrength,
    0.0,
    1.0
  );
  // Keep the authored foam hue, but let its brightness and tint follow the
  // active atmosphere. uWaterFoamLighting retains a readable unlit component
  // at night instead of leaving a pure-white emissive-looking shoreline.
  vec3 litFoamColor = waterResolveFoamColor(uColFoam, waterLight);
  premultipliedColor = mix(premultipliedColor, litFoamColor, foam);
  alpha = mix(alpha, 1.0, foam);

  vec3 refractionTerm = mix(
    transmittance,
    refractedSceneLinear * sceneTransmittance,
    sceneRefractionWeight
  ) * (1.0 - fres);

  // fake caustics in shallow water (smoothed depth, coarse noise)
  if (uCausticsQual > 0.05 && uWaterTier > 1.5) {
    float shallowMask = 1.0 - smoothstep(uShallowDist * 0.5, uDeepDist, visualDepth);
    float c1 = vnoise(xz * 0.09 + vec2(t * 0.9, -t * 0.7));
    float c2 = vnoise(xz * 0.14 - vec2(t * 0.6, t * 0.5));
    float caust = pow(max(c1 * c2, 0.0), 2.2) * shallowMask;
    premultipliedColor += vec3(0.9, 0.95, 1.0)
      * caust * uCausticsStr * uCausticsQual * 0.28 * alpha;
  }

  float edgeFade = 1.0 - smoothstep(uWaterFadeStart, uWaterFadeEnd, camDist);
  premultipliedColor *= edgeFade;
  alpha *= edgeFade;
  if (alpha < 0.01) discard;

  // debug views
  if (uDebugMode > 0.5) {
    if (uDebugMode < 1.5) {
      float dv = clamp(depth / max(uMaxVisibleDepth, 1.0), 0.0, 1.0);
      gl_FragColor = vec4(vec3(1.0 - dv, dv * 0.5, dv), 1.0);
      return;
    }
    if (uDebugMode < 2.5) {
      float sv = smoothstep(uFoamWidth + 2.0, 0.5, depth);
      gl_FragColor = vec4(vec3(sv), 1.0);
      return;
    }
    if (uDebugMode < 3.5) {
      gl_FragColor = vec4(vec3(foam), 1.0);
      return;
    }
    if (uDebugMode < 4.5) {
      gl_FragColor = vec4(0.1, 0.45, 0.95, 1.0);
      return;
    }
    if (uDebugMode < 5.5) {
      gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
      return;
    }
    if (uDebugMode < 6.5) {
      float od = 1.0 - exp(-opticalDepth / max(uMaxVisibleDepth, 1.0));
      gl_FragColor = vec4(vec3(od), 1.0);
      return;
    }
    if (uDebugMode < 7.5) {
      gl_FragColor = vec4(transmittance, 1.0);
      return;
    }
    if (uDebugMode < 8.5) {
      gl_FragColor = vec4(vec3(fres), 1.0);
      return;
    }
    if (uDebugMode < 9.5) {
      gl_FragColor = vec4(min(reflectedSurface, vec3(1.0)), 1.0);
      return;
    }
    if (uDebugMode < 10.5) {
      gl_FragColor = vec4(clamp(refractionTerm, 0.0, 1.0), 1.0);
      return;
    }
    if (uDebugMode < 11.5) {
      gl_FragColor = vec4(vec3(alpha), 1.0);
      return;
    }
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    return;
  }

  vec3 straightColor = premultipliedColor / max(alpha, 0.001);
  float fogF = 1.0 - exp(-uFogDensity * uFogDensity * camDist * camDist);
  fogF *= mix(0.82, 0.68, farWater);
  straightColor = mix(straightColor, uFogColor, clamp(fogF, 0.0, 1.0));
  straightColor = pow(max(straightColor, vec3(0.0)), vec3(1.0 / 2.2));
  gl_FragColor = vec4(straightColor * alpha, alpha);
}
`};function At(t,e){const o=e??Ia();return{...t,...o,uWaterQuality:{value:2},uWaterDetail:{value:1},uWaterReflection:{value:1},uWaveComplexity:{value:1},uRoughness:{value:.35},uReflectionQuality:{value:1},uMicroWaveDetail:{value:1},uSkyReflectionEnabled:{value:1},uBiomeColorEnabled:{value:1},uBiomeColorStrength:{value:.55},...ba(),uWaterAnim:{value:1},uWaterFadeStart:{value:99999},uWaterFadeEnd:{value:1e5},uWaterTier:{value:1},uWaterOpacity:{value:.72},uFresnelStrength:{value:1},uRefractionStrength:{value:.45},uSpecularStrength:{value:1},uDepthColorStr:{value:1},uDepthOpacityStr:{value:1},uMaxVisibleDepth:{value:120},uDepthFalloff:{value:1},uShallowDist:{value:8},uDeepDist:{value:55},uAbsorptionStr:{value:1},uWaveSpeed:{value:1},uWaveScale:{value:1},uWaveStrength:{value:1},uSmallWaveStr:{value:.65},uLargeWaveStr:{value:1},uNormalIntensity:{value:1},uWaveDir:{value:new J(1,0)},uAnimSpeed:{value:1},uFoamEnabled:{value:1},uFoamStrength:{value:.75},uFoamWidth:{value:3.2},uFoamSoftness:{value:.6},uFoamAnimSpeed:{value:1},uSlopeFoam:{value:.5},uCliffFoam:{value:.65},uCausticsStr:{value:.4},uCausticMinDepth:{value:1},uCausticMinDepthFalloff:{value:1},uRefractionQual:{value:.6},uFoamQual:{value:1},uCausticsQual:{value:.5},uSceneColor:{value:null},uSceneDepth:{value:null},uSceneTexelSize:{value:new J(1,1)},uSceneViewportInv:{value:new J(1,1)},uSceneNear:{value:1},uSceneFar:{value:5e4},uSceneRefractionEnabled:{value:0},uPlanarReflection:{value:null},uPlanarReflectionMatrix:{value:new dt},uPlanarReflectionTexelSize:{value:new J(1,1)},uPlanarReflectionEnabled:{value:0},uGeometryFocus:{value:new J(0,0)},uGeometryDisplacementEnabled:{value:0},uDebugMode:{value:0}}}function qo(t,e=7,o=kt,a=null){return new mt({uniforms:At(t,a),defines:{OCTAVES:e},vertexShader:Dt,fragmentShader:Ie(o,!1),transparent:!0,premultipliedAlpha:!0,depthTest:!0,depthWrite:!1,side:Ae,forceSinglePass:!0})}function Xo(t,e=7,o=kt,a=null){const r=new mt({uniforms:At(t,a),defines:{OCTAVES:e,INFINITE_MODE:1},vertexShader:Dt,fragmentShader:Ie(o,!0),transparent:!0,premultipliedAlpha:!0,depthTest:!0,depthWrite:!1,side:Ae,forceSinglePass:!0});return r.uniforms.uWaterFadeStart.value=2e3,r.uniforms.uWaterFadeEnd.value=2500,r}function Zo(t,e){const o=Object.hasOwn(t.defines??{},"INFINITE_MODE");t.fragmentShader=Ie(e,o),t.needsUpdate=!0}function Vo(t,e,o){if(!(t!=null&&t.uniforms))return;const a=t.uniforms,r=o==="cinematic"?3:o==="volumetric"?2:1,n=(e.waterWaveDirection??0)*Math.PI/180;a.uWaterTier.value=r,a.uWaterOpacity.value=e.waterOpacity??.72,a.uRoughness.value=e.waterRoughness??.35,a.uReflectionQuality.value=e.waterReflectionQuality??1,a.uMicroWaveDetail.value=e.waterNormalResolution??1,a.uSkyReflectionEnabled.value=e.skyboxEnabled!==!1?1:0,a.uBiomeColorEnabled.value=e.waterBiomeColorEnabled!==!1?1:0,a.uBiomeColorStrength.value=e.waterBiomeColorStrength??.55,a.uFresnelStrength.value=e.waterFresnelStrength??1,a.uRefractionStrength.value=e.waterRefractionStrength??.45,a.uSpecularStrength.value=e.waterSpecularStrength??1,a.uDepthColorStr.value=e.waterDepthColorStrength??1,a.uDepthOpacityStr.value=e.waterDepthOpacityStrength??1,a.uMaxVisibleDepth.value=e.waterMaxVisibleDepth??120,a.uDepthFalloff.value=e.waterDepthFalloff??1,a.uShallowDist.value=e.waterShallowDistance??8,a.uDeepDist.value=e.waterDeepDistance??55,a.uAbsorptionStr.value=e.waterAbsorptionStrength??1,a.uWaveSpeed.value=e.waterWaveSpeed??1,a.uWaveScale.value=e.waterWaveScale??1,a.uWaveStrength.value=e.waterWaveStrength??1,a.uSmallWaveStr.value=e.waterSmallWaveStrength??.65,a.uLargeWaveStr.value=e.waterLargeWaveStrength??1,a.uNormalIntensity.value=e.waterNormalIntensity??1,a.uWaveDir.value.set(Math.cos(n),Math.sin(n)),a.uAnimSpeed.value=e.waterAnimSpeed??1,a.uFoamEnabled.value=e.waterFoamEnabled!==!1?1:0,a.uFoamStrength.value=e.waterFoamStrength??.75,a.uFoamWidth.value=e.waterFoamWidth??3.2,a.uFoamSoftness.value=e.waterFoamSoftness??.6,a.uFoamAnimSpeed.value=e.waterFoamAnimSpeed??1,a.uSlopeFoam.value=e.waterSlopeFoam??.5,a.uCliffFoam.value=e.waterCliffFoam??.65,a.uCausticsStr.value=e.waterUnderwaterCaustics??.4,a.uCausticMinDepth.value=e.waterUnderwaterCausticMinDepth??1,a.uCausticMinDepthFalloff.value=e.waterUnderwaterCausticMinDepthFalloff??1,a.uRefractionQual.value=(e.waterRefractionQuality??.6)*(r>=2?1:.5),a.uFoamQual.value=e.waterFoamQuality??1,a.uCausticsQual.value=(e.waterCausticsQuality??.5)*(r>=2?1:.25),a.uGeometryDisplacementEnabled.value=r>=3?1:0}function ao(t,e){var a;if(!((a=t==null?void 0:t.uniforms)!=null&&a.uDebugMode))return;const o={off:0,depth:1,shoreline:2,foam:3,mask:4,normal:5,opticalDepth:6,transmittance:7,fresnel:8,reflection:9,refraction:10,opacity:11};t.uniforms.uDebugMode.value=o[e]??0}const Ko=[{value:"off",label:"꺼짐"},{value:"depth",label:"깊이 맵"},{value:"shoreline",label:"해안선 마스크"},{value:"foam",label:"거품 마스크"},{value:"mask",label:"Water Mask"},{value:"normal",label:"표면 법선"},{value:"opticalDepth",label:"광학 깊이"},{value:"transmittance",label:"투과율"},{value:"fresnel",label:"프레넬"},{value:"reflection",label:"하늘 반사"},{value:"refraction",label:"투과 / 굴절"},{value:"opacity",label:"최종 불투명도"}];function Qo(t,e){var o;for(const a of t)(o=a==null?void 0:a.uniforms)!=null&&o.uDebugMode&&ao(a,e)}const lt={enabled:!1,mode:"elevation",display:"overlay",opacity:.72,min:0,max:600,thresholdA:35,thresholdB:55,contourSpacing:50,contourStrength:.35,legend:!0,quality:"high"},Rt=["elevation","slope","normals","curvature","waterDepth","biome","contribution"],oo=Object.fromEntries(Rt.map((t,e)=>[t,e+1]));class Yo{constructor({uniforms:e,getParams:o,onChange:a}){this.uniforms=e,this.getParams=o,this.onChange=a,this.state={...lt},this._sync()}setMode(e){this.setSettings({mode:Rt.includes(e)?e:"elevation",enabled:!0})}setSettings(e){var o;Object.assign(this.state,e),this.state.opacity=Math.max(0,Math.min(1,this.state.opacity)),this._sync(),(o=this.onChange)==null||o.call(this,{...this.state})}_sync(){const e=this.getParams(),o=this.state;this.uniforms.uAnalysisEnabled.value=o.enabled?1:0,this.uniforms.uAnalysisMode.value=oo[o.mode]||1,this.uniforms.uAnalysisOpacity.value=o.opacity,this.uniforms.uAnalysisMin.value=o.min,this.uniforms.uAnalysisMax.value=o.max||e.heightScale,this.uniforms.uAnalysisThresholdA.value=o.thresholdA,this.uniforms.uAnalysisThresholdB.value=o.thresholdB,this.uniforms.uAnalysisContourSpacing.value=o.contourSpacing,this.uniforms.uAnalysisContourStrength.value=o.contourStrength}serialize(){return{...this.state}}load(e){var o;this.state={...lt,...e||{}},this._sync(),(o=this.onChange)==null||o.call(this,{...this.state})}}const Jo={elevation:"�음  ─────────  높음",slope:"Flat · Walkable · Steep · Cliff",normals:"월드 공간 노멀",curvature:"계곡 ─ 평지 ─ 능선",waterDepth:"Shallow  ─────────  Deep",biome:"Biome distribution",contribution:"Base · Paint · Splines"},ro={id:"unity",label:"Unity 지형",description:"16-bit RAW heightmap, terrain masks, and Unity scale metadata.",defaults:{format:"glb",meshRes:"512",texRes:"2048",includeMesh:!1,bakeColor:!0,bakeNormal:!0,exportHeightmap:!0,exportSplat:!0,exportCollision:!0,collisionRes:"128",exportWater:!0,exportWaterMask:!0,exportWaterMetadata:!0},layout:{root:"지형",heightmapRawPath:"Terrain/heightmap.raw",paths:{"terrain.glb":"Terrain/terrain.glb","terrain.obj":"Terrain/terrain.obj","collision.glb":"Terrain/collision.glb","textures/terrain_color.png":"Terrain/textures/terrain_color.png","textures/terrain_normal.png":"Terrain/textures/terrain_normal.png","textures/terrain_splat.png":"Terrain/splatmaps/biomes.png"}}},no={id:"unreal",label:"언리얼 랜드스케이프",description:"16비트 풍경 높이맵, 가중치맵, 센티미터 월드 스케일.",defaults:{format:"glb",meshRes:"512",texRes:"2048",includeMesh:!1,bakeColor:!0,bakeNormal:!0,exportHeightmap:!0,exportSplat:!0,exportCollision:!0,collisionRes:"128",exportWater:!0,exportWaterMask:!0,exportWaterMetadata:!0},layout:{root:"풍경",heightmapRawPath:"Landscape/heightmap.r16",paths:{"terrain.glb":"Landscape/terrain.glb","terrain.obj":"Landscape/terrain.obj","collision.glb":"Landscape/collision.glb","textures/terrain_color.png":"Landscape/textures/terrain_color.png","textures/terrain_normal.png":"Landscape/textures/terrain_normal.png","textures/terrain_splat.png":"Landscape/weightmaps/biomes.png"}}},io={id:"godot",label:"Godot Terrain3D",description:"가져오기 가능한 높이맵, 텍스처 레이어, 항법/물 마스크.",defaults:{format:"glb",meshRes:"512",texRes:"2048",includeMesh:!0,bakeColor:!0,bakeNormal:!0,exportHeightmap:!0,exportSplat:!0,exportWater:!0,exportWaterMask:!0,exportWaterMetadata:!0},layout:{root:"Terrain3D",heightmapRawPath:"Terrain3D/heightmap.r16",paths:{"terrain.glb":"Terrain3D/terrain.glb","terrain.obj":"Terrain3D/terrain.obj","collision.glb":"Terrain3D/collision.glb","textures/terrain_color.png":"Terrain3D/textures/albedo.png","textures/terrain_normal.png":"Terrain3D/textures/normal.png","textures/terrain_splat.png":"Terrain3D/textures/biomes.png"}}},so={id:"blender",label:"블렌더 씬",description:"GLB terrain package with baked material maps and scene notes.",defaults:{format:"glb",meshRes:"512",texRes:"2048",includeMesh:!0,includeSkirts:!0,includeBase:!0,bakeColor:!0,bakeNormal:!0,exportHeightmap:!0,exportWater:!0,exportCollision:!1},layout:{root:"Blender",paths:{"terrain.glb":"Blender/terrain.glb","terrain.obj":"Blender/terrain.obj","textures/terrain_color.png":"Blender/textures/terrain_color.png","textures/terrain_normal.png":"Blender/textures/terrain_normal.png","textures/terrain_heightmap.png":"Blender/textures/terrain_heightmap.png","textures/terrain_splat.png":"Blender/textures/terrain_splat.png"}}},lo={id:"three",label:"Three.js Viewer Assets",description:"Three.js 뷰어용 웹 지원 GLB 및 텍스처 패키지.",defaults:{format:"glb",meshRes:"256",texRes:"1024",includeMesh:!0,bakeColor:!0,bakeNormal:!0,exportHeightmap:!0,exportWater:!0,exportWaterMask:!0},layout:{root:"terrain-viewer",paths:{"terrain.glb":"terrain-viewer/assets/terrain.glb","terrain.obj":"terrain-viewer/assets/terrain.obj","textures/terrain_color.png":"terrain-viewer/assets/terrain_color.png","textures/terrain_normal.png":"terrain-viewer/assets/terrain_normal.png","textures/terrain_heightmap.png":"terrain-viewer/assets/terrain_heightmap.png","textures/terrain_splat.png":"terrain-viewer/assets/terrain_splat.png"}}},Lt=[ro,no,io,so,lo],er=[{value:"custom",label:"Custom export"},...Lt.map(({id:t,label:e})=>({value:t,label:e}))];function Ct(t){return Lt.find(e=>e.id===t)??null}function tr(t,e){const o=Ct(e);return o?{...t,...o.defaults,exportPresetId:o.id,packageRoot:o.layout.root,packagePaths:o.layout.paths,heightmapRawPath:o.layout.heightmapRawPath??null}:{...t,exportPresetId:"custom",packageRoot:null,packagePaths:null,heightmapRawPath:null}}function ar(t,e){const o=Ct(t.exportPresetId);if(!o)return{};const a=o.layout.root,r=Number(e.boardSize)||0,n={app:"절차적 지형",version:1,preset:o.id,generatedAt:new Date().toISOString(),seed:e.seed,worldSizeMeters:r,heightRangeMeters:Number(e.heightScale)||0,coordinateSystem:o.id==="unreal"?"언리얼 센티미터 (Z-up 가져오기)":"Y-up meters",files:o.layout.paths},i=`${o.label}

Import the files in this folder using your engine's terrain import workflow.
World size: ${r} m. Height range: ${n.heightRangeMeters} m.
`,l=s=>new TextEncoder().encode(s);return{[`${a}/terrain.json`]:l(JSON.stringify(n,null,2)),[`${a}/README.txt`]:l(i)}}const co=4096,uo=1024;function or(t={},e={}){const o=[],a=(i,l)=>o.push({status:i,message:l}),r=Number(t.texRes)||0,n=Number(t.meshRes)||0;return e.worldMode==="planet"&&t.exportPresetId&&t.exportPresetId!=="custom"&&a("warning","Engine presets currently package studio terrain exports; planet export keeps its native layout."),Number(e.boardSize)>0?a("success",`Terrain scale valid (${Math.round(e.boardSize)} m board).`):a("error","지형 스케일이 잘못되었습니다."),!t.includeMesh&&!t.exportHeightmap&&a("error","내보낼 지형 메시 또는 높이맵을 선택하세요."),t.exportHeightmap&&![512,1024,2048,4096].includes(r)?a("error","높이맵 해상도는 512, 1024, 2048 또는 4096이어야 합니다."):t.exportHeightmap&&a("success",`Heightmap ${r} × ${r}.`),r>co?a("error","텍스처 해상도가 지원되는 4096 한계를 초과합니다."):r>=4096&&a("warning","4K 맵은 상당한 GPU 메모리를 필요로 할 수 있습니다."),n>uo?a("error","메시 밀도가 지원되는 1024 한도를 초과합니다."):t.includeMesh&&a("success",`Mesh density ${n} × ${n}.`),t.exportWater&&!t.exportWaterMask?a("warning","Water is included without a water mask."):t.exportWaterMask&&a("success","물 마스크 사용 가능."),t.exportSplat&&a("success","바이옴 스플랫 맵 사용 가능."),o}function rr(t){return t.some(e=>e.status==="error")}export{ho as $,Jo as A,je as B,ka as C,ha as D,Ao as E,ko as F,ga as G,na as H,_e as I,pa as J,va as K,ba as L,po as M,Go as N,Po as O,Ha as P,Ia as Q,Ba as R,Wa as S,vt as T,Ho as U,Io as V,Ko as W,Oo as X,wo as Y,So as Z,Re as _,Ma as a,vo as a0,Do as a1,Vo as a2,ao as a3,Xo as a4,qo as a5,Zo as a6,Qo as a7,Sa as a8,jo as a9,Yo as aa,Ro as ab,Ca as ac,_o as ad,To as ae,Fo as af,Uo as ag,ar as ah,Eo as ai,Bo as aj,Mo as ak,Qe as b,Wo as c,zo as d,$o as e,Co as f,We as g,No as h,go as i,rr as j,Ct as k,er as l,tt as m,tr as n,$e as o,Lo as p,ua as q,wa as r,ra as s,aa as t,yo as u,or as v,Ue as w,bo as x,oa as y,xo as z};
