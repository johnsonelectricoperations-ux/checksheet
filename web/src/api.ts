import type { Template, TemplateInput } from './types.js';

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
