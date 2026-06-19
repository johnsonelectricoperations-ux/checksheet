import { useRef } from 'react';
import { compressImage } from '../utils/compressImage.js';
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
  const isVideo = field.type === 'video';
  const maxCount = field.media?.maxCount;

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 재촬영 허용
    // 사진은 업로드 전 압축 (동영상은 그대로)
    const added: LocalMedia[] = await Promise.all(
      files.map(async (raw) => {
        const file = isVideo ? raw : await compressImage(raw);
        return {
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          type: isVideo ? ('video' as const) : ('photo' as const),
        };
      }),
    );
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
    </div>
  );
}
