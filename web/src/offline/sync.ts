// 동기화 엔진: 대기열의 점검 결과를 서버로 순차 전송 (WiFi 복귀 시 자동)
import { inspectionsApi } from '../api.js';
import { getPending, getPendingCount, removePending, updatePending } from './store.js';

export interface SyncState {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastError?: string;
}

type Listener = (state: SyncState) => void;

const listeners = new Set<Listener>();
let state: SyncState = {
  online: navigator.onLine,
  pending: 0,
  syncing: false,
};

function emit() {
  for (const l of listeners) l(state);
}

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export async function refreshPendingCount(): Promise<void> {
  setState({ pending: await getPendingCount() });
}

// 대기열을 한 번 처리. 네트워크 실패 시 항목을 남겨두고 다음 기회에 재시도.
let running = false;
export async function syncPending(): Promise<void> {
  if (running || !navigator.onLine) return;
  running = true;
  setState({ syncing: true, lastError: undefined });

  try {
    const items = await getPending();
    for (const item of items) {
      try {
        // 1) 본문(텍스트 결과) 저장 — idempotent 이므로 재시도 안전
        if (!item.inspectionSaved) {
          await inspectionsApi.save(item.payload);
          item.inspectionSaved = true;
          await updatePending(item);
        }
        // 2) 미디어는 파일 단위로 분리 업로드, 실패한 파일만 다음에 재시도
        for (const m of item.media) {
          if (m.uploaded) continue;
          await inspectionsApi.uploadMedia(item.id, {
            mediaId: m.id,
            fieldId: m.fieldId,
            type: m.type,
            file: m.blob,
            filename: m.filename,
          });
          m.uploaded = true;
          await updatePending(item);
        }
        // 3) 전부 완료 → 대기열에서 제거
        await removePending(item.id);
      } catch (e) {
        // 네트워크 등 오류: 이 항목은 다음 기회에 재시도
        item.status = 'error';
        item.error = (e as Error).message;
        await updatePending(item);
        setState({ lastError: (e as Error).message });
      }
    }
  } finally {
    running = false;
    setState({ syncing: false, pending: await getPendingCount() });
  }
}

// 자동 동기화 시작: 온라인 복귀 이벤트 + 주기적 폴링
export function startAutoSync(intervalMs = 30_000): void {
  const onOnline = () => {
    setState({ online: true });
    void syncPending();
  };
  const onOffline = () => setState({ online: false });

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  void refreshPendingCount();
  void syncPending();
  setInterval(() => void syncPending(), intervalMs);
}
