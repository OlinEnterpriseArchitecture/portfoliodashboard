import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

import TotalProjectsCard  from '../components/cards/TotalProjectsCard';
import ActiveAlertsCard   from '../components/cards/ActiveAlertsCard';
import PipelineCard       from '../components/cards/PipelineCard';
import ProjectTypeCard    from '../components/cards/ProjectTypeCard';
import HealthCard         from '../components/cards/HealthCard';
import HealthDimCard      from '../components/cards/HealthDimCard';
import MatrixCard         from '../components/cards/MatrixCard';
import BudgetSnapshotCard from '../components/cards/BudgetSnapshotCard';
import DeptProjectsCard from '../components/cards/DeptProjectsCard';

import { ALL_CARD_IDS, CARD_META } from './dashboardConstants';

// ── Live Card Thumbnail ───────────────────────────────────────────────────────

const NATURAL_W = 380;
const NATURAL_H = Math.round(NATURAL_W * 9 / 16);

function LiveCardThumbnail({
  id, dark, c, KPI,
  healthByDim, healthByDept,
  budgetData, projects,
  pipelineVisibleStages, healthDimView,
}) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(0.45);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / NATURAL_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardProps = { c, dark, isEditing: false, KPI };

  const renderContent = () => {
    switch (id) {
      case 'total-projects':  return <TotalProjectsCard {...cardProps} />;
      case 'active-alerts':   return <ActiveAlertsCard  {...cardProps} />;
      case 'pipeline':
        return (
          <PipelineCard
            {...cardProps}
            visibleStages={pipelineVisibleStages}
            onStagesChange={() => {}}
          />
        );
      case 'project-type':    return <ProjectTypeCard {...cardProps} />;
      case 'health':          return <HealthCard      {...cardProps} />;
      case 'health-dim':
        return (
          <HealthDimCard
            {...cardProps}
            healthByDim={healthByDim}
            healthByDept={healthByDept}
            view={healthDimView}
            onViewChange={() => {}}
          />
        );
      case 'budget-snapshot': return <BudgetSnapshotCard {...cardProps} budgetData={budgetData} />;
      case 'matrix':          return <MatrixCard         {...cardProps} projects={projects} />;
      case 'dept-projects':
        return <DeptProjectsCard {...cardProps} projects={projects} />;
      default:                return null;
    }
  };

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%', aspectRatio: '16/9', overflow: 'hidden',
        position: 'relative', background: c.card,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: NATURAL_W, height: NATURAL_H,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          pointerEvents: 'none', userSelect: 'none',
          background: c.card, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', transition: 'none',
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
}

// ── Card Picker Modal ─────────────────────────────────────────────────────────

export default function CardPickerModal({
  dark, c, visibleCardIds, onAdd, onClose,
  KPI, healthByDim, healthByDept,
  budgetData, projects,
  pipelineVisibleStages, healthDimView,
}) {
  const availableCount = ALL_CARD_IDS.filter(id => !visibleCardIds.includes(id)).length;

  const thumbnailProps = {
    dark, c, KPI, healthByDim, healthByDept,
    budgetData, projects, pipelineVisibleStages, healthDimView,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit   ={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: c.card, borderRadius: 16,
          border: `1px solid ${c.border}`,
          boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.72)' : '0 24px 80px rgba(0,0,0,0.18)',
          width: '92%', maxWidth: 680, maxHeight: '82vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: c.text }}>Add a Card</div>
            <div style={{ fontSize: 12, color: c.sub, marginTop: 3 }}>
              {availableCount > 0
                ? `${availableCount} card${availableCount !== 1 ? 's' : ''} available · click to add`
                : 'All cards are already on your dashboard'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: c.sub, padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = c.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(172px, 1fr))',
            gap: 14,
          }}>
            {ALL_CARD_IDS.map(id => {
              const isAdded = visibleCardIds.includes(id);
              const meta    = CARD_META[id];
              return (
                <button
                  key={id}
                  onClick={() => { if (!isAdded) onAdd(id); }}
                  style={{
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    borderRadius: 10, cursor: isAdded ? 'default' : 'pointer',
                    padding: 0, overflow: 'hidden', opacity: isAdded ? 0.42 : 1,
                    textAlign: 'left', position: 'relative',
                    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.12s, opacity 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isAdded) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(59,130,246,0.15)';
                      e.currentTarget.style.transform   = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = c.border;
                    e.currentTarget.style.boxShadow   = 'none';
                    e.currentTarget.style.transform   = 'translateY(0)';
                  }}
                >
                  <LiveCardThumbnail id={id} {...thumbnailProps} />
                  <div style={{
                    padding: '9px 12px 11px', borderTop: `1px solid ${c.border}`,
                    background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 2 }}>
                      {meta.title}
                    </div>
                    <div style={{ fontSize: 10, color: c.sub, lineHeight: 1.45 }}>
                      {meta.description}
                    </div>
                  </div>
                  {isAdded && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#22c55e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={11} color="#fff" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}