import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Dices,
  Droplet,
  Eraser,
  Eye,
  EyeOff,
  Flower2,
  GripVertical,
  Layers3,
  Mountain,
  Minus,
  MousePointer2,
  Move3D,
  Palette,
  Plus,
  RotateCw,
  Scaling,
  SlidersHorizontal,
  Sprout,
  TreePine,
  Trash2,
  Waves,
} from 'lucide-react';
import { SliderCtl } from '../controls.jsx';
import {
  MANUAL_BLEND_MODES,
  MANUAL_MASK_TYPES,
  MANUAL_SHAPE_CATALOG,
  MANUAL_SHAPE_LAYER_CATALOG,
  MAX_MANUAL_SHAPE_LAYERS,
  getManualShapeDefinition,
  getManualShapeLayerDefinition,
} from '../../manual/ManualShapeCatalog.js';
import {
  MANUAL_SURFACE_MATERIALS,
  manualSurfaceDiffuseUrl,
} from '../../manual/ManualSurfaceCatalog.js';

const TRANSFORMS = [
  { id: 'translate', label: '이동', Icon: Move3D, shortcut: 'M' },
  { id: 'rotate', label: '회전', Icon: RotateCw, shortcut: 'R' },
  { id: 'scale', label: '스케일', Icon: Scaling, shortcut: 'S' },
];

const SCULPT_TOOLS = [
  { id: 'raise', label: '올리기', Icon: Mountain, description: '넓은 양의 지형 고도를 만듭니다.' },
  { id: 'lower', label: '더 낮음', Icon: Minus, description: '지형에 넓은 움푹 패인 곳을 깎아냅니다.' },
  { id: 'smooth', label: '부드러움', Icon: Waves, description: '전체 형태를 평탄화하지 않으면서 급격한 고도 변화를 완화합니다.' },
  { id: 'flatten', label: '평탄화', Icon: SlidersHorizontal, description: '지형을 정확한 표고로 이동시킵니다.' },
  { id: 'erode', label: '침식', Icon: Droplet, description: '재료를 내리막으로 이동시켜 낮은 지역에 퇴적물을 쌓습니다.' },
  { id: 'crease', label: '주름', Icon: Minus, description: 'Cut narrow gullies, cracks, and drainage lines.' },
  { id: 'ridge', label: '산등성이', Icon: Mountain, description: '지형을 좁은 능선과 산등성이로 위로 꼬집어 올립니다.' },
  { id: 'detail', label: '디테일', Icon: Dices, description: '큰 형태 위에 시드 기반 다중 스케일 암석 릴리프를 페인트합니다.' },
  { id: 'terrace', label: '테라스', Icon: GripVertical, description: '편집 가능한 단계와 선반 단위로 표고를 양자화합니다.' },
  { id: 'erase', label: '지우기', Icon: Eraser, description: '조각된 디테일을 제거하고 프로시저럴 형태를 드러냅니다.' },
];

const TEXTURE_TOOLS = [
  { id: 'paint', label: '페인트', Icon: Palette },
  { id: 'blend', label: '혼합', Icon: Waves },
  { id: 'erase', label: '지우기', Icon: Eraser },
];

const PROP_PAINT_TYPES = [
  { id: 'grass', label: '잔디', Icon: Sprout, color: '#65a30d' },
  { id: 'flowers', label: '꽃', Icon: Flower2, color: '#f472b6' },
  { id: 'rocks', label: '바위', Icon: Mountain, color: '#a8a29e' },
  { id: 'trees', label: '나무', Icon: TreePine, color: '#15803d' },
];

const MIN_LIBRARY_HEIGHT = 150;
const MAX_LIBRARY_HEIGHT = 520;
const MIN_VISIBLE_VIEWPORT_HEIGHT = 220;

const PIXEL_PREVIEWS = {
  mountain: [
    '0000000010000000',
    '0000000121000000',
    '0000001222100000',
    '0000012222210000',
    '0000122233221000',
    '0001222333322100',
    '0012233333332210',
    '0122333333333221',
    '1223333333333222',
    '2222222222222222',
  ],
  'sharp-peak': [
    '0000000010000000',
    '0000000131000000',
    '0000001333100000',
    '0000001333210000',
    '0000013333221000',
    '0000133333322100',
    '0001333333332210',
    '0013333333333221',
    '0133333333333322',
    '1333333333333332',
  ],
  ridge: [
    '0000000000000000',
    '0000100000010000',
    '0001210000121000',
    '0012321001232100',
    '0123332123333210',
    '1233332333333321',
    '2333333333333332',
    '3333333333333333',
    '3333333333333333',
    '2222222222222222',
  ],
  valley: [
    '4444444444444444',
    '4444444444444444',
    '4422222222222244',
    '4222222222222224',
    '2222111111112222',
    '2221100000011222',
    '2211000000001122',
    '2221100000011222',
    '2222111111112222',
    '4222222222222224',
  ],
  canyon: [
    '4444444444444444',
    '4222222222222224',
    '2222222222222222',
    '2222211111122222',
    '2222110000112222',
    '2221100000011222',
    '2221100000011222',
    '2222110000112222',
    '2222211111122222',
    '2222222222222222',
  ],
  plateau: [
    '0000000000000000',
    '0001111111111000',
    '0012222222222100',
    '0122222222222210',
    '1222222222222221',
    '2333333333333332',
    '2333333333333332',
    '2333333333333332',
    '2333333333333332',
    '2222222222222222',
  ],
  crater: [
    '0000011111100000',
    '0001222222210000',
    '0012222222222100',
    '0122233333222210',
    '1223300000332221',
    '1223000000032221',
    '1223300000332221',
    '0122233333222210',
    '0012222222222100',
    '0001222222210000',
  ],
};

