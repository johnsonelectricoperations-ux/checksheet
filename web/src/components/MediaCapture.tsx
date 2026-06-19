import { useRef, useState } from 'react';
import { compressImage } from '../utils/compressImage.js';
import { getVideoDuration } from '../utils/videoDuration.js';
import type { Field } from '../types.js';

// 촬영/선택된 미디어 1건 (업로드 전 로컬 상태)
export interface LocalMedia {
  id: string;
  file: File;
  url: string; // 미리보기용 ObjectURL
  type: 'photo' | 'video';
}

interface Props {
  field: Field;
  items: LocalMedia[];
  onChange: (items: LocalMedia[]) => void;
}

// 항목별 사진/동영상 촬영 컴포넌트.
// 안드로이드 태블릿에서 capture 속성으로 카메라를 바로 연다.
export default function MediaCapture({ field, items, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const isVideo = field.type === 'video';
  const maxCount = field.media?.maxCount;
  const maxDuration = field.media?.maxDurationSec;

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 재촬영 허용
    setError('');

    const added: LocalMedia[] = [];
    for (const raw of files) {
      if (isVideo) {
        // 동영상 길이 제한 검증
        if (maxDuration) {
          const dur = await getVideoDuration(raw);
          if (dur != null && dur > maxDuration) {
            setError(`동영상이 너무 깁니다. 최대 ${maxDuration}초 (현재 ${Math.round(dur)}초)`);
            continue;
          }
        }
        added.push({ id: crypto.randomUUID(), file: raw, url: URL.createObjectURL(raw), type: 'video' });
      } else {
        const file = await compressImage(raw); // 사진은 업로드 전 압축
        added.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), type: 'photo' });
      }
    }

    let next = [...items, ...added];
    if (maxCount && next.length > maxCount) next = next.slice(0, maxCount);
    onChange(next);
  }

  function remove(id: string) {
    const target = items.find((m) => m.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(items.filter((m) => m.id !== id));
  }

  const reachedMax = maxCount != null && items.length >= maxCount;

  return (
    <div className="media">
      <div className="media__previews">
        {items.map((m) => (
          <div key={m.id} className="media__thumb">
            {m.type === 'photo' ? (
              <img src={m.url} alt="" />
            ) : (
              <video src={m.url} controls />
            )}
            <button className="media__remove" onClick={() => remove(m.id)} type="button">
              ✕
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={isVideo ? 'video/*' : 'image/*'}
        capture="environment"
        multiple={!isVideo}
        style={{ display: 'none' }}
        onChange={onSelect}
      />
      <button
        type="button"
        className="btn"
        onClick={() => inputRef.current?.click()}
        disabled={reachedMax}
      >
        {isVideo ? '🎥 동영상 촬영' : '📷 사진 촬영'}
        {maxCount ? ` (${items.length}/${maxCount})` : ''}
      </button>
      {isVideo && maxDuration && <span className="hint"> 최대 {maxDuration}초</span>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
