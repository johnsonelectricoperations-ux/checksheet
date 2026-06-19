import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { InspectionInput, Template } from '../types.js';

// 오프라인 저장에 쓰이는 미디어 1건 (Blob 포함)
export interface PendingMedia {
  id: string;
  fieldId: string;
  type: 'photo' | 'video';
  blob: Blob;
  filename: string;
  uploaded: boolean; // 서버 업로드 완료 여부 (부분 동기화 추적)
}

// 동기화 대기 중인 점검 결과
export interface PendingInspection {
  id: string; // inspection id (= 동기화 키)
  payload: InspectionInput;
  media: PendingMedia[];
  status: 'pending' | 'syncing' | 'error';
  error?: string;
  savedAt: string;
  inspectionSaved: boolean; // 본문(텍스트) 서버 저장 완료 여부
}

interface ChecksheetDB extends DBSchema {
  templates: {
    key: string;
    value: Template;
  };
  pendingInspections: {
    key: string;
    value: PendingInspection;
  };
}

let dbPromise: Promise<IDBPDatabase<ChecksheetDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ChecksheetDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChecksheetDB>('checksheet', 1, {
      upgrade(db) {
        db.createObjectStore('templates', { keyPath: 'id' });
        db.createObjectStore('pendingInspections', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}
