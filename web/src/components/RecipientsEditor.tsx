import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

// 점검시트별 수신자(이메일) 관리. 칩 형태로 추가/삭제, 형식 검증.
// 메일 발송 자체는 후속 단계(6단계)에서 사내 SMTP 릴레이로 구현.
export default function RecipientsEditor({ recipients, onChange }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function addFrom(text: string) {
    // 쉼표/공백/줄바꿈으로 여러 개 한 번에 입력 가능
    const candidates = text
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;

    const invalid = candidates.filter((c) => !EMAIL_RE.test(c));
    if (invalid.length > 0) {
      setError(`이메일 형식 오류: ${invalid.join(', ')}`);
      return;
    }
    const merged = Array.from(new Set([...recipients, ...candidates]));
    onChange(merged);
    setInput('');
    setError('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFrom(input);
    }
  }

  function remove(email: string) {
    onChange(recipients.filter((r) => r !== email));
  }

  return (
    <div className="recipients">
      <div className="chips">
        {recipients.map((r) => (
          <span key={r} className="chip">
            {r}
            <button type="button" className="chip__x" onClick={() => remove(r)}>
              ✕
            </button>
          </span>
        ))}
        {recipients.length === 0 && <span className="placeholder">등록된 수신자가 없습니다.</span>}
      </div>
      <div className="recipients__input">
        <input
          type="email"
          value={input}
          placeholder="이메일 입력 후 Enter (여러 개는 쉼표로)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input.trim() && addFrom(input)}
        />
        <button type="button" className="btn" onClick={() => addFrom(input)}>
          추가
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
