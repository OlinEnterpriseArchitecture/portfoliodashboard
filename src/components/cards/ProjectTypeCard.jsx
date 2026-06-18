import { Wrench, Compass } from 'lucide-react';
import { CardBody, DragBar, SubTile } from './shared';

const TYPES = [
  { key: 'implementation', Icon: Wrench,  label: 'Implementation', color: '#3b82f6', bg: { dark: 'rgba(59,130,246,0.12)',  light: '#eff6ff' } },
  { key: 'discovery',      Icon: Compass, label: 'Discovery',       color: '#8b5cf6', bg: { dark: 'rgba(139,92,246,0.12)', light: '#f5f3ff' } },
];

export default function ProjectTypeCard({ c, dark, isEditing, KPI = {}, drillDown, onDrillDown }) {
  const canDrill = !!onDrillDown && !isEditing;

  return (
    <>
      <DragBar title="Project Type" textColor={c.sub} borderColor={c.border} isEditing={isEditing} />
      <CardBody refW={220} refH={110} style={{ flexDirection: 'row', gap: 8 }}>
        {TYPES.map(({ key, Icon, label, color, bg }) => {
          const value    = KPI[key] ?? 0;
          const isActive = drillDown?.has(key) ?? false;
          const isDimmed = drillDown !== null && value === 0;

          return (
            <div
              key={key}
              onClick={() => canDrill && onDrillDown(key)}
              style={{
                flex: 1, minWidth: 0,
                height: '100%',
                display: 'flex',
                cursor: canDrill ? 'pointer' : 'default',
                opacity: isDimmed ? 0.35 : 1,
                outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                outlineOffset: -2,
                borderRadius: 8,
                transition: 'opacity 0.2s, outline-color 0.2s',
              }}
            >
              <SubTile
                Icon={Icon}
                label={label}
                value={value}
                subtitle={`${KPI.total ? Math.round(value / KPI.total * 100) : 0}% of portfolio`}
                color={color}
                bg={bg[dark ? 'dark' : 'light']}
              />
            </div>
          );
        })}
      </CardBody>
    </>
  );
}