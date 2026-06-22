import { useRef, useState } from 'react';
import { compressImage } from '../utils/compressImage.js';
import { uuid } from '../utils/uuid.js';
import type { LocalMedia } from './MediaCapture.js';

interface Props {
  items: LocalMedia[];
  onChange: (items: LocalMedia[]) => void;
}

// 어떤 점검 항목에든 필요할 때만 사진/동영상을 첨부하는 선택 컴포넌트.
// (예: 체크 항목이 NG 일 때 증빙 사진 첨부)
export default function OptionalAttachments({ items, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null, type: 'photo' | 'video') {
    const added: LocalMedia[] = await Promise.all(
      Array.from(files ?? []).map(async (raw) => {
        const file = type === 'photo' ? await compressImage(raw) : raw;
        return { id: uuid(), file, url: URL.createObjectURL(file), type };
      }),
    );
    onChange([...items, ...added]);
  }

  function remove(id: string) {
    const target = items.find((m) => m.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(items.filter((m) => m.id !== id));
  }

  // 첨부가 없고 닫혀있으면 간단한 토글 버튼만 노출
  if (!open && items.length === 0) {
    return (
      <button type="button" className="attach-toggle" onClick={() => setOpen(true)}>
        📎 사진/동영상 첨부
      </button>
    );
  }

  return (
    <div className="attach">
      <div className="media__previews">
        {items.map((m) => (
          <div key={m.id} className="media__thumb">
            {m.type === 'photo' ? <img src={m.url} alt="" /> : <video src={m.url} controls />}
            <button className="media__remove" type="button" onClick={() => remove(m.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          add(e.target.files, 'photo');
          e.target.value = '';
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          add(e.target.files, 'video');
          e.target.value = '';
        }}
      />

      <div className="attach__buttons">
        <button type="button" className="btn btn--sm" onClick={() => photoRef.current?.click()}>
          📷 사진
        </button>
        <button type="button" className="btn btn--sm" onClick={() => videoRef.current?.click()}>
          🎥 동영상
        </button>
      </div>
    </div>
  );
}
