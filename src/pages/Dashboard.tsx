import React from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate, today } from '../lib/store';
import PageHeader from '../components/PageHeader';

interface Props { user: AppUser; onNav:(p:any)=>void; schoolId:string; }

function ReportCard({ rpt, users }: { rpt: DutyReport; users: AppUser[] }) {
  const reporter = users.find(u=>u.id===rpt.reporterId);
  const issues = rpt.areas.filter(a=>a.status==='issue');
  const SHIFT_C = rpt.shift==='morning' ? '#8a6000' : '#1a3a8a';
  const SHIFT_BG = rpt.shift==='morning' ? '#fff8e1' : '#e8f0ff';

  return (
    <div style={{ background:'#fff', border:`1px solid ${rpt.isNormal?'#e5e0d4':'rgba(183,28,28,.25)'}`, borderLeft:`3px solid ${rpt.isNormal?'#2e7d32':'#b71c1c'}`, borderRadius:10, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <span style={{ background:SHIFT_BG, color:SHIFT_C, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
            {rpt.shift==='morning'?'🌅 กะเช้า':'🌇 กะบ่าย'}
          </span>
          <span style={{ marginLeft:8, fontSize:12, color:'#a89f8c', fontFamily:'IBM Plex Mono,monospace' }}>{rpt.time} น.</span>
        </div>
        <span style={{ background:rpt.isNormal?'#e8f5e9':'#fde8e8', color:rpt.isNormal?'#1b5e20':'#b71c1c', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
          {rpt.isNormal ? '✓ เหตุการณ์ปกติ' : `⚠ พบปัญหา ${issues.length} จุด`}
        </span>
      </div>

      {issues.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
          {issues.map(a=>(
            <span key={a.area} style={{ background:'#fff8e1', color:'#8a6000', border:'1px solid #f5d06e', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600 }}>
              {a.area}{a.note?': '+a.note:''}
            </span>
          ))}
        </div>
      )}

      {rpt.note && (
        <div style={{ fontSize:13, color:'#574f44', background:'#faf8f4', borderRadius:7, padding:'7px 10px', marginBottom:8 }}>
          {rpt.note}
        </div>
      )}

      {rpt.photos && rpt.photos.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
          {rpt.photos.map((p:any,i:number)=>(
            <div key={i} style={{ position:'relative', width:64, height:48, borderRadius:6, overflow:'hidden', border:'1px solid #e5e0d4', cursor:'pointer' }} onClick={()=>window.open(p.data,'_blank')}>
              <img src={p.data} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              {p.camId&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,.55)',padding:'1px 4px'}}><span style={{fontSize:8,color:'#fff',fontFamily:'IBM Plex Mono,monospace'}}>{p.camId}</span></div>}
            </div>
          ))}
          <div style={{fontSize:11,color:'#a89f8c',alignSelf:'center'}}>📷 {rpt.photos.length} รูป</div>
        </div>
      )}
      <div style={{ fontSize:11, color:'#a89f8c', display:'flex', gap:8 }}>
        <span>✍ {reporter?.name || rpt.sign}</span>
        <span>·</span>
        <span>{fmtDate(rpt.date)}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onNav, schoolId }: Props) {
  const allSchools = load<School>(K.schools);
  const allUsers   = load<AppUser>(K.users);
  const isDirector = user.role === 'director';
  const schoolIds  = isDirector ? allSchools.map(s=>s.id) : [schoolId];

  const td = today();
  const thisM = td.slice(0,7);

  // Compute stats per school
  const schoolStats = allSchools
    .filter(s => schoolIds.includes(s.id))
    .map(s => {
      const rpts = load<DutyReport>(K.reports).filter(r=>r.schoolId===s.id);
      const todayR = rpts.filter(r=>r.date===td);
      const monthR = rpts.filter(r=>r.date.startsWith(thisM));
      const hasMorn = todayR.some(r=>r.shift==='morning');
      const hasAftn = todayR.some(r=>r.shift==='afternoon');
      const issues  = todayR.filter(r=>!r.isNormal).length;
      return { school:s, todayR, monthR, hasMorn, hasAftn, issues };
    });

  const SCHOOL_C: Record<string,string> = { s1:'#1e5c3b', s2:'#1a4a7a' };
  const SCHOOL_BG: Record<string,string> = { s1:'#f0f7f2', s2:'#eff4fb' };

  return (
    <div>
      <PageHeader
        title={isDirector ? 'ภาพรวมทั้งเครือข่าย' : allSchools.find(s=>s.id===schoolId)?.name||''}
        subtitle={isDirector ? `ผู้อำนวยการ ${user.name.split(' ')[0]}` : new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}>
        {!isDirector && (
          <button onClick={() => onNav('new-report')} style={{ background:SCHOOL_C[schoolId]||'#1e5c3b', color:'#faf8f4', border:'none', borderRadius:8, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>
            + บันทึกรายงานเวร
          </button>
        )}
      </PageHeader>

      <div style={{ padding:24 }}>
        {/* Director: side-by-side school cards */}
        {isDirector && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:18, marginBottom:24 }}>
            {schoolStats.map(({ school:s, todayR, monthR, hasMorn, hasAftn, issues }) => (
              <div key={s.id} style={{ background:'#fff', border:`1px solid ${SCHOOL_C[s.id]}40`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ background:SCHOOL_C[s.id], padding:'13px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{s.name}</div>
                  <span style={{ background: issues>0?'#fde8e8':'rgba(255,255,255,.2)', color: issues>0?'#b71c1c':'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    {issues>0 ? `⚠ ${issues} ปัญหา` : '✓ ปกติ'}
                  </span>
                </div>
                <div style={{ padding:'14px 18px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                    {[['วันนี้',todayR.length,'var(--c)'],['เดือนนี้',monthR.length,'#574f44'],['ปัญหา',issues,issues?'#b71c1c':'#2e7d32']].map(([l,v,c])=>(
                      <div key={l as string} style={{ textAlign:'center', background:SCHOOL_BG[s.id], borderRadius:8, padding:'10px 0' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:c as string, fontFamily:'IBM Plex Mono,monospace' }}>{v}</div>
                        <div style={{ fontSize:10, color:'#a89f8c' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    {[['🌅 เช้า', hasMorn], ['🌇 บ่าย', hasAftn]].map(([l,ok])=>(
                      <div key={l as string} style={{ flex:1, background:ok?'#e8f5e9':'#fde8e8', border:`1px solid ${ok?'#a5d6a7':'#ffcdd2'}`, borderRadius:7, padding:'7px', textAlign:'center', fontSize:12, fontWeight:600, color:ok?'#1b5e20':'#b71c1c' }}>
                        {l as string} {ok?'✓':'ยังไม่รายงาน'}
                      </div>
                    ))}
                  </div>
                  {/* Latest reports */}
                  {todayR.slice(0,2).map(r=><ReportCard key={r.id} rpt={r} users={allUsers}/>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Teacher: single school */}
        {!isDirector && (() => {
          const rpts = load<DutyReport>(K.reports).filter(r=>r.schoolId===schoolId);
          const todayR = rpts.filter(r=>r.date===td).sort((a,b)=>a.timestamp-b.timestamp);
          const monthR = rpts.filter(r=>r.date.startsWith(thisM));
          const sc = SCHOOL_C[schoolId]||'#1e5c3b';
          const bg = SCHOOL_BG[schoolId]||'#f0f7f2';
          const hasMorn = todayR.some(r=>r.shift==='morning');
          const hasAftn = todayR.some(r=>r.shift==='afternoon');

          return (
            <>
              {/* Today status */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:14, marginBottom:20 }}>
                {[['รายงานวันนี้',todayR.length,sc],['เดือนนี้',monthR.length,'#574f44'],['ปกติ',rpts.filter(r=>r.isNormal&&r.date===td).length,'#2e7d32'],['มีปัญหา',rpts.filter(r=>!r.isNormal&&r.date===td).length,'#b71c1c']].map(([l,v,c])=>(
                  <div key={l as string} style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${c as string}` }}>
                    <div style={{ fontSize:10, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{l}</div>
                    <div style={{ fontSize:28, fontWeight:700, color:c as string, fontFamily:'IBM Plex Mono,monospace' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Shift status */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12, marginBottom:20 }}>
                {[['morning','🌅','กะเช้า','07:00–12:00',hasMorn],['afternoon','🌇','กะบ่าย','12:00–17:00',hasAftn]].map(([s,ico,name,time,done])=>(
                  <div key={s as string} style={{ background:'#fff', border:`1px solid ${done?'#a5d6a7':'#e5e0d4'}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:26 }}>{ico}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#252018' }}>{name}</div>
                      <div style={{ fontSize:11, color:'#a89f8c' }}>{time as string} น.</div>
                    </div>
                    {done
                      ? <span style={{ background:'#e8f5e9', color:'#1b5e20', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>✓ รายงานแล้ว</span>
                      : <button onClick={() => onNav('new-report')} style={{ background:sc, color:'#faf8f4', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>รายงาน</button>
                    }
                  </div>
                ))}
              </div>

              {/* Today reports */}
              {todayR.length > 0 && (
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:12, padding:'16px 18px', marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#252018', marginBottom:12 }}>รายงานวันนี้</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {todayR.map(r=><ReportCard key={r.id} rpt={r} users={allUsers}/>)}
                  </div>
                </div>
              )}

              {/* Recent history */}
              {(() => {
                const prev = rpts.filter(r=>r.date!==td).sort((a,b)=>b.timestamp-a.timestamp).slice(0,5);
                return prev.length > 0 ? (
                  <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:12, padding:'16px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#252018', marginBottom:12 }}>รายงานล่าสุด</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {prev.map(r=><ReportCard key={r.id} rpt={r} users={allUsers}/>)}
                    </div>
                  </div>
                ) : null;
              })()}
            </>
          );
        })()}
      </div>
    </div>
  );
}
