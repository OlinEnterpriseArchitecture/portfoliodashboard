import { motion } from 'framer-motion';
import { COMING_SOON_CONFIG } from './dashboardConstants';

export default function ComingSoon({ active, dark, c }) {
  const config = COMING_SOON_CONFIG[active];
  if (!config) return null;
  const { Icon, desc } = config;
  const label = active.charAt(0).toUpperCase() + active.slice(1);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 40px', gap: 20, textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        style={{
          width: 76, height: 76, borderRadius: 20,
          background: dark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 10px rgba(59,130,246,0.05)',
        }}
      >
        <Icon size={34} color="#3b82f6" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
          Coming Soon
        </span>
        <span style={{ fontSize: 13, color: c.sub, maxWidth: 340, lineHeight: 1.65 }}>
          {desc}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.18 }}
        style={{
          padding: '6px 18px', borderRadius: 99,
          background: dark ? 'rgba(59,130,246,0.14)' : '#eff6ff',
          border: `1px solid ${dark ? 'rgba(59,130,246,0.28)' : '#bfdbfe'}`,
          fontSize: 12, fontWeight: 600, color: '#3b82f6',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
        {label} · In Development
      </motion.div>
    </div>
  );
}