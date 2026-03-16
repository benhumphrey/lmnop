import { useState } from 'react';
import { validateToken, saveToken, clearToken, saveGistId } from './gist.js';

export default function AuthModal({ onAuth, onClose }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | checking | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setStatus('checking');
    setErrorMsg('');
    try {
      const login = await validateToken(input.trim());
      saveToken(input.trim());
      onAuth(login);
    } catch (_) {
      setStatus('error');
      setErrorMsg('Token not recognised — check it has Gist scope and try again.');
    }
  };

  const handleClear = () => {
    clearToken();
    saveGistId && localStorage.removeItem('lmnop_gist_id');
    onClose();
  };

  const s = styles;

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <span style={s.title}>Unlock editing</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={s.body}>
          <p style={s.intro}>
            Enter a GitHub Personal Access Token with <strong>Gist</strong> scope to enable
            recipe editing. Your token is stored only on this device and never leaves it.
          </p>

          <div style={s.steps}>
            <span style={s.stepsLabel}>To create a token:</span>
            <ol style={s.ol}>
              <li>Go to <strong>github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)</strong></li>
              <li>Click <strong>Generate new token</strong></li>
              <li>Check <strong>gist</strong> scope only</li>
              <li>Copy and paste below</li>
            </ol>
          </div>

          <span style={s.fieldLabel}>GitHub token</span>
          <input
            style={s.input}
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setStatus('idle'); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
          />
          {status === 'error' && <p style={s.error}>{errorMsg}</p>}
        </div>

        <div style={s.footer}>
          <button style={s.dangerBtn} onClick={handleClear}>Remove saved token</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.ghostBtn} onClick={onClose}>Cancel</button>
            <button
              style={{ ...s.primaryBtn, opacity: (!input.trim() || status === 'checking') ? 0.5 : 1 }}
              onClick={handleSubmit}
              disabled={!input.trim() || status === 'checking'}
            >
              {status === 'checking' ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(28,22,14,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 16,
  },
  modal: {
    background: '#F5F1E8', borderRadius: 10,
    border: '1px solid rgba(60,45,20,0.2)',
    width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    background: '#2C2518', padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20, color: '#F5F0E4', letterSpacing: 1,
  },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(245,240,228,0.45)', fontSize: 22,
    cursor: 'pointer', lineHeight: 1, padding: '0 4px',
  },
  body: { padding: '16px 16px 8px' },
  intro: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 14, color: '#4A4030', lineHeight: 1.6, marginBottom: 14,
  },
  steps: {
    background: '#EDE9DF', borderRadius: 6,
    padding: '10px 12px', marginBottom: 16,
  },
  stepsLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase',
    color: '#A89E8A', display: 'block', marginBottom: 6,
  },
  ol: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13, color: '#4A4030', lineHeight: 1.7,
    paddingLeft: 18, margin: 0,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8, letterSpacing: '2.5px', textTransform: 'uppercase',
    color: '#A89E8A', marginBottom: 6,
  },
  input: {
    width: '100%', height: 36,
    border: '1px solid rgba(60,45,20,0.22)', borderRadius: 5,
    background: '#FFFCF5',
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: '#1E1A12',
    padding: '0 10px', outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13, color: '#7A3020', marginTop: 8, lineHeight: 1.5,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px 14px',
    borderTop: '1px solid rgba(60,45,20,0.1)',
    gap: 8,
  },
  dangerBtn: {
    height: 34, padding: '0 14px',
    border: '1px solid rgba(120,30,20,0.3)', borderRadius: 5,
    background: 'transparent',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13, fontWeight: 600, color: '#7A3020', cursor: 'pointer',
  },
  ghostBtn: {
    height: 34, padding: '0 14px',
    border: '1px solid rgba(60,45,20,0.25)', borderRadius: 5,
    background: 'transparent',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13, fontWeight: 600, color: '#7A7060', cursor: 'pointer',
  },
  primaryBtn: {
    height: 34, padding: '0 18px', borderRadius: 5,
    background: '#2C2518', border: 'none',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13, fontWeight: 700, color: '#F5F0E4',
    cursor: 'pointer', letterSpacing: '0.5px',
  },
};
