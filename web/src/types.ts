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

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
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
