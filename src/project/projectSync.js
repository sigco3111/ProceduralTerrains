const revisionOf = (project) => Number(project?.contentRevision ?? 1);

export function getProjectSyncState({ localProject = null, cloudProject = null, binding = null } = {}) {
  if (!localProject && cloudProject) return 'cloud-only';
  if (!localProject) return 'unknown';
  if (!cloudProject) return binding ? 'cloud-missing' : 'local-only';
  if (!binding) return 'needs-review';

  const localChanged = localProject.metadata.modified !== binding.lastSyncedLocalModified;
  const cloudChanged = revisionOf(cloudProject) !== binding.cloudContentRevision;
  if (localChanged && cloudChanged) return 'conflict';
  if (localChanged) return 'local-changes';
  if (cloudChanged) return 'cloud-changes';
  return 'synced';
}

export const syncPresentation = {
  'local-only': { label: '이 기기에서', action: '클라우드에 동기화' },
  'cloud-missing': { label: '구름 복사본이 제거됨', action: '클라우드에 동기화' },
  'cloud-only': { label: '클라우드에서만', action: '다운로드' },
  'needs-review': { label: '동기화 검토 필요', action: '동기화 검토' },
  synced: { label: '동기화됨', action: '동기화' },
  'local-changes': { label: '이 디바이스의 변경사항', action: '변경 사항 업로드' },
  'cloud-changes': { label: '구름의 변화', action: '변경 사항 다운로드' },
  conflict: { label: '충돌: 버전 선택', action: '충돌 해결' },
  unknown: { label: '동기화 상태 사용 불가', action: '동기화' },
};

function latestActivity(item) {
  const value = item.localProject?.metadata?.modified ?? item.cloudProject?.updatedAt;
  const timestamp = Date.parse(value ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function buildUnifiedProjectIndex({ localProjects = [], cloudProjects = [], bindings = [] } = {}) {
  const bindingByLocalId = new Map(bindings.map((binding) => [binding.localProjectId, binding]));
  const cloudById = new Map(cloudProjects.map((project) => [project.id, project]));
  const claimedCloudIds = new Set();

  const entries = localProjects.map((localProject) => {
    const binding = bindingByLocalId.get(localProject.id) ?? null;
    let cloudProject = binding ? cloudById.get(binding.cloudProjectId) ?? null : null;
    let legacyLink = false;

    if (!cloudProject && !binding) {
      cloudProject = cloudProjects.find((project) => project.sourceProjectId === localProject.id && !claimedCloudIds.has(project.id)) ?? null;
      legacyLink = Boolean(cloudProject);
    }
    if (cloudProject) claimedCloudIds.add(cloudProject.id);

    const state = getProjectSyncState({ localProject, cloudProject, binding });
    return {
      id: `local:${localProject.id}`,
      localProject,
      cloudProject,
      binding,
      legacyLink,
      state,
      ...syncPresentation[state],
    };
  });

  cloudProjects.forEach((cloudProject) => {
    if (claimedCloudIds.has(cloudProject.id)) return;
    const state = getProjectSyncState({ cloudProject });
    entries.push({
      id: `cloud:${cloudProject.id}`,
      localProject: null,
      cloudProject,
      binding: null,
      legacyLink: false,
      state,
      ...syncPresentation[state],
    });
  });

  return entries.sort((left, right) => latestActivity(right) - latestActivity(left));
}

export function syncBindingFor(localProject, cloudProject) {
  return {
    localProjectId: localProject.id,
    cloudProjectId: cloudProject.id,
    lastSyncedLocalModified: localProject.metadata.modified,
    cloudContentRevision: revisionOf(cloudProject),
  };
}
