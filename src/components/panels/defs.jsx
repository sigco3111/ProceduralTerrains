import { ColorInput } from '../controls.jsx';

// Shared control definitions used across drawer panels (moved out of the old
// LeftControlPanel so panels can import them directly).

export const TERRAIN_SLIDERS = [
  {
    key: 'heightScale', label: '높이 스케일', min: 20, max: 1000, step: 5, unit: 'm',
    info: '산 높이의 최대 진폭 (미터)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'seaLevel', label: '해수면', min: 0, max: 250, step: 1, unit: 'm',
    info: '깊은 물과 해안 생태계의 심부 오프셋',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1 9c1.5-1 2.5-1 4 0s2.5 1 4 0 2.5-1 4 0 2.5 1 3 0" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'falloff', label: '가장자리 감쇠 너비', min: 0, max: 1, step: 0.01, digits: 2,
    info: 'Edge attenuation band for the island/mountain rim. 0 leaves the terrain unchanged to the boundary',
    icon: (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
];

export const NOISE_SLIDERS = [
  {
    key: 'noiseScale', label: '노이즈 스케일', min: 8, max: 160, step: 0.5, digits: 1,
    info: '지형 프랙탈 노이즈의 전역 주파수 스케일 (값이 클수록 더 큰 지형 특징 생성)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12M4 5l-2 3 2 3M12 5l2 3-2 3" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'noiseStrength', label: '노이즈 세기', min: 0.1, max: 2, step: 0.01, digits: 2,
    info: '최종 높이 출력에 적용되는 전체 배수',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v12M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'terrainSmoothing', label: '봉우리 스무딩', min: 0, max: 1, step: 0.01, digits: 2,
    info: 'Rounds only high, pointy peaks while leaving low hills, shores and broad terrain mostly unchanged',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1.5 11.5c2-4.5 4-6 6-2.5 1.9 3.2 4.1 2.2 7-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>),
  },
  {
    key: 'octaves', label: '옥타브', min: 1, max: 9, step: 1,
    info: '레이어드 노이즈 디테일 패스 수 (값이 클수록 더 정밀하지만 느려짐)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 12h12M2 8h12M2 4h12" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'persistence', label: '지속성', min: 0.15, max: 0.85, step: 0.01, digits: 2,
    info: 'Amplitude retention factor of successive octave passes (higher = rougher terrain)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1 8h3v1h3v1h3v1h5" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'lacunarity', label: '틈새도', min: 1.5, max: 3.5, step: 0.01, digits: 2,
    info: 'Frequency scale factor of successive octave passes (higher = finer detail frequency)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1 8h2v-4h2v4h2v-4h2v4h2v-4h2v4h1" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'ridge', label: '능선 강도', min: 0, max: 1, step: 0.01, digits: 2,
    info: '봉우리 능선 구조의 선명도 (값이 클수록 알파인/캐년에 가까움)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1 13l4-8 3 5 4-7 3 10H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>),
  },
  {
    key: 'warp', label: '도메인 뒤틀림', min: 0, max: 3, step: 0.05, digits: 2,
    info: '지형 표면의 접힘을 비틀거나 레이어링하기 위한 도메인 워핑 강도',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 8c2-4 4 4 6 0s4-4 6 0" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
];

export const BIOME_SLIDERS = [
  {
    key: 'biomeScale', label: '생태계 밀도', min: 0.3, max: 3, step: 0.05, digits: 2,
    info: '생태계의 분포 빈도 (높을수록 생태계 맵이 더 잘게 분할됨)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" /><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" /></svg>),
  },
  {
    key: 'tempBias', label: '온도', min: -1, max: 1, step: 0.05, digits: 2,
    info: '세계 온도를 조정합니다 (낮을수록 눈/툰드라, 높을수록 사막/건조 초원)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8 8.5V3a1 1 0 0 0-2 0v5.5a2.5 2.5 0 0 0 2 0z" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'moistScale', label: '수분 스케일', min: 0.2, max: 3, step: 0.05, digits: 2,
    info: '수분 띠의 주파수 스케일 (값이 클수록 수분 패치가 더 다양해짐)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M8 2c-1.5 2.5-4 4-4 6.5a4 4 0 0 0 8 0C12 6 9.5 4.5 8 2z" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'moistBias', label: '수분 편향', min: -1, max: 1, step: 0.05, digits: 2,
    info: 'Adjust world moisture level (wetter = more forests/jungles, drier = desert/grass)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M3 10.5a2.5 2.5 0 0 1 2-4.4 3.5 3.5 0 0 1 6.8 1.1 2.5 2.5 0 0 1-.8 4.8H3zM5 14v-2M8 14v-2M11 14v-2" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'snowLine', label: '적설선', min: 0.2, max: 1, step: 0.01, digits: 2,
    info: '절벽 봉우리에 눈이 덮이기 시작하는 높이 임계값',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 13h12M8 2L4.5 9h7L8 2z" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'snowSlopeMin', label: '적설 경사 유지', min: 0, max: 0.9, step: 0.01, digits: 2,
    info: 'Slope below which snow keeps full coverage. Raise to let snow cling to steeper faces',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 13L8 4l6 9H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M6.2 7h3.6" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'snowSlopeMax', label: '적설 경사 흘림', min: 0.1, max: 1, step: 0.01, digits: 2,
    info: 'Slope above which snow sheds entirely. Lower keeps snow only on flat high-altitude ground (more plausible alpine look)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 13L8 4l6 9H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 4v4M8 13v-2" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'rockSlopeLo', label: '암석 경사 시작', min: 0, max: 0.9, step: 0.01, digits: 2,
    info: 'Slope where bare rock starts replacing vegetation. Lower exposes rock on gentler terrain',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 13l4-6 3 3 3-5 2 8H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>),
  },
  {
    key: 'rockSlopeHi', label: '암석 경사 전체', min: 0.1, max: 1, step: 0.01, digits: 2,
    info: '완전 암석 노출의 경사도. 값이 낮을수록 가파른 면이 더 빨리 절벽으로 인식됩니다',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M3 13V6l4-3 6 4v6H3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>),
  },
];

