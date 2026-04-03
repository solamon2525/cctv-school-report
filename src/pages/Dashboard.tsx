import React from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate, today } from '../lib/store';
import PageHeader from '../components/PageHeader';
import { FileText, ShieldCheck, TrendingDown } from 'lucide-react';

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
        subtitle={isDirector ? `ผู้อำนวยการ ${user.name.split(' ')[0]}` : new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
      />

      <div style={{ padding:24 }}>
        {/* Director: Executive Dashboard */}
        {isDirector && (() => {
          const allRpts = load<DutyReport>(K.reports);
          const td = today();
          const todayRpts = allRpts.filter(r => r.date === td);
          const todayIssues = todayRpts.filter(r => !r.isNormal).length;
          const monthIssues = allRpts.filter(r => r.date.startsWith(thisM) && !r.isNormal).length;
          
          // Chart Data (Last 7 Days)
          const last7 = Array.from({length:7}, (_,i) => {
            const d = new Date(); d.setDate(d.getDate() - (6-i));
            return d.toISOString().slice(0,10);
          });
          const maxRep = Math.max(1, ...last7.map(d => allRpts.filter(r=>r.date===d).length));

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:24, marginBottom:24 }}>
              
              {/* 1. Hero KPI Cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                <div style={{ background:'linear-gradient(135deg, #1e5c3b, #143d27)', borderRadius:16, padding:20, color:'#fff', boxShadow:'0 4px 20px rgba(30,92,59,0.2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, opacity:0.8, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                    <FileText size={16} /> รายงานวันนี้
                  </div>
                  <div style={{ fontSize:36, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', lineHeight:1 }}>{todayRpts.length}</div>
                </div>
                <div style={{ background:todayIssues>0 ? 'linear-gradient(135deg, #d32f2f, #9a0007)' : 'linear-gradient(135deg, #2e7d32, #1b5e20)', borderRadius:16, padding:20, color:'#fff', boxShadow:todayIssues>0 ? '0 4px 20px rgba(211,47,47,0.3)' : '0 4px 20px rgba(46,125,50,0.2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, opacity:0.8, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                    <ShieldCheck size={16} /> สถานะเครือข่าย
                  </div>
                  <div style={{ fontSize:28, fontWeight:700, lineHeight:1.3 }}>{todayIssues>0 ? `⚠ ${todayIssues} ปัญหาด่วน` : '🟢 ปกติทั้งหมด'}</div>
                </div>
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20, boxShadow:'0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#a89f8c', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                    <TrendingDown size={16} /> ปัญหาด่วนในเดือนนี้
                  </div>
                  <div style={{ fontSize:36, fontWeight:700, color:'#252018', fontFamily:'IBM Plex Mono,monospace', lineHeight:1 }}>{monthIssues}</div>
                </div>
              </div>

              {/* 2. School Status Cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:16 }}>
                {allSchools.map(s => {
                  const sRpts = todayRpts.filter(r => r.schoolId === s.id);
                  const hasMorn = sRpts.some(r => r.shift === 'morning');
                  const hasAftn = sRpts.some(r => r.shift === 'afternoon');
                  const issues = sRpts.filter(r => !r.isNormal).length;
                  const stColor = issues > 0 ? '#d32f2f' : (hasMorn || hasAftn ? '#2e7d32' : '#a89f8c');
                  const stBg = issues > 0 ? '#fde8e8' : (hasMorn || hasAftn ? '#e8f5e9' : '#f3f0e8');

                  return (
                    <div key={s.id} style={{ background:'#fff', border:`1px solid ${stColor}40`, borderLeft:`4px solid ${stColor}`, borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:issues>0?'0 0 15px rgba(211,47,47,0.15)':'none' }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, color:'#252018', marginBottom:4 }}>{s.name}</div>
                        <div style={{ display:'flex', gap:8, fontSize:12, color:'#574f44' }}>
                          <span style={{ opacity:hasMorn?1:0.4 }}>🌅 เช้า {hasMorn?'✓':'—'}</span>
                          <span style={{ opacity:hasAftn?1:0.4 }}>🌇 บ่าย {hasAftn?'✓':'—'}</span>
                        </div>
                      </div>
                      <div style={{ background:stBg, color:stColor, padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>
                        {issues > 0 ? `⚠ ${issues} ปัญหา` : (hasMorn || hasAftn ? '✓ ปกติ' : '⏳ รอรายงาน')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:20 }}>
                {/* 3. Trend Chart */}
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:20 }}>📈 สถิติการรายงานย้อนหลัง 7 วัน</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:180, paddingBottom:10, position:'relative', zIndex:1 }}>
                    <div style={{ position:'absolute', top:20, bottom:10, left:0, right:0, display:'flex', flexDirection:'column', justifyContent:'space-between', zIndex:-1 }}>
                      {[...Array(4)].map((_,i) => <div key={i} style={{ borderBottom:'1px dashed #e5e0d4', width:'100%' }} />)}
                    </div>
                    {last7.map(d => {
                      const count = allRpts.filter(r=>r.date===d).length;
                      const thd = new Date(d);
                      const ht = Math.max(5, (count / maxRep) * 150);
                      return (
                        <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                          <div title={`การรายงานวันที่ ${thd.toLocaleDateString('th-TH')}: ${count} รายการ`} 
                               style={{ width:'100%', maxWidth:40, height:ht, background:d===td?'linear-gradient(to top, #1e5c3b, #4fa374)':'linear-gradient(to top, #e5e0d4, #f3f0e8)', borderRadius:'6px 6px 0 0', position:'relative', transition:'all .2s ease', cursor:'pointer' }}
                               onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                               onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                          >
                            <span style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', fontSize:11, fontWeight:700, color:d===td?'#1e5c3b':'#574f44' }}>{count}</span>
                          </div>
                          <div style={{ fontSize:10, color:'#a89f8c', fontWeight:d===td?700:400 }}>{thd.getDate()}/{thd.getMonth()+1}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Live Activity Feed */}
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20, display:'flex', flexDirection:'column' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:16 }}>⚡ ความเคลื่อนไหวล่าสุดวันนี้</div>
                  <div style={{ flex:1, overflowY:'auto', maxHeight:250, paddingRight:10 }}>
                    {todayRpts.length === 0 ? (
                      <div style={{ textAlign:'center', color:'#a89f8c', padding:'30px 0', fontSize:13 }}>ยังไม่มีรายงานในวันนี้</div>
                    ) : (
                      todayRpts.sort((a,b)=>b.timestamp-a.timestamp).map(r => (
                        <div key={r.id} style={{ display:'flex', gap:12, marginBottom:16 }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:r.isNormal?'#2e7d32':'#d32f2f', outline:r.isNormal?'3px solid #e8f5e9':'3px solid #fde8e8' }}/>
                            <div style={{ width:2, background:'#f3f0e8', flex:1, margin:'4px 0' }}/>
                          </div>
                          <div style={{ flex:1, paddingBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:r.isNormal?'#252018':'#d32f2f' }}>{r.isNormal?'ส่งรายงานเวร':'แจ้งพบปัญหาเตือนภัย'}</span>
                              <span style={{ fontSize:11, color:'#a89f8c', fontFamily:'IBM Plex Mono,monospace' }}>{r.time} น.</span>
                            </div>
                            <div style={{ fontSize:12, color:'#574f44', marginBottom:4 }}>{allSchools.find(s=>s.id===r.schoolId)?.shortName} · กะ{r.shift==='morning'?'เช้า':'บ่าย'} · โดย {allUsers.find(u=>u.id===r.reporterId)?.name || r.sign}</div>
                            {!r.isNormal && (
                              <div style={{ background:'#fff8e1', border:'1px solid #f5d06e', borderRadius:6, padding:'6px 10px', fontSize:11, color:'#8a6000', marginTop:4 }}>
                                {r.areas.filter(a=>a.status==='issue').map(a=>a.area).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                      : <span style={{ background:'#faf8f4', color:'#a89f8c', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>⏳ ยังไม่รายงาน</span>
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
