import { CamStatus, Urgency, Shift, stLbl, urgLbl, stClass, urgClass } from '../lib/store';

export function CamBadge({ status }: { status: CamStatus }) {
  return (
    <span className={stClass[status]} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
      {stLbl[status]}
    </span>
  );
}

export function UrgBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={urgClass[urgency]} style={{ display:'inline-flex', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600 }}>
      {urgLbl[urgency]}
    </span>
  );
}

export function ShiftBadge({ shift }: { shift: Shift }) {
  return (
    <span className={shift === 'morning' ? 's-morning' : 's-afternoon'} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600 }}>
      {shift === 'morning' ? '🌅 เช้า' : '🌇 บ่าย'}
    </span>
  );
}
