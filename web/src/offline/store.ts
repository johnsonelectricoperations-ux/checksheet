// 오프라인 저장소 접근 (템플릿 캐시 + 동기화 대기열)
import { getDB, type PendingInspection, type PendingMedia } from './db.js';
import type { Template } from '../types.js';

// ── 템플릿 캐시 (오프라인에서도 불러오기) ──
export async function cacheTemplates(templates: Template[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('templates', 'readwrite');
  await tx.store.clear();
  for (const t of templates) await tx.store.put(t);
  await tx.done;
}

export async function cacheTemplate(template: Template): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function getCachedTemplates(): Promise<Template[]> {
  const db = await getDB();
  return db.getAll('templates');
}

export async function getCachedTemplate(id: string): Promise<Template | undefined> {
  const db = await getDB();
  return db.get('templates', id);
}

// ── 동기화 대기열 ──
export async function enqueueInspection(item: PendingInspection): Promise<void> {
  const db = await getDB();
  await db.put('pendingInspections', item);
}

export async function getPending(): Promise<PendingInspection[]> {
  const db = await getDB();
  return db.getAll('pendingInspections');
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count('pendingInspections');
}

export async function updatePending(item: PendingInspection): Promise<void> {
  const db = await getDB();
  await db.put('pendingInspections', item);
}

export async function removePending(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingInspections', id);
}

export type { PendingInspection, PendingMedia };
