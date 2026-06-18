import { Layers } from 'lucide-react';
import { CardBody, DragBar, StatusPill } from './shared';

export default function TotalProjectsCard({ c, dark, isEditing, KPI = {}, drillDown, onDrillDown }) {
  const canDrill = !!onDrillDown && !isEditing;

  const pills = [
    { key: 'onTrack',  label: 'On Track',  count: KPI.onTrack,  color: '#16a34a', bg: dark ? 'rgba(22,163,74,0.13)'  : '#f0fdf4' },
    { key: 'atRisk',   label: 'At Risk',   count: KPI.atRisk,   color: '#d97706', bg: dark ? 'rgba(217,119,6,0.13)'  : '#fffbeb' },
    { key: 'offTrack', label: 'Off Track', count: KPI.offTrack, color: '#dc2626', bg: dark ? 'rgba(220,38,38,0.13)'  : '#fef2f2' },
  ];

  return (
    <>
      <DragBar title="Total Projects" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />
      <CardBody refW={250} refH={100} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: dark ? 'rgba(59,130,246,0.18)' : '#dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Layers size={13} color="#3b82f6" />
            </div>
            <span style={{ fontSize: 38, fontWeight: 900, color: c.text, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {KPI.total}
            </span>
          </div>
          <span style={{ fontSize: 11, color: c.sub, fontWeight: 500, whiteSpace: 'nowrap' }}>Total Projects</span>
        </div>

        <div style={{ width: 1, background: c.border, alignSelf: 'stretch', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
          {pills.map(({ key, label, count, color, bg }) => {
            const isActive = drillDown?.has(key) ?? false;
            const isDimmed = drillDown !== null && (count ?? 0) === 0;
            return (
              <div
                key={key}
                onClick={() => canDrill && onDrillDown(key)}
                style={{
                  cursor: canDrill ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.35 : 1,
                  outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: -2,
                  borderRadius: 6,
                  transition: 'opacity 0.2s, outline-color 0.2s',
                }}
              >
                <StatusPill label={label} count={count} color={color} bg={bg} dot />
              </div>
            );
          })}
        </div>
      </CardBody>
    </>
  );
}