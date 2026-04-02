import React from 'react';
import { load, K, Camera, Inspection, School, Teacher, fmtDate, stBorderColor, urgLbl } from '../lib/store';
import { CamBadge, ShiftBadge, UrgBadge } from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

const SCHOOL_COLORS: Record<string,{pri:string;light:string;bg:string;border:string}> = {
  s1: { pri:'#1e5c3b', light:'#2d7a52', bg:'#f0f7f2', border:'#b3dcc0' },
  s2: { pri:'#1a4a7a', light:'#2563a8', bg:'#eff4fb', border:'#bdd0ee' },
};

function SchoolCard({ school, onNav, onSchoolChange }: { school: School; onNav:(p:any)=>void; onSchoolChange:(id:string)=>void }) {
  const cams = load<Camera>(K.cams).filter(c => c.schoolId === school.id);
  const ins  = load<Inspection>(K.inspections).filter(i => i.schoolId === school.id);
  const td   = new Date().toISOString().slice(0,10);
  const todayI = ins.filter(i => i.date === td);
  const okCams  = cams.filter(c => c.status === 'ok').length;
  const badCams = cams.filter(c => c.status !== 'ok').length;
  const openProbs = ins.filter(i => i.urgency !== 'none' && !i.resolved).length;
  const sc = SCHOOL_COLORS[school.id] || SCHOOL_COLORS['s1'];
  const teachers = load<Teacher>(K.teachers);
  const recent = [...ins].sort((a,b) => b.timestamp-a.timestamp).slice(0,3);

  const todayStatus = (() => {
    const shifts = todayI.map(i => i.shift);
    if (shifts.includes('morning') && shifts.includes('afternoon')) return { txt:'ตรวจครบ 2 กะ', color:'#2e7d32' };
    if (shifts.includes('morning')) return { txt:'เช้าแล้ว · รอบ่าย', color:'#c4891a' };
    if (shifts.includes('afternoon')) return { txt:'บ่ายแล้ว · รอเช้า', color:'#c4891a' };
    return { txt:'ยังไม่ได้ตรวจวันนี้', color:'#b71c1c' };
  })();

  return (
    <div style={{ background:'#fff', border:`1px solid ${sc.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
      {/* School header */}
      <div style={{ background:sc.pri, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{school.name}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:2 }}>กล้อง {cams.length} ตัว · การตรวจ {ins.length} ครั้ง</div>
        </div>
        <button onClick={() => { onSchoolChange(school.id); onNav('dashboard'); }}
          style={{ background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.3)', borderRadius:7, padding:'6px 14px', fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>
          เปิดดู →
        </button>
      </div>

      <div style={{ padding:'16px 20px' }}>
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'ตรวจวันนี้', val:todayI.length, color:sc.pri },
            { label:'กล้องปกติ',  val:okCams,         color:'#2e7d32' },
            { label:'ผิดปกติ',    val:badCams,         color: badCams?'#b71c1c':'#a89f8c' },
            { label:'รอแก้ไข',   val:openProbs,       color: openProbs?'#c4891a':'#a89f8c' },
          ].map(s => (
            <div key={s.label} style={{ background:sc.bg, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'IBM Plex Mono,monospace' }}>{s.val}</div>
              <div style={{ fontSize:10, color:'#a89f8c', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Today status bar */}
        <div style={{ background:sc.bg, borderRadius:7, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:todayStatus.color, display:'inline-block' }}/>
          <span style={{ fontSize:12, color:todayStatus.color, fontWeight:600 }}>{todayStatus.txt}</span>
        </div>

        {/* Camera mini-grid */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>สถานะกล้อง</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:6 }}>
            {cams.map(c => (
              <div key={c.id} style={{ background:'#faf8f4', border:'1px solid #e5e0d4', borderLeft:`2.5px solid ${stBorderColor[c.status]}`, borderRadius:6, padding:'7px 9px' }}>
                <div style={{ fontSize:9, color:'#a89f8c', fontFamily:'IBM Plex Mono,monospace' }}>{c.id}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'#252018', marginBottom:4 }}>{c.name}</div>
                <CamBadge status={c.status}/>
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>การตรวจล่าสุด</div>
            {recent.map(i => (
              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f3f0e8', fontSize:12 }}>
                <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                  <ShiftBadge shift={i.shift}/>
                  <span style={{ color:'#574f44' }}>{teachers.find(t=>t.id===i.teacherId)?.name||i.teacherId}</span>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {i.urgency !== 'none' && <UrgBadge urgency={i.urgency}/>}
                  <span style={{ color:'#a89f8c', fontSize:11 }}>{fmtDate(i.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Overview({ onNav, onSchoolChange }: { onNav:(p:any)=>void; onSchoolChange:(id:string)=>void }) {
  const schools = load<School>(K.schools);
  const allIns  = load<Inspection>(K.inspections);
  const allCams = load<Camera>(K.cams);
  const td = new Date().toISOString().slice(0,10);
  const thisM = td.slice(0,7);

  const totalToday  = allIns.filter(i => i.date === td).length;
  const totalMonth  = allIns.filter(i => i.date.startsWith(thisM)).length;
  const totalOk     = allCams.filter(c => c.status === 'ok').length;
  const totalBad    = allCams.filter(c => c.status !== 'ok').length;
  const totalProbs  = allIns.filter(i => i.urgency !== 'none' && !i.resolved).length;

  return (
    <div>
      <PageHeader title="ภาพรวมทั้งเครือข่าย" subtitle={`${schools.length} โรงเรียน · กล้องรวม ${allCams.length} ตัว`}>
        <button onClick={() => window.print()} style={{ background:'none', border:'1px solid #ccc5b4', borderRadius:7, padding:'7px 14px', fontSize:13, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'#574f44' }}>🖨 พิมพ์ภาพรวม</button>
      </PageHeader>

      <div style={{ padding:24 }}>
        {/* Combined stats */}
        <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:12, padding:'16px 20px', marginBottom:22 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:14 }}>สรุปภาพรวมวันนี้ — ทั้งเครือข่าย</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
            {[
              { label:'การตรวจวันนี้',  val:totalToday, color:'#574f44' },
              { label:'ตรวจเดือนนี้',   val:totalMonth, color:'#574f44' },
              { label:'กล้องทั้งหมด',   val:allCams.length, color:'#574f44' },
              { label:'กล้องปกติ',      val:totalOk,   color:'#2e7d32' },
              { label:'รอแก้ไข',        val:totalProbs, color: totalProbs?'#b71c1c':'#2e7d32' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:30, fontWeight:700, color:s.color, fontFamily:'IBM Plex Mono,monospace' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#a89f8c', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-school cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {schools.map(school => (
            <SchoolCard key={school.id} school={school} onNav={onNav} onSchoolChange={onSchoolChange}/>
          ))}
        </div>
      </div>
    </div>
  );
}
