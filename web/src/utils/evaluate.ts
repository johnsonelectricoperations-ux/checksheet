// 점검 결과의 합격/불합격 자동 판정
// - 체크 항목: NG 면 불합격
// - 숫자 항목: 합격기준(min/max) 벗어나면 불합격
// - 그 외 항목: 판정 대상 아님

import type { Field } from '../types.js';

export type FieldResult = 'pass' | 'fail' | 'na';
export type InspectionStatus = '합격' | '불합격' | '판정없음';

export function evaluateField(field: Field, value: unknown): FieldResult {
  if (field.type === 'check') {
    if (value === 'NG') return 'fail';
    if (value === 'OK') return 'pass';
    return 'na';
  }
  if (field.type === 'number') {
    const c = field.criteria;
    if (!c || (c.min == null && c.max == null)) return 'na';
    if (value == null || value === '') return 'na';
    const n = Number(value);
    if (Number.isNaN(n)) return 'na';
    if (c.min != null && n < c.min) return 'fail';
    if (c.max != null && n > c.max) return 'fail';
    return 'pass';
  }
  return 'na';
}

export function evaluateInspection(
  fields: Field[],
  answers: Record<string, unknown>,
): { status: InspectionStatus; failedFieldIds: string[] } {
  const failedFieldIds: string[] = [];
  let hasEvaluable = false;
  for (const f of fields) {
    const r = evaluateField(f, answers[f.id]);
    if (r !== 'na') hasEvaluable = true;
    if (r === 'fail') failedFieldIds.push(f.id);
  }
  if (!hasEvaluable) return { status: '판정없음', failedFieldIds };
  return { status: failedFieldIds.length > 0 ? '불합격' : '합격', failedFieldIds };
}
