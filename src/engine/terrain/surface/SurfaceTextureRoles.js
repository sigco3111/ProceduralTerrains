export const SURFACE_TEXTURE_VARIANT_COUNT = 4;

export const SURFACE_TEXTURE_ROLE_GROUPS = [
  {
    id: 'beach',
    label: '해변',
    roles: [
      { id: 'sand', label: '모래', tiling: 18 },
      { id: 'dune', label: '사구', tiling: 20 },
    ],
  },
  {
    id: 'vegetation',
    label: '식생',
    roles: [
      { id: 'dryGrass', label: '마른 풀', tiling: 14 },
      { id: 'grass', label: '잔디', tiling: 12 },
      { id: 'forest', label: '숲', tiling: 11 },
      { id: 'jungle', label: '정글', tiling: 10 },
      { id: 'swamp', label: '늪지', tiling: 9 },
      { id: 'tundra', label: '툰드라', tiling: 13 },
    ],
  },
  {
    id: 'rock',
    label: '바위',
    roles: [
      { id: 'redRock', label: '붉은 바위', tiling: 7 },
      { id: 'redRock2', label: '붉은 바위 B', tiling: 7 },
      { id: 'rock', label: '바위', tiling: 6 },
      { id: 'rockHi', label: '높은 바위', tiling: 6 },
    ],
  },
  {
    id: 'snow',
    label: '눈',
    roles: [
      { id: 'snow', label: '눈', tiling: 10 },
    ],
  },
];

export const SURFACE_TEXTURE_ROLES = SURFACE_TEXTURE_ROLE_GROUPS.flatMap((group) =>
  group.roles.map((role) => ({ ...role, groupId: group.id, groupLabel: group.label }))
);

export const SURFACE_TEXTURE_LAYERS = SURFACE_TEXTURE_ROLES.map((role) => role.id);
export const SURFACE_TEXTURE_ROLE_COUNT = SURFACE_TEXTURE_ROLES.length;
export const SURFACE_TEXTURE_ROWS = SURFACE_TEXTURE_ROLE_COUNT * SURFACE_TEXTURE_VARIANT_COUNT;

export function surfaceVariantKey(variantIndex = 0) {
  const index = Math.max(0, Math.min(SURFACE_TEXTURE_VARIANT_COUNT - 1, Number(variantIndex) || 0));
  return `custom:v${index}`;
}

export function surfaceAtlasRow(roleIndex, variantIndex) {
  return roleIndex * SURFACE_TEXTURE_VARIANT_COUNT + variantIndex;
}
