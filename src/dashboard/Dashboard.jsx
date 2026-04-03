import { useState } from 'react';
import {
  LayoutDashboard, FolderOpen, BarChart3, Settings,
  Bell, Sun, Moon, ChevronRight, RefreshCw, TrendingUp, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    label: 'Main',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'projects', label: 'Projects', icon: FolderOpen },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState('overview');

  const c = {
    bg:               dark ? '#0f172a' : '#f8fafc',
    sidebar:          dark ? '#1e293b' : '#ffffff',
    topbar:           dark ? '#1e293b' : '#ffffff',
    border:           dark ? '#334155' : '#e2e8f0',
    text:             dark ? '#f1f5f9' : '#0f172a',
    sub:              dark ? '#94a3b8' : '#64748b',
    activeBg:         '#3b82f6',
    activeBgHover:    '#2563eb',
    activeText:       '#ffffff',
    hover:            dark ? '#334155' : '#f1f5f9',
    cardBg:           dark ? '#1e293b' : '#ffffff',
    placeholderBorder: dark ? '#334155' : '#e2e8f0',
    placeholderText:  dark ? '#475569' : '#cbd5e1',
  };

  const iconBtn = {
    padding: 8, borderRadius: 8, border: 'none',
    background: 'transparent', color: c.sub,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: c.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14,
      transition: 'background 0.2s, color 0.2s',
    }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: c.sidebar,
        borderRight: `1px solid ${c.border}`,
        transition: 'background 0.2s',
      }}>

        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 16px', borderBottom: `1px solid ${c.border}`, gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#3b82f6', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingUp size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.text, lineHeight: 1.2 }}>
              Portfolio HQ
            </div>
            <div style={{ fontSize: 11, color: c.sub }}>Olin Corporation</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: c.sub,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '0 8px', marginBottom: 6,
              }}>
                {group.label}
              </div>
              {group.items.map(({ id, label, icon: Icon }) => {
                const isActive = active === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => setActive(id)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isActive ? c.activeBg : 'transparent',
                      color: isActive ? c.activeText : c.sub,
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13, marginBottom: 2,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.hover; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                    {isActive && <ChevronRight size={13} />}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: 12, borderTop: `1px solid ${c.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 6px', borderRadius: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#6366f1', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={14} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 12, color: c.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                John Smith
              </div>
              <div style={{ fontSize: 11, color: c.sub }}>PMO Director</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top Bar */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
          background: c.topbar, borderBottom: `1px solid ${c.border}`,
          flexShrink: 0, transition: 'background 0.2s',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: c.text }}>
              Project Portfolio Dashboard
            </div>
            <div style={{ fontSize: 11, color: c.sub }}>
              Last updated: April 3, 2026 · 9:41 AM
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

            {/* Refresh */}
            <motion.button
              whileTap={{ scale: 0.93 }} title="Refresh"
              style={iconBtn}
              onMouseEnter={e => e.currentTarget.style.background = c.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <RefreshCw size={15} />
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.93 }}
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

            {/* Dark mode toggle */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setDark(!dark)}
              title={dark ? 'Light mode' : 'Dark mode'}
              style={iconBtn}
              onMouseEnter={e => e.currentTarget.style.background = c.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: c.border, margin: '0 6px' }} />

            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#6366f1', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer',
            }}>
              JS
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Page heading */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 22, color: c.text, marginBottom: 4 }}>
                  {navGroups.flatMap(g => g.items).find(i => i.id === active)?.label}
                </div>
                <div style={{ fontSize: 13, color: c.sub }}>
                  Welcome back, John. Here's what's happening across your portfolio.
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                {['KPI Strip', 'KPI Strip', 'KPI Strip'].map((label, i) => (
                  <div key={i} style={{
                    background: c.cardBg, border: `1px solid ${c.placeholderBorder}`,
                    borderRadius: 12, height: 90,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: c.placeholderText, fontSize: 12, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {['Health by Dimension', 'Budget Snapshot'].map((label, i) => (
                  <div key={i} style={{
                    background: c.cardBg, border: `1px solid ${c.placeholderBorder}`,
                    borderRadius: 12, height: 220,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: c.placeholderText, fontSize: 12, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Bottom */}
              <div style={{
                background: c.cardBg, border: `1px solid ${c.placeholderBorder}`,
                borderRadius: 12, height: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: c.placeholderText, fontSize: 12, fontWeight: 500 }}>
                  Project Health Matrix
                </span>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}