export const RENDER_SLIDERS = [
  {
    key: 'normalStrength', label: '노멀 강도', min: 0.2, max: 3, step: 0.05, digits: 2,
    info: '절차적 표면 디테일 노멀 매핑의 강도 계수',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v12M8 2l-3 3M8 2l3 3" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'aoStrength', label: '주변 폐색', min: 0, max: 1, step: 0.05, digits: 2,
    info: '틈새와 계곡의 그림자 음영 강도 (앰비언트 오클루전)',
    icon: (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'aoRidge', label: '능선 강조', min: 0, max: 1, step: 0.01, digits: 2,
    info: 'Brightens convex ridge crests so alpine ridgelines catch the light. 0 = classic shading',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M1 13l4-8 3 5 4-7 3 10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M5 5l1-2M12 3l1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>),
  },
];

export const WATER_COLORS = [
  {
    key: 'deep', label: '깊은 물', info: '가장 깊은 바다 밑바닥의 색상',
    icon: (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="3" fill="currentColor" /></svg>),
  },
  {
    key: 'shallow', label: '얕음', info: '해안과 얕은 해안선의 색상',
    icon: (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
  {
    key: 'foam', label: '거품', info: 'Color of waves breaking near the shoreline',
    icon: (<svg viewBox="0 0 16 16" fill="none"><path d="M2 10a2 2 0 0 1 4 0M6 10a2 2 0 0 1 4 0M10 10a2 2 0 0 1 4 0" stroke="currentColor" strokeWidth="1.2" /></svg>),
  },
];

// Shared info-dot used next to labels.
export function InfoDot() {
  return (
    <span className="info-icon-trigger">
      <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// A labelled colour field (matches the existing .color-field markup).
export function ColorField({ label, icon, info, value, onChange }) {
  return (
    <div className="color-field">
      <div className="label-with-icon" data-tooltip={info}>
        {icon && <span className="setting-icon">{icon}</span>}
        <span className="setting-label">{label}</span>
        {info && <InfoDot />}
      </div>
      <ColorInput value={value} onChange={(hex) => onChange({ target: { value: hex } })} />
    </div>
  );
}
import React from 'react';

