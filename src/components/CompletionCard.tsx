import React from 'react';

interface Props {
  shift: 'morning' | 'afternoon';
  percentage: number;
  completed: number;
  total: number;
  pending: string[];
}

export default function CompletionCard({ shift, percentage, completed, total, pending }: Props) {
  const isMorning = shift === 'morning';
  const gradientStart = isMorning ? '#FF9500' : '#5B7FFF';
  const gradientEnd = isMorning ? '#FFD700' : '#7B5FFF';
  const bgColor = isMorning ? '#FFF8E1' : '#EFF4FB';
  const textColor = isMorning ? '#8A6000' : '#1A3A8A';
  const emoji = isMorning ? '🌅' : '🌆';
  const shiftLabel = isMorning ? 'กะเช้า' : 'กะบ่าย';
  const timeRange = isMorning ? '07:00-12:00' : '12:00-17:00';

  // Calculate circle progress
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      background: bgColor,
      border: `2px solid ${gradientStart}`,
      borderRadius: 16,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      minHeight: 280,
      justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 4 }}>
          {shiftLabel}
        </div>
        <div style={{ fontSize: 12, color: textColor, opacity: 0.7 }}>
          {timeRange} น.
        </div>
      </div>

      {/* Circular Progress */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg
          width="120"
          height="120"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={`${gradientStart}20`}
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={`url(#grad-${shift})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <defs>
            <linearGradient id={`grad-${shift}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
        </svg>
        {/* Percentage text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: textColor }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 11, color: textColor, opacity: 0.7 }}>
            สมบูรณ์
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>
              ✓ {completed}
            </div>
            <div style={{ fontSize: 11, color: textColor, opacity: 0.7 }}>
              คนรายงาน
            </div>
          </div>
          <div style={{ width: '1px', background: `${textColor}20` }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>
              ⏳ {total - completed}
            </div>
            <div style={{ fontSize: 11, color: textColor, opacity: 0.7 }}>
              คนยังไม่
            </div>
          </div>
        </div>

        {/* Pending list */}
        {pending.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 8,
            padding: 12,
            marginTop: 12,
            maxHeight: 80,
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: textColor, marginBottom: 8, opacity: 0.7 }}>
              ยังไม่รายงาน ({pending.length})
            </div>
            {pending.map((name, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 11,
                  color: textColor,
                  padding: '4px 0',
                  borderBottom: idx < pending.length - 1 ? `1px solid ${textColor}10` : 'none',
                  textAlign: 'left',
                  paddingLeft: 8,
                }}
              >
                • {name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