const PIXEL_COLORS = {
  '0': 'transparent',
  '1': 'var(--terrain-preview-highlight)',
  '2': 'var(--terrain-preview-light)',
  '3': 'var(--terrain-preview-mid)',
  '4': 'var(--terrain-preview-ground)',
};

function TerrainShapePreview({ type }) {
  const pixels = PIXEL_PREVIEWS[type] ?? PIXEL_PREVIEWS.mountain;

  return (
    <svg className="manual-pixel-preview" viewBox="0 0 64 40" aria-hidden="true" shapeRendering="crispEdges">
      {pixels.flatMap((row, y) => [...row].map((pixel, x) => (
        pixel === '0' ? null : <rect key={`${x}-${y}`} x={x * 4} y={y * 4} width="4" height="4" fill={PIXEL_COLORS[pixel]} />
      )))}
    </svg>
  );
}
export default function ManualTerrainPanel({
  state,
  boardSize,
  libraryHeight = 214,
  onLibraryHeightChange,
  inspectorReplaced = false,
  toolsRailVisible = false,
  toolsRailEdge = 'left',
  onPlacementType,
  onBeginDrag,
  onEndDrag,
  onSelect,
  onTransformMode,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  onAddShapeLayer,
  onUpdateShapeLayer,
  onDeleteShapeLayer,
  onDuplicateShapeLayer,
  onReorderShapeLayer,
  onSculptEnabled,
  onSculptSetting,
  onClearSculpt,
  onTexturePaintEnabled,
  onTexturePaintSetting,
  onClearTexturePaint,
  onClearPropPaint,
}) {
  const shapes = state?.shapes ?? [];
  const selected = shapes.find((shape) => shape.id === state?.selectedId) ?? null;
  const activeSculptTool = SCULPT_TOOLS.find((tool) => tool.id === state?.sculpt?.tool) ?? SCULPT_TOOLS[0];
  const categories = useMemo(() => {
    const grouped = new Map();
    for (const shape of MANUAL_SHAPE_CATALOG) {
      if (!grouped.has(shape.category)) grouped.set(shape.category, []);
      grouped.get(shape.category).push(shape);
    }
    return [...grouped.entries()];
  }, []);
  const half = Math.max(500, boardSize * 0.5);
  const sideToolOffset = (side) => (toolsRailVisible && toolsRailEdge === side ? 64 : 0);
  const topToolOffset = toolsRailVisible && toolsRailEdge === 'top' ? 58 : 0;
  const bottomToolOffset = toolsRailVisible && toolsRailEdge === 'bottom' ? 58 : 0;
  const inspectorWidth = 304;
  const workspaceRef = useRef(null);
  const libraryResizeRef = useRef(null);
  const [expandedLayerId, setExpandedLayerId] = useState(null);

  const clampLibraryHeight = (height, target) => {
    const workspace = target?.matches?.('.manual-terrain-workspace')
      ? target
      : target?.closest('.manual-terrain-workspace');
    const workspaceHeight = workspace?.getBoundingClientRect().height ?? window.innerHeight;
    const availableHeight = Math.max(
      MIN_LIBRARY_HEIGHT,
      workspaceHeight - bottomToolOffset - MIN_VISIBLE_VIEWPORT_HEIGHT,
    );
    return Math.round(Math.min(MAX_LIBRARY_HEIGHT, availableHeight, Math.max(MIN_LIBRARY_HEIGHT, height)));
  };

  const startLibraryResize = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    libraryResizeRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: libraryHeight,
    };
  };

  const resizeLibrary = (event) => {
    const resize = libraryResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    onLibraryHeightChange?.(clampLibraryHeight(
      resize.startHeight + resize.startY - event.clientY,
      event.currentTarget,
    ));
  };

  const finishLibraryResize = (event) => {
    const resize = libraryResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    libraryResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resizeLibraryWithKeyboard = (event) => {
    const step = event.shiftKey ? 32 : 12;
    let nextHeight = null;
    if (event.key === 'ArrowUp') nextHeight = libraryHeight + step;
    if (event.key === 'ArrowDown') nextHeight = libraryHeight - step;
    if (event.key === 'Home') nextHeight = MIN_LIBRARY_HEIGHT;
    if (event.key === 'End') nextHeight = MAX_LIBRARY_HEIGHT;
    if (nextHeight == null) return;
    event.preventDefault();
    onLibraryHeightChange?.(clampLibraryHeight(nextHeight, event.currentTarget));
  };

  useEffect(() => {
    const fitLibraryToWorkspace = () => {
      const nextHeight = clampLibraryHeight(libraryHeight, workspaceRef.current);
      if (nextHeight !== libraryHeight) onLibraryHeightChange?.(nextHeight);
    };
    fitLibraryToWorkspace();
    window.addEventListener('resize', fitLibraryToWorkspace);
    return () => window.removeEventListener('resize', fitLibraryToWorkspace);
  }, [libraryHeight, bottomToolOffset, onLibraryHeightChange]);
  useEffect(() => {
    setExpandedLayerId((current) => selected?.layers?.some((layer) => layer.id === current) ? current : null);
  }, [selected?.id, selected?.layers]);
  const positionX = { label: 'X 위치', min: -half, max: half, step: 1, digits: 0, unit: 'u' };
  const positionZ = { label: 'Z 위치', min: -half, max: half, step: 1, digits: 0, unit: 'u' };
  const rotation = { label: '회전', min: -180, max: 180, step: 1, digits: 0, unit: 'deg' };
  const scaleX = { label: '스케일 X', min: 8, max: Math.max(1000, boardSize), step: 2, digits: 0, unit: 'u' };
  const scaleZ = { label: '스케일 Z', min: 8, max: Math.max(1000, boardSize), step: 2, digits: 0, unit: 'u' };
  const height = { label: '높이', min: -1000, max: 1000, step: 2, digits: 0, unit: 'u' };
  const detail = { label: '디테일', min: 0, max: 1, step: 0.01, digits: 2 };
  const opacity = { label: '불투명도', min: 0, max: 1, step: 0.01, digits: 2 };
  const sharpness = { label: '선예도', min: 0.2, max: 4, step: 0.05, digits: 2 };
  const terraces = { label: '테라스', min: 0, max: 16, step: 1, digits: 0 };
  const maskFeather = { label: '마스크 페더', min: 0.02, max: 1, step: 0.01, digits: 2 };
  const maskStrength = { label: '마스크 강도', min: 0, max: 1, step: 0.01, digits: 2 };
  const brushSize = { label: '브러시 크기', min: 4, max: 900, step: 2, digits: 0, unit: 'u' };
  const brushStrength = { label: '세기', min: 0.01, max: 1, step: 0.01, digits: 2 };
  const brushFalloff = { label: '감쇠', min: 0.02, max: 1, step: 0.01, digits: 2 };
  const targetHeight = { label: '타겟 높이', min: -1000, max: 1000, step: 2, digits: 0, unit: 'u' };
  const creaseWidth = { label: '프로필 너비', min: 0.04, max: 0.8, step: 0.01, digits: 2 };
  const detailScale = { label: '디테일 스케일', min: 2, max: 240, step: 2, digits: 0, unit: 'u' };
  const detailRoughness = { label: '거칠기', min: 0, max: 1, step: 0.01, digits: 2 };
  const terraceStep = { label: '단차 높이', min: 1, max: 400, step: 1, digits: 0, unit: 'u' };
  const erosionIterations = { label: '반복 횟수', min: 1, max: 10, step: 1, digits: 0 };
  const erosionDeposition = { label: '퇴적물 퇴적', min: 0, max: 1, step: 0.01, digits: 2 };
  const erosionTalus = { label: '암설 임계값', min: 0, max: 20, step: 0.1, digits: 1 };
  const textureBrushSize = { label: '브러시 크기', min: 4, max: 900, step: 2, digits: 0, unit: 'u' };
  const textureStrength = { label: '세기', min: 0.01, max: 1, step: 0.01, digits: 2 };
  const textureFalloff = { label: '가장자리 블렌드', min: 0.02, max: 1, step: 0.01, digits: 2 };
  const layerOpacity = { label: '레이어 불투명도', min: 0, max: 1, step: 0.01, digits: 2 };

  const libraryStyle = {
    left: sideToolOffset('left'),
    right: sideToolOffset('right') + (inspectorReplaced ? 0 : inspectorWidth),
    bottom: bottomToolOffset,
    height: libraryHeight,
  };
  const inspectorStyle = {
    right: sideToolOffset('right'),
    top: topToolOffset,
    bottom: bottomToolOffset,
    width: inspectorWidth,
  };

  return (
    <section ref={workspaceRef} className={`manual-terrain-workspace${inspectorReplaced ? ' inspector-replaced' : ''}`} aria-label="수동 지형 작업 공간">
      <div className="manual-viewport-tools" role="toolbar" aria-label="셰이프 변환 도구">
        {TRANSFORMS.map(({ id, label, Icon, shortcut }) => (
          <button
            key={id}
            type="button"
            className={state?.transformMode === id ? 'active' : ''}
            onClick={() => onTransformMode(id)}
            title={`${label} (${shortcut})`}
            aria-label={`${label} selected shape (${shortcut})`}
            aria-pressed={state?.transformMode === id}
            disabled={!selected || state?.sculpt?.enabled || state?.texturePaint?.enabled}
          >
            <Icon size={18} aria-hidden />
            <kbd>{shortcut}</kbd>
          </button>
        ))}
        <span className="manual-tool-separator" aria-hidden />
        <button
          type="button"
          className={state?.sculpt?.enabled ? '활성 조각-활성' : ''}
          onClick={() => onSculptEnabled(!state?.sculpt?.enabled)}
          title="수동 조각 (B)"
          aria-label="수동 조각 토글 (B)"
          aria-pressed={!!state?.sculpt?.enabled}
        >
          <SlidersHorizontal size={18} aria-hidden />
          <kbd>B</kbd>
        </button>
        <span className="manual-tool-separator" aria-hidden />
        <button
          type="button"
          className={state?.texturePaint?.enabled ? 'active texture-active' : ''}
          onClick={() => onTexturePaintEnabled(!state?.texturePaint?.enabled)}
          title="표면 & 소품 페인트 (T)"
          aria-label="표면 & 소품 페인트 토글 (T)"
          aria-pressed={!!state?.texturePaint?.enabled}
        >
          <Palette size={18} aria-hidden />
          <kbd>T</kbd>
        </button>
      </div>

      <div className="manual-library-dock" style={libraryStyle}>
        <div
          className="manual-library-resizer"
          role="separator"
          aria-label="모양 라이브러리 크기 조정"
          aria-orientation="horizontal"
          aria-valuemin={MIN_LIBRARY_HEIGHT}
          aria-valuemax={MAX_LIBRARY_HEIGHT}
          aria-valuenow={Math.round(libraryHeight)}
          tabIndex={0}
          onPointerDown={startLibraryResize}
          onPointerMove={resizeLibrary}
          onPointerUp={finishLibraryResize}
          onPointerCancel={finishLibraryResize}
          onKeyDown={resizeLibraryWithKeyboard}
          title="드래그하여 도형 라이브러리 크기 조절"
        />
        <header className="manual-dock-header">
          <div className="node-dock-heading">
            <span className="node-dock-kicker">매뉴얼</span>
            <strong>도형 라이브러리</strong>
          </div>
          <span>지형 위에 모양을 드래그하거나 클릭한 후 배치하세요.</span>
          {state?.placementType ? (
            <button type="button" className="manual-cancel-place" onClick={() => onPlacementType(null)}>배치 취소</button>
          ) : null}
        </header>

        <div className="manual-dock-body">
          <section className="manual-hierarchy">
            <div className="manual-dock-section-title">
              <strong>지형 모양</strong>
              <span>{shapes.length}</span>
            </div>
            {shapes.length === 0 ? (
              <div className="manual-empty-state">
                <MousePointer2 size={16} aria-hidden />
                <span>시작하려면 도형을 배치하세요.</span>
              </div>
            ) : (
              <div className="manual-shape-list">
                {[...shapes].reverse().map((shape, visibleIndex) => (
                  <div className={`manual-shape-row${shape.id === state.selectedId ? ' active' : ''}${shape.enabled === false ? ' disabled' : ''}`} key={shape.id}>
                    <button
                      type="button"
                      className="manual-shape-select"
                      onClick={() => onSelect(shape.id)}
                    >
                      <GripVertical size={12} aria-hidden />
                      <span className="manual-list-type"><Mountain size={13} aria-hidden /></span>
                      <span>
                        <strong>{shape.name}</strong>
                        <small>{getManualShapeDefinition(shape.type).name} · {shape.blendMode}</small>
                      </span>
                    </button>
                    <div className="manual-layer-actions">
                      <button type="button" onClick={() => onUpdate(shape.id, { enabled: shape.enabled === false })} title={shape.enabled === false ? '레이어 표시' : '레이어 숨기기'} aria-label={shape.enabled === false ? `${shape.name} 표시` : `${shape.name} 숨기기`}>
                        {shape.enabled === false ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button type="button" onClick={() => onReorder(shape.id, 1)} disabled={visibleIndex === 0} title="레이어 위로 이동" aria-label={`${shape.name} 도형을 위로 이동`}>
                        <ChevronUp size={12} />
                      </button>
                      <button type="button" onClick={() => onReorder(shape.id, -1)} disabled={visibleIndex === shapes.length - 1} title="레이어 아래로 이동" aria-label={`${shape.name} 도형을 아래로 이동`}>
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="manual-library-scroll">
            {categories.map(([category, entries]) => (
              <section className="manual-library-category" key={category}>
                <h3>{category}</h3>
                <div className="manual-shape-grid">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      draggable
                      className={`manual-shape-card${state?.placementType === entry.id ? ' placing' : ''}`}
                      onClick={() => onPlacementType(state?.placementType === entry.id ? null : entry.id)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData('application/x-terrain-shape', entry.id);
                        onBeginDrag(entry.id);
                      }}
                      onDragEnd={onEndDrag}
                      title={entry.description}
                    >
                      <span className={`manual-shape-thumb type-${entry.id}`}>
                        <TerrainShapePreview type={entry.id} />
                      </span>
                      <span className="manual-shape-card-label">{entry.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {!inspectorReplaced ? (
        <aside className="manual-inspector-dock" style={inspectorStyle} aria-label="지형 모양 인스펙터">
          <header className="node-dock-header manual-inspector-header">
            <div className="node-dock-heading">
              <span className="node-dock-kicker">수동 지형</span>
              <strong>{state?.texturePaint?.enabled
                ? (state.texturePaint.mode === 'props' ? '프롭 페인트' : '텍스처 페인트')
                : state?.sculpt?.enabled ? '스컬프트' : selected?.name || '셰이프 인스펙터'}</strong>
            </div>
            {selected && !state?.sculpt?.enabled && !state?.texturePaint?.enabled ? (
              <div className="manual-shape-actions">
                <button type="button" onClick={() => onDuplicate(selected.id)} title="복제 (Ctrl/Cmd+D)" aria-label="선택한 모양 복제">
                  <Copy size={14} aria-hidden />
                </button>
                <button type="button" className="danger" onClick={() => onDelete(selected.id)} title="삭제" aria-label="선택한 셰이프 삭제">
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            ) : null}
          </header>

          {state?.texturePaint?.enabled ? (
            <div className="manual-inspector-body">
              <p className="manual-inspector-description">
                {state.texturePaint.mode === 'props'
                  ? '수동 지형에 풀, 꽃, 바위, 나무 밀도를 독립적으로 페인트합니다.'
                  : 'Paint the shipped terrain materials directly onto the final surface. Soft weights and triplanar projection keep transitions continuous.'}
              </p>
              <section className="manual-inspector-section">
                <h3>페인트 레이어</h3>
                <div className="manual-sculpt-tool-grid manual-texture-tool-grid manual-paint-layer-grid" role="tablist" aria-label="수동 페인트 레이어">
                  <button
                    type="button"
                    className={state.texturePaint.mode === 'surface' ? 'active' : ''}
                    onClick={() => onTexturePaintSetting('mode', 'surface')}
                    aria-selected={state.texturePaint.mode === 'surface'}
                    role="tab"
                  >
                    <Palette size={14} aria-hidden /><span>표면</span>
                  </button>
                  <button
                    type="button"
                    className={state.texturePaint.mode === 'props' ? 'active' : ''}
                    onClick={() => onTexturePaintSetting('mode', 'props')}
                    aria-selected={state.texturePaint.mode === 'props'}
                    role="tab"
                  >
                    <Sprout size={14} aria-hidden /><span>소품</span>
                  </button>
                </div>
              </section>
              <section className="manual-inspector-section">
                <h3>{state.texturePaint.mode === 'props' ? '프롭 도구' : '텍스처 도구'}</h3>
                <div className="manual-sculpt-tool-grid manual-texture-tool-grid" role="toolbar" aria-label={state.texturePaint.mode === 'props' ? '프롭 페인트 도구' : '텍스처 페인트 도구'}>
                  {TEXTURE_TOOLS.filter(({ id }) => state.texturePaint.mode === 'surface' || id !== 'blend').map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={state.texturePaint.tool === id ? 'active' : ''}
                      onClick={() => onTexturePaintSetting('tool', id)}
                      aria-pressed={state.texturePaint.tool === id}
                    >
                      <Icon size={14} aria-hidden />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="manual-sculpt-tool-description">
                  {state.texturePaint.tool === 'paint'
                    ? (state.texturePaint.mode === 'props'
                      ? '다른 페인트된 소품 유형을 제거하지 않고 선택한 소품 레이어를 추가합니다.'
                      : '선택한 머티리얼을 기존 지형 텍스처에 크로스페이드.')
                    : state.texturePaint.tool === 'blend'
                      ? '지형을 평평하게 만들지 않고 인접한 재질 가중치를 부드럽게 합니다.'
                      : '칠해진 머티리얼을 원래 수동 지형 표면으로 페이드합니다.'}
                </p>
              </section>
              {state.texturePaint.tool === 'paint' && state.texturePaint.mode === 'surface' ? (
                <section className="manual-inspector-section">
                  <h3>재질</h3>
                  <div className="manual-material-grid" role="listbox" aria-label="지형 머티리얼">
                    {MANUAL_SURFACE_MATERIALS.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        className={state.texturePaint.material === material.id ? 'active' : ''}
                        onClick={() => onTexturePaintSetting('material', material.id)}
                        aria-selected={state.texturePaint.material === material.id}
                        role="option"
                      >
                        <img src={manualSurfaceDiffuseUrl(material)} alt="" draggable="false" />
                        <span>{material.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : state.texturePaint.tool === 'paint' ? (
                <section className="manual-inspector-section">
                  <h3>소품 타입</h3>
                  <div className="manual-sculpt-tool-grid manual-texture-tool-grid manual-prop-type-grid" role="listbox" aria-label="지형 소품 유형">
                    {PROP_PAINT_TYPES.map(({ id, label, Icon, color }) => (
                      <button
                        key={id}
                        type="button"
                        className={state.texturePaint.propType === id ? 'active' : ''}
                        onClick={() => onTexturePaintSetting('propType', id)}
                        aria-selected={state.texturePaint.propType === id}
                        role="option"
                        style={{ '--manual-prop-color': color }}
                      >
                        <Icon size={14} aria-hidden />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>브러시</h3>
                <SliderCtl def={textureBrushSize} value={state.texturePaint.brushSize} onChange={(value) => onTexturePaintSetting('brushSize', value)} />
                <SliderCtl def={textureStrength} value={state.texturePaint.strength} onChange={(value) => onTexturePaintSetting('strength', value)} />
                <SliderCtl def={textureFalloff} value={state.texturePaint.falloff} onChange={(value) => onTexturePaintSetting('falloff', value)} />
              </section>
              <div className="manual-sculpt-help">
                <span>좌측 드래그: 도구 적용</span>
                <span>Alt + 왼쪽 드래그: 팬</span>
                <span>Shift + 휠: 브러시 크기</span>
                <span>우측 드래그: 궤도 회전</span>
              </div>
              <button
                type="button"
                className="manual-clear-sculpt"
                onClick={state.texturePaint.mode === 'props' ? onClearPropPaint : onClearTexturePaint}
                disabled={!state.texturePaint.hasData}
              >
                <Trash2 size={14} aria-hidden /> Clear {state.texturePaint.mode === 'props' ? 'prop' : 'texture'} layer
              </button>
            </div>
          ) : state?.sculpt?.enabled ? (
            <div className="manual-inspector-body">
              <p className="manual-inspector-description">절차적 셰이프 스택 위에 비파괴적인 지형 디테일을 페인트하세요.</p>
              <section className="manual-inspector-section">
                <h3>스컬프트 도구</h3>
                <div className="manual-sculpt-tool-grid" role="toolbar" aria-label="스컬프트 도구">
                  {SCULPT_TOOLS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={state.sculpt.tool === id ? 'active' : ''}
                      onClick={() => onSculptSetting('tool', id)}
                      aria-pressed={state.sculpt.tool === id}
                    >
                      <Icon size={14} aria-hidden />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="manual-sculpt-tool-description">{activeSculptTool.description}</p>
              </section>
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>브러시</h3>
                <SliderCtl def={brushSize} value={state.sculpt.brushSize} onChange={(value) => onSculptSetting('brushSize', value)} />
                <SliderCtl def={brushStrength} value={state.sculpt.strength} onChange={(value) => onSculptSetting('strength', value)} />
                <SliderCtl def={brushFalloff} value={state.sculpt.falloff} onChange={(value) => onSculptSetting('falloff', value)} />
              </section>
              {state.sculpt.tool === 'flatten' ? (
                <section className="manual-inspector-section manual-inspector-controls">
                  <h3>평탄화</h3>
                  <SliderCtl def={targetHeight} value={state.sculpt.targetHeight} onChange={(value) => onSculptSetting('targetHeight', value)} />
                </section>
              ) : null}
              {state.sculpt.tool === 'erode' ? (
                <section className="manual-inspector-section manual-inspector-controls">
                  <h3>수력 침식</h3>
                  <SliderCtl def={erosionIterations} value={state.sculpt.erosionIterations} onChange={(value) => onSculptSetting('erosionIterations', value)} />
                  <SliderCtl def={erosionDeposition} value={state.sculpt.erosionDeposition} onChange={(value) => onSculptSetting('erosionDeposition', value)} />
                  <SliderCtl def={erosionTalus} value={state.sculpt.erosionTalus} onChange={(value) => onSculptSetting('erosionTalus', value)} />
                </section>
              ) : null}
              {state.sculpt.tool === 'crease' || state.sculpt.tool === 'ridge' ? (
                <section className="manual-inspector-section manual-inspector-controls">
                  <h3>{state.sculpt.tool === 'crease' ? '주름 프로필' : '능선 프로필'}</h3>
                  <SliderCtl def={creaseWidth} value={state.sculpt.creaseWidth} onChange={(value) => onSculptSetting('creaseWidth', value)} />
                </section>
              ) : null}
              {state.sculpt.tool === 'detail' ? (
                <section className="manual-inspector-section manual-inspector-controls">
                  <h3>지형 디테일</h3>
                  <SliderCtl def={detailScale} value={state.sculpt.detailScale} onChange={(value) => onSculptSetting('detailScale', value)} />
                  <SliderCtl def={detailRoughness} value={state.sculpt.detailRoughness} onChange={(value) => onSculptSetting('detailRoughness', value)} />
                  <label className="manual-name-field">
                    <span>디테일 시드</span>
                    <span className="manual-seed-row">
                      <input
                        type="number"
                        min="0"
                        max="2147483647"
                        value={state.sculpt.detailSeed}
                        onChange={(event) => onSculptSetting('detailSeed', Number(event.target.value) || 0)}
                      />
                      <button type="button" onClick={() => onSculptSetting('detailSeed', Math.floor(Math.random() * 0x7fffffff))} title="디테일 시드 랜덤화" aria-label="디테일 시드 랜덤화">
                        <Dices size={14} aria-hidden />
                      </button>
                    </span>
                  </label>
                </section>
              ) : null}
              {state.sculpt.tool === 'terrace' ? (
                <section className="manual-inspector-section manual-inspector-controls">
                  <h3>테라스</h3>
                  <SliderCtl def={terraceStep} value={state.sculpt.terraceStep} onChange={(value) => onSculptSetting('terraceStep', value)} />
                </section>
              ) : null}
              <div className="manual-sculpt-help">
                <span>왼쪽 드래그: 조각</span>
                <span>Alt + 왼쪽 드래그: 팬</span>
                <span>Shift + 휠: 브러시 크기</span>
                <span>우측 드래그: 궤도 회전</span>
              </div>
              <button type="button" className="manual-clear-sculpt" onClick={onClearSculpt} disabled={!state.sculpt.hasData}>
                <Trash2 size={14} aria-hidden />스컬프트 레이어 지우기</button>
            </div>
          ) : selected ? (
            <div className="manual-inspector-body">
              <p className="manual-inspector-description">{getManualShapeDefinition(selected.type).description}</p>
              <section className="manual-inspector-section">
                <h3>형태</h3>
                <label className="manual-toggle-field">
                  <span>활성화됨</span>
                  <input type="checkbox" checked={selected.enabled !== false} onChange={(event) => onUpdate(selected.id, { enabled: event.target.checked })} />
                </label>
                <SliderCtl def={height} value={selected.height} onChange={(value) => onUpdate(selected.id, { height: value })} />
                <label className="manual-name-field">
                  <span>이름</span>
                  <input
                    value={selected.name}
                    maxLength={80}
                    onChange={(event) => onUpdate(selected.id, { name: event.target.value })}
                  />
                </label>
              </section>
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>레이어 블렌드</h3>
                <label className="manual-select-field">
                  <span>혼합 모드</span>
                  <select value={selected.blendMode} onChange={(event) => onUpdate(selected.id, { blendMode: event.target.value })}>
                    {MANUAL_BLEND_MODES.map((mode) => <option value={mode.id} key={mode.id}>{mode.name}</option>)}
                  </select>
                </label>
                <SliderCtl def={opacity} value={selected.opacity} onChange={(value) => onUpdate(selected.id, { opacity: value })} />
              </section>
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>변환</h3>
                <SliderCtl def={positionX} value={selected.position.x} onChange={(value) => onUpdate(selected.id, { position: { x: value } })} />
                <SliderCtl def={positionZ} value={selected.position.z} onChange={(value) => onUpdate(selected.id, { position: { z: value } })} />
                <SliderCtl def={rotation} value={selected.rotation * 180 / Math.PI} onChange={(value) => onUpdate(selected.id, { rotation: value * Math.PI / 180 })} />
                <SliderCtl def={scaleX} value={selected.scale.x} onChange={(value) => onUpdate(selected.id, { scale: { x: value } })} />
                <SliderCtl def={scaleZ} value={selected.scale.z} onChange={(value) => onUpdate(selected.id, { scale: { z: value } })} />
              </section>
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>지형 셰이프</h3>
                <SliderCtl def={detail} value={selected.detail} onChange={(value) => onUpdate(selected.id, { detail: value })} />
                <SliderCtl def={sharpness} value={selected.sharpness} onChange={(value) => onUpdate(selected.id, { sharpness: value })} />
                <SliderCtl def={terraces} value={selected.terraces} onChange={(value) => onUpdate(selected.id, { terraces: value })} />
                <label className="manual-name-field">
                  <span>시드</span>
                  <span className="manual-seed-row">
                    <input
                      type="number"
                      min="0"
                      max="2147483647"
                      value={selected.seed}
                      onChange={(event) => onUpdate(selected.id, { seed: Number(event.target.value) || 0 })}
                    />
                    <button type="button" onClick={() => onUpdate(selected.id, { seed: Math.floor(Math.random() * 0x7fffffff) })} title="시드 무작위화" aria-label="셰이프 시드 무작위화">
                      <Dices size={14} aria-hidden />
                    </button>
                  </span>
                </label>
              </section>
              <section className="manual-inspector-section manual-shape-layer-stack">
                <div className="manual-shape-layer-title">
                  <span>
                    <h3>셰이프 레이어</h3>
                    <small>{selected.layers.length} / {MAX_MANUAL_SHAPE_LAYERS}</small>
                  </span>
                  <label title="이 셰이프에 모디파이어 레이어 추가">
                    <Plus size={13} aria-hidden />
                    <select
                      value=""
                      disabled={selected.layers.length >= MAX_MANUAL_SHAPE_LAYERS}
                      aria-label="셰이프 모디파이어 레이어 추가"
                      onChange={(event) => {
                        const layer = onAddShapeLayer?.(selected.id, event.target.value);
                        if (layer?.id) setExpandedLayerId(layer.id);
                      }}
                    >
                      <option value="">레이어 추가</option>
                      {MANUAL_SHAPE_LAYER_CATALOG.map((definition) => (
                        <option key={definition.id} value={definition.id}>{definition.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} aria-hidden />
                  </label>
                </div>
                {selected.layers.length ? (
                  <div className="manual-shape-layer-list">
                    {selected.layers.map((layer, layerIndex) => {
                      const definition = getManualShapeLayerDefinition(layer.type);
                      const expanded = expandedLayerId === layer.id;
                      return (
                        <article className={`manual-shape-layer-card${expanded ? ' expanded' : ''}${layer.enabled === false ? ' disabled' : ''}`} key={layer.id}>
                          <div className="manual-shape-layer-row">
                            <button type="button" className="manual-shape-layer-main" onClick={() => setExpandedLayerId(expanded ? null : layer.id)} aria-expanded={expanded}>
                              <Layers3 size={13} aria-hidden />
                              <span><strong>{layer.name}</strong><small>{definition.name}</small></span>
                              {expanded ? <ChevronUp size={12} aria-hidden /> : <ChevronDown size={12} aria-hidden />}
                            </button>
                            <div className="manual-shape-layer-actions">
                              <button type="button" onClick={() => onUpdateShapeLayer?.(selected.id, layer.id, { enabled: layer.enabled === false })} title={layer.enabled === false ? '레이어 활성화' : '레이어 비활성화'} aria-label={layer.enabled === false ? `${layer.name} 활성화` : `${layer.name} 비활성화`}>
                                {layer.enabled === false ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              <button type="button" onClick={() => onDuplicateShapeLayer?.(selected.id, layer.id)} disabled={selected.layers.length >= MAX_MANUAL_SHAPE_LAYERS} title="레이어 복제" aria-label={`${layer.name} 복제`}><Copy size={12} /></button>
                              <button type="button" onClick={() => onReorderShapeLayer?.(selected.id, layer.id, -1)} disabled={layerIndex === 0} title="레이어 위로 이동" aria-label={`${layer.name} 레이어를 위로 이동`}><ChevronUp size={12} /></button>
                              <button type="button" onClick={() => onReorderShapeLayer?.(selected.id, layer.id, 1)} disabled={layerIndex === selected.layers.length - 1} title="레이어 아래로 이동" aria-label={`${layer.name} 레이어를 아래로 이동`}><ChevronDown size={12} /></button>
                              <button type="button" className="danger" onClick={() => onDeleteShapeLayer?.(selected.id, layer.id)} title="레이어 삭제" aria-label={`${layer.name} 삭제`}><Trash2 size={12} /></button>
                            </div>
                          </div>
                          {expanded ? (
                            <div className="manual-shape-layer-editor manual-inspector-controls">
                              <p>{definition.description}</p>
                              <label className="manual-name-field">
                                <span>레이어 이름</span>
                                <input value={layer.name} maxLength={80} onChange={(event) => onUpdateShapeLayer?.(selected.id, layer.id, { name: event.target.value })} />
                              </label>
                              <SliderCtl def={layerOpacity} value={layer.opacity} onChange={(value) => onUpdateShapeLayer?.(selected.id, layer.id, { opacity: value })} />
                              {definition.controls.map((control) => (
                                <SliderCtl
                                  key={control.id}
                                  def={control}
                                  value={layer.params[control.id]}
                                  onChange={(value) => onUpdateShapeLayer?.(selected.id, layer.id, { params: { [control.id]: value } })}
                                />
                              ))}
                              <label className="manual-name-field">
                                <span>시드 오프셋</span>
                                <span className="manual-seed-row">
                                  <input type="number" min="0" max="2147483647" value={layer.seedOffset} onChange={(event) => onUpdateShapeLayer?.(selected.id, layer.id, { seedOffset: Number(event.target.value) || 0 })} />
                                  <button type="button" onClick={() => onUpdateShapeLayer?.(selected.id, layer.id, { seedOffset: Math.floor(Math.random() * 0x7fffffff) })} title="레이어 시드 무작위화" aria-label={`${layer.name} 시드 무작위화`}><Dices size={14} aria-hidden /></button>
                                </span>
                              </label>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="manual-shape-layer-empty">
                    <Layers3 size={16} aria-hidden />
                    <span>이 도형에 부착된 절차적 디테일을 추가하세요.</span>
                  </div>
                )}
              </section>
              <section className="manual-inspector-section manual-inspector-controls">
                <h3>셰이프 마스크</h3>
                <label className="manual-select-field">
                  <span>마스크</span>
                  <select value={selected.mask.type} onChange={(event) => onUpdate(selected.id, { mask: { type: event.target.value } })}>
                    {MANUAL_MASK_TYPES.map((mask) => <option value={mask.id} key={mask.id}>{mask.name}</option>)}
                  </select>
                </label>
                {selected.mask.type !== 'none' ? (
                  <>
                    <SliderCtl def={maskFeather} value={selected.mask.feather} onChange={(value) => onUpdate(selected.id, { mask: { feather: value } })} />
                    <SliderCtl def={maskStrength} value={selected.mask.strength} onChange={(value) => onUpdate(selected.id, { mask: { strength: value } })} />
                    <label className="manual-toggle-field">
                      <span>마스크 반전</span>
                      <input type="checkbox" checked={selected.mask.invert} onChange={(event) => onUpdate(selected.id, { mask: { invert: event.target.checked } })} />
                    </label>
                  </>
                ) : null}
              </section>
            </div>
          ) : (
            <div className="manual-inspector-empty">
              <MousePointer2 size={22} aria-hidden />
              <strong>셰이프 선택 안 됨</strong>
              <span>뷰포트 또는 계층 구조에서 지형 모양을 선택해 설정을 편집하세요.</span>
            </div>
          )}
        </aside>
      ) : null}
    </section>
  );
}
