import { CardBody, DragBar, hColor, hLabel, InfoTooltip, HEALTH_SCORE_INFO } from './shared';

export default function HealthCard({ c, isEditing, KPI }) {
  const hc = hColor(KPI.healthScore);
  const hd = Math.round(KPI.healthScore / 10);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <DragBar title="Portfolio Health" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />
      <CardBody refW={140} refH={120} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: hc, lineHeight: 1, letterSpacing: '-0.03em' }}>{KPI.healthScore}</span>
          <span style={{ fontSize: 12, color: c.sub, fontWeight: 500 }}>/100</span>
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < hd ? hc : c.track }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: c.sub, fontWeight: 500 }}>Portfolio Health</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: hc, background: `${hc}22`, padding: '2px 10px', borderRadius: 4 }}>
            {hLabel(KPI.healthScore)}
          </span>
        </div>
      </CardBody>

      {/* Info icon — outside CardBody so it's unaffected by zoom */}
      <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 10 }}>
        <InfoTooltip content={HEALTH_SCORE_INFO} color={c.sub} />
      </div>
    </div>
  );
}