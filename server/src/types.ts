// 점검시트 도메인 타입 정의

// 점검 항목 유형
export type FieldType =
  | 'check' // OK/NG 체크
  | 'number' // 숫자 입력 (합격기준 범위 가능)
  | 'text' // 자유 텍스트
  | 'date' // 날짜
  | 'select' // 선택목록
  | 'photo' // 사진 촬영
  | 'video'; // 동영상 촬영

// 숫자 항목의 합격기준 (범위)
export interface NumberCriteria {
  min?: number;
  max?: number;
  unit?: string;
}

// 미디어 항목 옵션 (사진/동영상)
export interface MediaOptions {
  minCount?: number; // 최소 첨부 개수
  maxCount?: number; // 최대 첨부 개수
  maxDurationSec?: number; // 동영상 최대 길이(초)
}

// 점검 항목 정의
export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
  options?: string[]; // select 용 선택지
  criteria?: NumberCriteria; // number 용 합격기준
  media?: MediaOptions; // photo/video 용 옵션
}

// 점검시트 템플릿
export interface Template {
  id: string;
  title: string;
  description: string;
  version: number;
  fields: Field[];
  recipients: string[]; // 수신자 이메일 (발송은 후속 단계)
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
