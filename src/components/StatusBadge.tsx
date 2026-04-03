import { CamStatus, Urgency, Shift, stLbl, urgLbl, stClass, urgClass } from '../lib/store';

const BASE: React.CSSProperties = {
  display:'inline-flex', alignItems:'center', gap:5,
  padding:'3px 10px', borderRadius:20,
  fontSize:11, fontWeight:600, whiteSpace:'nowrap', lineHeight:1.4,
};

import React from 'react';

export function CamBadge({ status }: { status: CamStatus }) {
  return (
    <span className={stClass[status]} style={BASE}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }}/>
      {stLbl[status]}
    </span>
  );
}

export function UrgBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={urgClass[urgency]} style={BASE}>
      {urgLbl[urgency]}
    </span>
  );
}

export function ShiftBadge({ shift }: { shift: Shift }) {
  return (
    <span className={shift === 'morning' ? 's-morning' : 's-afternoon'} style={BASE}>
      {shift === 'morning' ? '🌅 เช้า' : '🌇 บ่าย'}
    </span>
  );
}
