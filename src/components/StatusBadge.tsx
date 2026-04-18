import { CamStatus, Urgency, Shift, stLbl, urgLbl, stClass, urgClass } from '../lib/store';

const BASE: React.CSSProperties = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'5px 14px', borderRadius:20,
  fontSize:12, fontWeight:600, whiteSpace:'nowrap', lineHeight:1.4,
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  transition: 'all 0.2s ease-out'
};

import React from 'react';

export function CamBadge({ status }: { status: CamStatus }) {
  return (
    <span className={stClass[status]} style={{...BASE, cursor: 'default'}}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', flexShrink:0, animation: 'pulse-dot 2s infinite' }}/>
      {stLbl[status]}
    </span>
  );
}

export function UrgBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={urgClass[urgency]} style={{...BASE, cursor: 'default'}}>
      {urgLbl[urgency]}
    </span>
  );
}

export function ShiftBadge({ shift }: { shift: Shift }) {
  return (
    <span className={shift === 'morning' ? 's-morning' : 's-afternoon'} style={{...BASE, cursor: 'default'}}>
      {shift === 'morning' ? '🌅 เช้า' : '🌇 บ่าย'}
    </span>
  );
}
