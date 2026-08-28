import { ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { NAV_GROUPS } from './dashboardConstants';

/**
 * Renders the position:absolute inner content of the sidebar.
 * The outer flow-width div lives in Dashboard.jsx so the main
 * content area reacts to pinned/unpinned width changes.
 */
export default function DashboardSidebar({
  dark,
  c,
  pinned,
  showFull,
  isOverlay,
  overlayShadow,
  active,
  setActive,
  onEnter,
  onLeave,
  onToggle,
  setPinned,
}) {
  const iconBtn = {
    padding: 8, borderRadius: 8, border: 'none', background: 'transparent',
    color: c.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: showFull ? 220 : 58,
        background: c.sidebar, borderRight: `1px solid ${c.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease',
        boxShadow: isOverlay ? overlayShadow : 'none',
      }}
    >
      {/* ── Logo row ───────────────────────────────────────────── */}
      <div style={{
        height: 64, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 12px', borderBottom: `1px solid ${c.border}`,
        justifyContent: showFull ? 'space-between' : 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <img
            src={
              document.querySelector('meta[name="dashboard-logo"]')?.getAttribute('content')
              ?? '/Olin_square.png'
            }
            alt="Logo"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
          />
          {showFull && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: c.text, whiteSpace: 'nowrap' }}>
                Portfolio HQ
              </div>
              <div style={{ fontSize: 11, color: c.sub, whiteSpace: 'nowrap' }}>
                Olin Corporation
              </div>
            </div>
          )}
        </div>

        {showFull && (
          <motion.button whileTap={{ scale: 0.92 }} onClick={onToggle}
            style={{ ...iconBtn, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = c.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {pinned ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </motion.button>
        )}
      </div>

      {/* ── Collapsed expand button ────────────────────────────── */}
      {!showFull && (
        <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setPinned(true)}
            style={iconBtn}
            onMouseEnter={e => e.currentTarget.style.background = c.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>
      )}

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: showFull ? '12px 10px' : '8px 6px', overflowY: 'auto' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            {showFull && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: c.sub,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '0 8px', marginBottom: 6,
              }}>
                {group.label}
              </div>
            )}
            {!showFull && gi > 0 && (
              <div style={{ height: 1, background: c.border, margin: '8px 4px 12px' }} />
            )}
            {group.items.map(({ id, label, icon: Icon }) => {
              const isA = active === id;
              return (
                <motion.button key={id} onClick={() => setActive(id)} whileTap={{ scale: 0.97 }}
                  title={!showFull ? label : ''}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: showFull ? 'flex-start' : 'center',
                    gap: showFull ? 10 : 0, padding: showFull ? '8px 10px' : '9px 0',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isA ? '#3b82f6' : 'transparent',
                    color: isA ? '#fff' : c.sub,
                    fontWeight: isA ? 600 : 500, fontSize: 13, marginBottom: 2,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isA) e.currentTarget.style.background = c.hover; }}
                  onMouseLeave={e => { if (!isA) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {showFull && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                      {isA && <ChevronRight size={13} />}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────────────── */}
    </div>
  );
}