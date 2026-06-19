import { useState } from 'react';
import { filesApi } from '../api.js';
import type { Field } from '../types.js';

// 점검 시 항목 설명과 참조 미디어를 보여준다 (읽기 전용).
export default function GuideView({ field }: { field: Field }) {
  const hasDesc = !!field.description?.trim();
  const media = field.guideMedia ?? [];
  const [open, setOpen] = useState(false);

  if (!hasDesc && media.length === 0) return null;

  return (
    <div className="guide-view">
      {hasDesc && <p className="guide-view__desc">{field.description}</p>}
      {media.length > 0 && (
        <>
          <button type="button" className="guide-view__toggle" onClick={() => setOpen((o) => !o)}>
            📖 참조자료 {media.length}개 {open ? '접기' : '보기'}
          </button>
          {open && (
            <div className="media__previews">
              {media.map((m) => (
                <a
                  key={m.id}
                  href={filesApi.url(m.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="media__thumb"
                >
                  {m.type === 'photo' ? (
                    <img src={filesApi.url(m.id)} alt="참조" />
                  ) : (
                    <video src={filesApi.url(m.id)} controls />
                  )}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
