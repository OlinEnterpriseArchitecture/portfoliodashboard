import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DRILL_LABELS } from '../data/filters';

export default function DrillBanner({ drillDown, filteredCount, totalCount, c, dark, onClear, getLabel }) {
  const keys = drillDown instanceof Set
    ? [...drillDown]
    : drillDown ? [drillDown] : [];

  const isActive = keys.length > 0;

  // Prefer the caller's resolver, then the static map, then fall back to the key itself.
  const resolveLabel = k => (getLabel ? getLabel(k) : null) ?? DRILL_LABELS[k] ?? k;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y:  0 }}
          exit={{    opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', marginBottom: 8,
            background: dark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
            border: `1px solid ${dark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.25)'}`,
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', flex: 1 }}>
            {keys.length === 1 ? (
              <>Filtering by: <strong>{resolveLabel(keys[0])}</strong></>
            ) : (
              <>
                Filtering by:{' '}
                {keys.map((k, i) => (
                  <span key={k}>
                    <strong>{resolveLabel(k)}</strong>
                    {i < keys.length - 1 && <span style={{ fontWeight: 400 }}> + </span>}
                  </span>
                ))}
              </>
            )}
            &nbsp;·&nbsp;{filteredCount} of {totalCount} project{totalCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClear}
            title="Clear filter"
            style={{
              background: 'none', border: 'none', padding: 2,
              cursor: 'pointer', color: '#3b82f6',
              display: 'flex', alignItems: 'center',
              borderRadius: 4,
            }}
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}