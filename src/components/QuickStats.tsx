import React from 'react';

interface StatCard {
  icon: string;
  label: string;
  value: number;
  change?: number;
  color: string;
  bgColor: string;
}

interface Props {
  stats: StatCard[];
}

export default function QuickStats({ stats }: Props) {
  const getChangeColor = (change?: number) => {
    if (!change) return '#9CA3AF';
    return change > 0 ? '#10B981' : '#EF4444';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return '→';
    return change > 0 ? '↑' : '↓';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
    }}>
      {stats.map((stat, idx) => (
        <div
          key={idx}
          style={{
            background: stat.bgColor,
            border: `2px solid ${stat.color}30`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Icon & Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{stat.icon}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: stat.color,
              flex: 1,
            }}>
              {stat.label}
            </span>
          </div>

          {/* Value */}
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: stat.color,
          }}>
            {stat.value}
          </div>

          {/* Change */}
          {stat.change !== undefined && (
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: getChangeColor(stat.change),
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span>{getChangeIcon(stat.change)}</span>
              <span>{Math.abs(stat.change)}% จากเมื่อวาน</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
