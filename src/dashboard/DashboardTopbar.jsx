import { useState } from 'react';
import { Bell, Sun, Moon, RefreshCw, HelpCircle, Download } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export default function DashboardTopbar({
  dark,
  c,
  meta,
  active,
  formattedLastUpdated,
  onToggleDark,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshSpin = useAnimation();

  const iconBtn = {
    padding: 8, borderRadius: 8, border: 'none', background: 'transparent',
    color: c.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshSpin
      .start({ rotate: 360, transition: { duration: 0.6, ease: [0.4, 0, 0.6, 1] } })
      .then(() => { refreshSpin.set({ rotate: 0 }); setIsRefreshing(false); });
  };

  return (
    <div style={{
      height: 64, flexShrink: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      background: c.topbar, borderBottom: `1px solid ${c.border}`, zIndex: 10,
    }}>
      {/* ── Left: title ───────────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: c.text }}>{meta.title}</div>
        <div style={{ fontSize: 11, color: c.sub }}>
          {active === 'overview' ? (formattedLastUpdated ?? meta.sub) : meta.sub}
        </div>
      </div>

      {/* ── Right: action icons ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <motion.button whileTap={{ scale: 0.93 }} title="Refresh" onClick={handleRefresh}
          style={iconBtn}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <motion.div animate={refreshSpin} style={{ display: 'flex' }}>
            <RefreshCw size={15} />
          </motion.div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.93 }} title="Alerts"
          style={{ ...iconBtn, position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, background: '#ef4444',
            borderRadius: '50%', border: `2px solid ${c.topbar}`,
          }} />
        </motion.button>

        <motion.button whileTap={{ scale: 0.93 }} onClick={onToggleDark}
          style={iconBtn}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        <div style={{ width: 1, height: 24, background: c.border, margin: '0 4px' }} />

        <motion.button whileTap={{ scale: 0.93 }} style={iconBtn}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Download size={15} />
        </motion.button>

        <motion.button whileTap={{ scale: 0.93 }} style={iconBtn}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <HelpCircle size={15} />
        </motion.button>
      </div>
    </div>
  );
}