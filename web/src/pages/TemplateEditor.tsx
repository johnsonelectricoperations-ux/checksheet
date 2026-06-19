import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templatesApi } from '../api.js';
import RecipientsEditor from '../components/RecipientsEditor.js';
import { FIELD_TYPE_LABELS, type Field, type FieldType } from '../types.js';

function newField(order: number): Field {
  return {
    id: crypto.randomUUID(),
    type: 'check',
    label: '',
    required: false,
    order,
  };
}

export default function TemplateEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    templatesApi
      .get(id!)
      .then((t) => {
        setTitle(t.title);
        setDescription(t.description);
        setFields(t.fields);
        setRecipients(t.recipients);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function updateField(fieldId: string, patch: Partial<Field>) {
    setFields((fs) => fs.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
  }

  function addField() {
    setFields((fs) => [...fs, newField(fs.length)]);
  }

  function removeField(fieldId: string) {
    setFields((fs) => fs.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i })));
  }

  function move(fieldId: string, dir: -1 | 1) {
    setFields((fs) => {
      const idx = fs.findIndex((f) => f.id === fieldId);
      const target = idx + dir;
      if (target < 0 || target >= fs.length) return fs;
      const copy = [...fs];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy.map((f, i) => ({ ...f, order: i }));
    });
  }

  async function save() {
    if (title.trim() === '') {
      setError('제목을 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { title, description, fields, recipients };
      const saved = isNew
        ? await templatesApi.create(payload)
        : await templatesApi.update(id!, payload);
      navigate(`/templates/${saved.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="page__bar">
        <h2>{isNew ? '점검시트 신규 생성' : '점검시트 편집'}</h2>
        <div>
          <button className="btn" onClick={() => navigate('/')}>
            취소
          </button>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <label className="field">
        <span>제목 *</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 일일 설비 점검" />
      </label>

      <label className="field">
        <span>설명</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </label>

      <h3 className="section">점검 항목</h3>
      {fields.length === 0 && <p className="placeholder">항목을 추가하세요.</p>}

      <ol className="builder">
        {fields.map((f, i) => (
          <li key={f.id} className="builder__item">
            <div className="builder__row">
              <span className="builder__num">{i + 1}</span>
              <input
                className="builder__label"
                placeholder="항목 이름 (예: 전원 정상 여부)"
                value={f.label}
                onChange={(e) => updateField(f.id, { label: e.target.value })}
              />
              <select
                value={f.type}
                onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
              >
                {Object.entries(FIELD_TYPE_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="builder__row builder__opts">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => updateField(f.id, { required: e.target.checked })}
                />
                필수
              </label>

              {f.type === 'select' && (
                <input
                  className="builder__sub"
                  placeholder="선택지 (쉼표로 구분: 양호,불량,해당없음)"
                  value={(f.options ?? []).join(',')}
                  onChange={(e) =>
                    updateField(f.id, {
                      options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              )}

              {f.type === 'number' && (
                <>
                  <input
                    className="builder__num-in"
                    type="number"
                    placeholder="최소"
                    value={f.criteria?.min ?? ''}
                    onChange={(e) =>
                      updateField(f.id, {
                        criteria: { ...f.criteria, min: e.target.value === '' ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="builder__num-in"
                    type="number"
                    placeholder="최대"
                    value={f.criteria?.max ?? ''}
                    onChange={(e) =>
                      updateField(f.id, {
                        criteria: { ...f.criteria, max: e.target.value === '' ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="builder__num-in"
                    placeholder="단위"
                    value={f.criteria?.unit ?? ''}
                    onChange={(e) =>
                      updateField(f.id, { criteria: { ...f.criteria, unit: e.target.value } })
                    }
                  />
                </>
              )}

              {(f.type === 'photo' || f.type === 'video') && (
                <>
                  <input
                    className="builder__num-in"
                    type="number"
                    placeholder="최소 개수"
                    value={f.media?.minCount ?? ''}
                    onChange={(e) =>
                      updateField(f.id, {
                        media: { ...f.media, minCount: e.target.value === '' ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="builder__num-in"
                    type="number"
                    placeholder="최대 개수"
                    value={f.media?.maxCount ?? ''}
                    onChange={(e) =>
                      updateField(f.id, {
                        media: { ...f.media, maxCount: e.target.value === '' ? undefined : Number(e.target.value) },
                      })
                    }
                  />
                  {f.type === 'video' && (
                    <input
                      className="builder__num-in"
                      type="number"
                      placeholder="최대 길이(초)"
                      value={f.media?.maxDurationSec ?? ''}
                      onChange={(e) =>
                        updateField(f.id, {
                          media: {
                            ...f.media,
                            maxDurationSec: e.target.value === '' ? undefined : Number(e.target.value),
                          },
                        })
                      }
                    />
                  )}
                </>
              )}
            </div>

            <div className="builder__row builder__move">
              <button className="btn btn--sm" onClick={() => move(f.id, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                className="btn btn--sm"
                onClick={() => move(f.id, 1)}
                disabled={i === fields.length - 1}
              >
                ↓
              </button>
              <button className="btn btn--sm btn--danger" onClick={() => removeField(f.id)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ol>

      <button className="btn" onClick={addField}>
        + 항목 추가
      </button>

      <h3 className="section">수신자 (메일 발송은 후속 단계)</h3>
      <p className="hint">점검 완료 결과를 받을 이메일을 등록합니다. (발송 기능은 6단계에서 연동)</p>
      <RecipientsEditor recipients={recipients} onChange={setRecipients} />
    </div>
  );
}
