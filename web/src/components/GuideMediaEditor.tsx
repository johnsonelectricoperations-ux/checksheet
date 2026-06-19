import { useRef, useState } from 'react';
import { filesApi } from '../api.js';
import { compressImage } from '../utils/compressImage.js';
import type { GuideMedia } from '../types.js';

interface Props {
  items: GuideMedia[];
  onChange: (items: GuideMedia[]) => void;
}

// 템플릿 작성 시 항목 설명에 붙이는 참조용 사진/동영상 편집기.
// 선택 즉시 서버에 업로드하여 파일 id 를 확보한다 (점검 시 작업자가 열람).
export default function GuideMediaEditor({ items, onChange }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function add(files: FileList | null, type: 'photo' | 'video') {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const uploaded: GuideMedia[] = [];
      for (const raw of list) {
        const f = type === 'photo' ? await compressImage(raw) : raw;
        const r = await filesApi.upload(f, type, f.name);
        uploaded.push({ id: r.id, type: r.type });
      }
      onChange([...items, ...uploaded]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    onChange(items.filter((m) => m.id !== id));
  }

  return (
    <div className="guide">
      <div className="media__previews">
        {items.map((m) => (
          <div key={m.id} className="media__thumb">
            {m.type === 'photo' ? (
              <img src={filesApi.url(m.id)} alt="" />
            ) : (
              <video src={filesApi.url(m.id)} controls />
            )}
            <button type="button" className="media__remove" onClick={() => remove(m.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
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
        style={{ display: 'none' }}
        onChange={(e) => {
          add(e.target.files, 'video');
          e.target.value = '';
        }}
      />

      <div className="attach__buttons">
        <button type="button" className="btn btn--sm" onClick={() => photoRef.current?.click()} disabled={uploading}>
          📷 참조 사진
        </button>
        <button type="button" className="btn btn--sm" onClick={() => videoRef.current?.click()} disabled={uploading}>
          🎥 참조 동영상
        </button>
        {uploading && <span className="hint">업로드 중…</span>}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
