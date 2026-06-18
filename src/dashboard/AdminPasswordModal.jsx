import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Check } from 'lucide-react';
import { ADMIN_PASSWORD } from './dashboardPrefs';

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, dark }) {
  return (
    <div
      // ── FIX 1 ────────────────────────────────────────────────────────────
      // stopPropagation prevents the click from bubbling to the parent row's
      // onClick, which would double-toggle and net to no change — making the
      // right half of each row appear unresponsive.
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: checked ? '#7c3aed' : (dark ? '#334155' : '#e2e8f0'),
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <motion.div
        animate={{ left: checked ? 21 : 3 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        style={{
          position: 'absolute', top: 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}

// ── Admin Password Modal ──────────────────────────────────────────────────────

export default function AdminPasswordModal({ dark, c, onConfirm, onClose, activeFilters }) {
  const [step, setStep]               = useState('options'); // 'options' | 'password' | 'success'
  // ── FIX 2 ──────────────────────────────────────────────────────────────────
  // All options default to false so the user must consciously opt in to each
  // category before proceeding, rather than having hidden pre-selections.
  const [saveOptions, setSaveOptions] = useState({
    cardLayout:     false,
    globalFilters:  false,
    widgetSettings: false,
  });
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(false);
  const inputRef                = useRef(null);

  useEffect(() => {
    if (step === 'password') {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [step]);

  const attempt = () => {
    if (password === ADMIN_PASSWORD) {
      setError(false);
      setStep('success');
      setTimeout(() => { onConfirm(saveOptions); onClose(); }, 950);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter'  && step === 'password') attempt();
    if (e.key === 'Escape' && step !== 'success')  onClose();
  };

  const anySelected = Object.values(saveOptions).some(Boolean);

  const OPTION_DEFS = [
    {
      key:   'cardLayout',
      label: 'Card Layout',
      desc:  'Card positions, sizes, and which cards are visible on the dashboard',
    },
    {
      key:   'globalFilters',
      label: 'Default Global Filters',
      desc:  (activeFilters ?? []).length > 0
        ? `Saves ${activeFilters.length} currently active filter${activeFilters.length !== 1 ? 's' : ''} as the default starting state for all users`
        : 'No filters active — saves an empty filter state as the global default',
    },
    {
      key:   'widgetSettings',
      label: 'Widget Settings',
      desc:  'Pipeline stage visibility and Health Dimensions view preference',
    },
  ];

  const iconBox = {
    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
    background: dark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const closeBtn = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: c.sub, padding: 4, borderRadius: 7,
    display: 'flex', alignItems: 'center', flexShrink: 0,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => { if (step !== 'success') onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit   ={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: c.card, borderRadius: 18,
          border: `1px solid ${c.border}`,
          boxShadow: dark ? '0 28px 90px rgba(0,0,0,0.78)' : '0 28px 90px rgba(0,0,0,0.18)',
          width: 430, overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Step 1: Options ───────────────────────────────────────────── */}
          {step === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0   }}
              exit   ={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18 }}
              style={{ padding: '26px 26px 22px' }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={iconBox}><Shield size={21} color="#7c3aed" /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: c.text, lineHeight: 1.3 }}>
                      Save as Default
                    </div>
                    <div style={{ fontSize: 11, color: c.sub, marginTop: 3 }}>
                      Choose what to include in the global default
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose} style={closeBtn}
                  onMouseEnter={e => e.currentTarget.style.background = c.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {OPTION_DEFS.map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => setSaveOptions(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${saveOptions[opt.key] ? '#7c3aed' : c.border}`,
                      background: saveOptions[opt.key]
                        ? (dark ? 'rgba(139,92,246,0.08)' : 'rgba(237,233,254,0.5)')
                        : (dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                      transition: 'border-color 0.15s, background 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: c.sub, lineHeight: 1.45 }}>
                        {opt.desc}
                      </div>
                    </div>
                    <ToggleSwitch
                      dark={dark}
                      checked={saveOptions[opt.key]}
                      onChange={v => setSaveOptions(prev => ({ ...prev, [opt.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    border: `1px solid ${c.border}`, background: 'transparent',
                    color: c.sub, cursor: 'pointer', fontSize: 13,
                    fontWeight: 500, fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = c.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (anySelected) setStep('password'); }}
                  disabled={!anySelected}
                  style={{
                    flex: 2, padding: '9px 0', borderRadius: 9, border: 'none',
                    background: anySelected ? '#7c3aed' : (dark ? '#334155' : '#e2e8f0'),
                    color: anySelected ? '#fff' : c.sub,
                    cursor: anySelected ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (anySelected) e.currentTarget.style.background = '#6d28d9'; }}
                  onMouseLeave={e => { if (anySelected) e.currentTarget.style.background = '#7c3aed'; }}
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Password ──────────────────────────────────────────── */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0  }}
              exit   ={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.18 }}
              style={{ padding: '26px 26px 22px' }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={iconBox}><Shield size={21} color="#7c3aed" /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: c.text, lineHeight: 1.3 }}>
                      Admin Access
                    </div>
                    <div style={{ fontSize: 11, color: c.sub, marginTop: 3 }}>
                      Enter password to save global defaults
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose} style={closeBtn}
                  onMouseEnter={e => e.currentTarget.style.background = c.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{
                fontSize: 12, color: c.sub, lineHeight: 1.65,
                padding: '10px 13px', borderRadius: 9,
                background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                border: `1px solid ${c.border}`,
                marginBottom: 18,
              }}>
                Saving:{' '}
                <strong style={{ color: c.text }}>
                  {Object.entries(saveOptions)
                    .filter(([, v]) => v)
                    .map(([k]) => ({
                      cardLayout:     'Card Layout',
                      globalFilters:  'Global Filters',
                      widgetSettings: 'Widget Settings',
                    }[k]))
                    .join(', ')}
                </strong>
                {' '}as the default for all users.
              </div>

              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: c.sub, marginBottom: 6, letterSpacing: '0.02em',
              }}>
                Admin Password
              </label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); if (error) setError(false); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px', borderRadius: 9, fontSize: 13,
                  border: `1.5px solid ${error ? '#ef4444' : c.border}`,
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  color: c.text, outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = '#7c3aed'; }}
                onBlur={e  => { if (!error) e.target.style.borderColor = c.border;  }}
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0  }}
                    exit   ={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}
                  >
                    Incorrect password. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  onClick={() => { setStep('options'); setPassword(''); setError(false); }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    border: `1px solid ${c.border}`, background: 'transparent',
                    color: c.sub, cursor: 'pointer', fontSize: 13,
                    fontWeight: 500, fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = c.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  ← Back
                </button>
                <button
                  onClick={attempt}
                  style={{
                    flex: 2, padding: '9px 0', borderRadius: 9, border: 'none',
                    background: '#7c3aed', color: '#fff',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
                >
                  Confirm & Save Default
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success ───────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              exit   ={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              style={{
                padding: '44px 28px 40px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 16,
              }}
            >
              <motion.div
                initial={{ scale: 0.45 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                style={{
                  width: 66, height: 66, borderRadius: 18,
                  background: dark ? 'rgba(34,197,94,0.15)' : '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 10px rgba(34,197,94,0.08)',
                }}
              >
                <Check size={30} color="#22c55e" strokeWidth={2.5} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 7 }}>
                  Saved & Downloaded
                </div>
                <div style={{ fontSize: 12, color: c.sub, lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
                  All users will see these defaults on their next page load. Commit{' '}
                  <code style={{ fontFamily: 'monospace', fontSize: 11 }}>dashboardDefaults.json</code>
                  {' '}to{' '}
                  <code style={{ fontFamily: 'monospace', fontSize: 11 }}>src/config/</code>
                  {' '}to make it the permanent baseline.
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}