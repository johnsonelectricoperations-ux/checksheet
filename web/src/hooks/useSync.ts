import { useEffect, useState } from 'react';
import { subscribe, syncPending, type SyncState } from '../offline/sync.js';

// 동기화 상태(온라인/대기건수/진행중)를 구독하는 훅
export function useSync(): SyncState & { syncNow: () => void } {
  const [state, setState] = useState<SyncState>({
    online: navigator.onLine,
    pending: 0,
    syncing: false,
  });

  useEffect(() => subscribe(setState), []);

  return { ...state, syncNow: () => void syncPending() };
}
