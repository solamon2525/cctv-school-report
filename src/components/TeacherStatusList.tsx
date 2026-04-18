import React, { useState } from 'react';

interface TeacherStatus {
  name: string;
  status: 'completed' | 'pending';
  time?: string;
}

interface Props {
  morning: TeacherStatus[];
  afternoon: TeacherStatus[];
}

export default function TeacherStatusList({ morning, afternoon }: Props) {
  const [expandMorning, setExpandMorning] = useState(true);
  const [expandAfternoon, setExpandAfternoon] = useState(true);

  const renderShiftList = (
    title: string,
    emoji: string,
    timeRange: string,
    teachers: TeacherStatus[],
    expanded: boolean,
    onToggle: () => void,
    bgColor: string,
    textColor: string
  ) => {
    const completed = teachers.filter(t => t.status === 'completed').length;
    const pending = teachers.filter(t => t.status === 'pending').length;
    const displayCount = expanded ? teachers.length : Math.min(3, teachers.length);

    return (
      <div key={title} style={{
        background: bgColor,
        border: `1px solid ${textColor}20`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div
          onClick={onToggle}
          style={{
            padding: 12,
            background: `${textColor}08`,
            borderBottom: `1px solid ${textColor}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
                {title}
              </div>
              <div style={{ fontSize: 10, color: textColor, opacity: 0.6 }}>
                {timeRange}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>
              ✓ {completed}
            </div>
            <span style={{ color: textColor, opacity: 0.3 }}>|</span>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B' }}>
              ⏳ {pending}
            </div>
            <span style={{ fontSize: 12, color: textColor, opacity: 0.5, marginLeft: 8 }}>
              {expanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div style={{ padding: 0 }}>
            {teachers.slice(0, displayCount).map((teacher, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderBottom: idx < displayCount - 1 ? `1px solid ${textColor}10` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: teacher.status === 'completed' ? '#10B981' : '#F59E0B',
                  }}>
                    {teacher.status === 'completed' ? '✓' : '⏳'}
                  </span>
                  <span style={{ color: textColor, flex: 1 }}>
                    {teacher.name}
                  </span>
                </div>
                {teacher.time && (
                  <span style={{
                    fontSize: 11,
                    color: textColor,
                    opacity: 0.6,
                    fontFamily: 'monospace',
                  }}>
                    {teacher.time}
                  </span>
                )}
              </div>
            ))}

            {/* Show more button */}
            {teachers.length > 3 && expanded && (
              <div style={{
                padding: '8px 12px',
                textAlign: 'center',
                borderTop: `1px solid ${textColor}10`,
                fontSize: 11,
                color: textColor,
                opacity: 0.6,
                fontWeight: 600,
              }}>
                แสดง {displayCount} จาก {teachers.length} คน
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
        👥 สถานะการรายงานของครู
      </div>

      {renderShiftList(
        'กะเช้า',
        '🌅',
        '07:00-12:00 น.',
        morning,
        expandMorning,
        () => setExpandMorning(!expandMorning),
        '#FFF8E1',
        '#8A6000'
      )}

      {renderShiftList(
        'กะบ่าย',
        '🌆',
        '12:00-17:00 น.',
        afternoon,
        expandAfternoon,
        () => setExpandAfternoon(!expandAfternoon),
        '#EFF4FB',
        '#1A3A8A'
      )}
    </div>
  );
}
