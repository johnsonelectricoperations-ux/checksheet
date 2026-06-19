import type { Inspection, InspectionInput, MediaFile, Template, TemplateInput } from './types.js';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const templatesApi = {
  list: (includeInactive = false) =>
    request<Template[]>(`/templates${includeInactive ? '?includeInactive=1' : ''}`),
  get: (id: string) => request<Template>(`/templates/${id}`),
  create: (input: TemplateInput) =>
    request<Template>('/templates', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: TemplateInput) =>
    request<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  duplicate: (id: string) =>
    request<Template>(`/templates/${id}/duplicate`, { method: 'POST' }),
  setActive: (id: string, active: boolean) =>
    request<Template>(`/templates/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
};

// 참조용 파일(템플릿 항목 설명에 붙는 사진/동영상)
export const filesApi = {
  upload: async (file: Blob, type: 'photo' | 'video', filename?: string) => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file, filename ?? 'upload');
    const res = await fetch(`${BASE}/files`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `파일 업로드 실패 (${res.status})`);
    }
    return res.json() as Promise<{ id: string; type: 'photo' | 'video'; url: string }>;
  },
  url: (id: string) => `${BASE}/files/${id}`,
};

export const inspectionsApi = {
  list: (templateId?: string) =>
    request<Inspection[]>(`/inspections${templateId ? `?templateId=${templateId}` : ''}`),
  get: (id: string) => request<Inspection>(`/inspections/${id}`),
  save: (input: InspectionInput) =>
    request<Inspection>('/inspections', { method: 'POST', body: JSON.stringify(input) }),
  // 미디어는 multipart 로 별도 업로드 (텍스트 결과와 분리)
  uploadMedia: async (
    inspectionId: string,
    params: { mediaId: string; fieldId: string; type: 'photo' | 'video'; file: Blob; filename?: string },
  ): Promise<MediaFile> => {
    const form = new FormData();
    form.append('mediaId', params.mediaId);
    form.append('fieldId', params.fieldId);
    form.append('type', params.type);
    form.append('file', params.file, params.filename ?? 'upload');
    const res = await fetch(`${BASE}/inspections/${inspectionId}/media`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `미디어 업로드 실패 (${res.status})`);
    }
    return res.json() as Promise<MediaFile>;
  },
};
