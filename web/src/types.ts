// 점검시트 도메인 타입 (서버와 동일 구조)

export type FieldType =
  | 'check'
  | 'number'
  | 'text'
  | 'date'
  | 'select'
  | 'photo'
  | 'video';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  check: '체크 (OK/NG)',
  number: '숫자 입력',
  text: '텍스트',
  date: '날짜',
  select: '선택목록',
  photo: '사진 촬영',
  video: '동영상 촬영',
};

export interface NumberCriteria {
  min?: number;
  max?: number;
  unit?: string;
}

export interface MediaOptions {
  minCount?: number;
  maxCount?: number;
  maxDurationSec?: number;
}

export interface GuideMedia {
  id: string;
  type: 'photo' | 'video';
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
  description?: string; // 항목 설명 (점검 시 참고)
  guideMedia?: GuideMedia[]; // 참조용 사진/동영상
  options?: string[];
  criteria?: NumberCriteria;
  media?: MediaOptions;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  version: number;
  fields: Field[];
  recipients: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInput {
  title: string;
  description?: string;
  fields?: Field[];
  recipients?: string[];
}

export interface MediaFile {
  id: string;
  inspectionId: string;
  fieldId: string;
  type: 'photo' | 'video';
  mime: string;
  size: number;
  filename: string;
  capturedAt?: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  templateId: string;
  templateVersion: number;
  inspector: string;
  answers: Record<string, unknown>;
  createdAt: string;
  receivedAt: string;
  syncStatus: string;
  media?: MediaFile[];
}

export interface InspectionInput {
  id: string;
  templateId: string;
  templateVersion: number;
  inspector?: string;
  answers?: Record<string, unknown>;
  createdAt?: string;
}
