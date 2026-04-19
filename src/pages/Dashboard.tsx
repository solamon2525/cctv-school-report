import React from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate, today } from '../lib/store';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import { FileText, ShieldCheck, TrendingDown, AlertCircle, CheckCircle2, Trophy, Users } from 'lucide-react';

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
          const monthRpts = allRpts.filter(r => r.date.startsWith(thisM));
          const monthIssues = monthRpts.filter(r => !r.isNormal).length;

          // Chart Data (Last 7 Days)
          const last7 = Array.from({length:7}, (_,i) => {
            const d = new Date(); d.setDate(d.getDate() - (6-i));
            return d.toISOString().slice(0,10);
          });
          const maxRep = Math.max(1, ...last7.map(d => allRpts.filter(r=>r.date===d).length));

          // --- Widget 4: Missing Reports ---
          const missing = allSchools.flatMap(s =>
            (['morning','afternoon'] as const).filter(shift =>
              !todayRpts.some(r => r.schoolId === s.id && r.shift === shift)
            ).map(shift => ({ school: s, shift }))
          );

          // --- Widget 3: Compliance Donut ---
          // Count working days passed in this month (Mon–Fri, up to today)
          const monthDays = (() => {
            const now = new Date(td);
            const start = new Date(thisM + '-01');
            const days: string[] = [];
            const cur = new Date(start);
            while (cur <= now) {
              const dow = cur.getDay();
              if (dow !== 0 && dow !== 6) days.push(cur.toISOString().slice(0,10));
              cur.setDate(cur.getDate() + 1);
            }
            return days;
          })();
          const complianceBySchool = allSchools.map(s => {
            const expected = monthDays.length * 2; // 2 shifts per day
            const submitted = new Set(
              monthRpts.filter(r => r.schoolId === s.id).map(r => `${r.date}_${r.shift}`)
            ).size;
            const pct = expected > 0 ? Math.round((submitted / expected) * 100) : 0;
            return { school: s, submitted, expected, pct };
          });

          // --- Widget 2: Area Issue Heatmap ---
          const areaIssueCount: Record<string,number> = {};
          monthRpts.forEach(r => r.areas.forEach(a => {
            if (a.status === 'issue') areaIssueCount[a.area] = (areaIssueCount[a.area]||0) + 1;
          }));
          const topAreas = Object.entries(areaIssueCount)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 8);
          const maxAreaCount = Math.max(1, topAreas[0]?.[1] || 1);

          // --- Widget 1: Monthly Calendar ---
          const calYear = parseInt(thisM.slice(0,4));
          const calMonth = parseInt(thisM.slice(5,7)) - 1;
          const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
          const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
          const calOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0

          // --- Widget 5: Reporter Stats ---
          const reporterCounts: Record<string,number> = {};
          monthRpts.forEach(r => {
            const key = r.reporterId || r.sign;
            reporterCounts[key] = (reporterCounts[key]||0) + 1;
          });
          const topReporters = Object.entries(reporterCounts)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 5)
            .map(([id, count]) => ({
              user: allUsers.find(u => u.id === id),
              sign: id,
              count,
            }));
          const maxReporterCount = Math.max(1, topReporters[0]?.count || 1);

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:24, marginBottom:24 }}>

              {/* Widget 4: Missing Reports Alert */}
              {missing.length > 0 ? (
                <div style={{ background:'#fffbf0', border:'1px solid #f5d06e', borderLeft:'4px solid #c4891a', borderRadius:12, padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <AlertCircle size={16} color="#c4891a" />
                    <span style={{ fontSize:14, fontWeight:700, color:'#8a6000' }}>ยังรอรายงานวันนี้ {missing.length} กะ</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {missing.map(({ school, shift }) => (
                      <div key={`${school.id}_${shift}`} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #f5d06e', borderRadius:8, padding:'5px 12px', fontSize:12 }}>
                        <span>{shift === 'morning' ? '🌅' : '🌇'}</span>
                        <span style={{ fontWeight:600, color:'#252018' }}>{school.shortName}</span>
                        <span style={{ color:'#c4891a', fontWeight:600 }}>กะ{shift === 'morning' ? 'เช้า' : 'บ่าย'}</span>
                        <span style={{ background:'#fde8e8', color:'#b71c1c', fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>ยังไม่ส่ง</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background:'#f0faf4', border:'1px solid #a5d6a7', borderLeft:'4px solid #2e7d32', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle2 size={16} color="#2e7d32" />
                  <span style={{ fontSize:14, fontWeight:600, color:'#1b5e20' }}>ส่งรายงานครบทุกกะแล้ววันนี้</span>
                </div>
              )}

              {/* Hero KPI Cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
                <DashboardCard
                  title="รายงานวันนี้"
                  value={todayRpts.length}
                  icon={<FileText size={18} />}
                  color="primary"
                  gradient
                />
                <DashboardCard
                  title="สถานะเครือข่าย"
                  value={todayIssues>0 ? `⚠ ${todayIssues}` : '🟢'}
                  subtitle={todayIssues>0 ? 'ปัญหาด่วน' : 'ปกติทั้งหมด'}
                  icon={<ShieldCheck size={18} />}
                  color={todayIssues>0 ? 'error' : 'success'}
                  gradient
                />
                <DashboardCard
                  title="ปัญหาด่วนในเดือนนี้"
                  value={monthIssues}
                  icon={<TrendingDown size={18} />}
                  color="warning"
                />
              </div>

              {/* School Status Cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:16 }}>
                {allSchools.map(s => {
                  const sRpts = todayRpts.filter(r => r.schoolId === s.id);
                  const hasMorn = sRpts.some(r => r.shift === 'morning');
                  const hasAftn = sRpts.some(r => r.shift === 'afternoon');
                  const issues = sRpts.filter(r => !r.isNormal).length;
                  const stColor = issues > 0 ? '#d32f2f' : (hasMorn || hasAftn ? '#2e7d32' : '#a89f8c');
                  const stBg = issues > 0 ? '#fde8e8' : (hasMorn || hasAftn ? '#e8f5e9' : '#f3f0e8');
                  return (
                    <div key={s.id} style={{ background:'rgba(255, 255, 255, 0.95)', border:`1px solid ${stColor}40`, borderLeft:`4px solid ${stColor}`, borderRadius:14, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:issues>0?'0 4px 12px rgba(225, 29, 72, 0.12)':'0 2px 8px rgba(0, 0, 0, 0.03)', transition:'all 0.3s ease' }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{s.name}</div>
                        <div style={{ display:'flex', gap:10, fontSize:12, color:'var(--text-secondary)' }}>
                          <span style={{ opacity:hasMorn?1:0.4 }}>🌅 เช้า {hasMorn?'✓':'—'}</span>
                          <span style={{ opacity:hasAftn?1:0.4 }}>🌇 บ่าย {hasAftn?'✓':'—'}</span>
                        </div>
                      </div>
                      <div style={{ background:stBg, color:stColor, padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:700 }}>
                        {issues > 0 ? `⚠ ${issues} ปัญหา` : (hasMorn || hasAftn ? '✓ ปกติ' : '⏳ รอรายงาน')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Widget 3: Compliance Donut + Widget 2: Area Heatmap */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20 }}>

                {/* Widget 3: Compliance Rate Donut */}
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:4 }}>อัตราการส่งรายงานเดือนนี้</div>
                  <div style={{ fontSize:11, color:'#a89f8c', marginBottom:20 }}>นับจากวันทำงาน (จ–ศ) × 2 กะ</div>
                  <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                    {complianceBySchool.map(({ school, submitted, expected, pct }) => {
                      const R = 42, cx = 55, cy = 55;
                      const circ = 2 * Math.PI * R;
                      const filled = (pct / 100) * circ;
                      const color = pct >= 80 ? '#2e7d32' : pct >= 50 ? '#c4891a' : '#b71c1c';
                      const schoolColor = school.id === 's1' ? '#1e5c3b' : '#1a4a7a';
                      return (
                        <div key={school.id} style={{ textAlign:'center' }}>
                          <svg width={110} height={110} viewBox="0 0 110 110">
                            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f0e8" strokeWidth={10}/>
                            <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={10}
                              strokeDasharray={`${filled} ${circ}`}
                              strokeDashoffset={circ * 0.25}
                              strokeLinecap="round"
                              style={{ transform:'rotate(-90deg)', transformOrigin:'55px 55px', transition:'stroke-dasharray .6s ease' }}
                            />
                            <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={700} fill={color} fontFamily="IBM Plex Mono,monospace">{pct}%</text>
                            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9.5} fill="#a89f8c" fontFamily="Sarabun,sans-serif">{submitted}/{expected} กะ</text>
                          </svg>
                          <div style={{ fontSize:12, fontWeight:700, color:schoolColor, marginTop:4 }}>{school.shortName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Widget 2: Area Issue Heatmap */}
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:4 }}>พื้นที่ที่มีปัญหาบ่อย</div>
                  <div style={{ fontSize:11, color:'#a89f8c', marginBottom:16 }}>รวมทั้งเครือข่าย เดือนนี้</div>
                  {topAreas.length === 0 ? (
                    <div style={{ textAlign:'center', color:'#a89f8c', padding:'24px 0', fontSize:13 }}>
                      <CheckCircle2 size={28} color="#a5d6a7" style={{ display:'block', margin:'0 auto 8px' }}/>
                      ไม่พบปัญหาในเดือนนี้
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                      {topAreas.map(([area, count]) => {
                        const pct = (count / maxAreaCount) * 100;
                        const barColor = pct > 66 ? '#b71c1c' : pct > 33 ? '#c4891a' : '#2e7d32';
                        const barBg = pct > 66 ? '#fde8e8' : pct > 33 ? '#fff8e1' : '#e8f5e9';
                        return (
                          <div key={area}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                              <span style={{ fontWeight:600, color:'#252018' }}>{area}</span>
                              <span style={{ color:barColor, fontWeight:700, fontFamily:'IBM Plex Mono,monospace' }}>{count} ครั้ง</span>
                            </div>
                            <div style={{ height:8, background:'#f3f0e8', borderRadius:4, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:4, transition:'width .4s ease' }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Widget 1: Monthly Compliance Calendar */}
              <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#252018' }}>ปฏิทินสรุปรายเดือน</div>
                  <div style={{ fontSize:12, color:'#a89f8c' }}>{new Date(calYear, calMonth).toLocaleDateString('th-TH', { month:'long', year:'numeric' })}</div>
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-start' }}>
                  {/* Calendar grid */}
                  <div style={{ flex:'1 1 280px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
                      {['จ','อ','พ','พฤ','ศ','ส','อา'].map(d => (
                        <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#a89f8c', padding:'2px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                      {Array.from({ length: calOffset }).map((_, i) => <div key={`e${i}`}/>)}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${thisM}-${String(dayNum).padStart(2,'0')}`;
                        const dayRpts = allRpts.filter(r => r.date === dateStr);
                        const isToday = dateStr === td;
                        const isFuture = dateStr > td;
                        const hasIssue = dayRpts.some(r => !r.isNormal);
                        const rptCount = dayRpts.length;
                        // Color coding
                        let bg = '#f3f0e8', border = 'transparent', textC = '#a89f8c';
                        if (!isFuture && rptCount > 0) {
                          if (hasIssue) { bg = '#fde8e8'; border = '#f5a5a5'; textC = '#b71c1c'; }
                          else { bg = '#e8f5e9'; border = '#a5d6a7'; textC = '#1b5e20'; }
                        }
                        if (isToday) { border = '#1e5c3b'; }
                        return (
                          <div key={dayNum} title={isFuture ? '' : rptCount > 0 ? `${rptCount} รายงาน` : 'ไม่มีรายงาน'}
                            style={{ aspectRatio:'1', background:bg, border:`1.5px solid ${border}`, borderRadius:6, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:rptCount>0?'default':'default', position:'relative' }}>
                            <span style={{ fontSize:11, fontWeight:isToday?800:500, color:textC }}>{dayNum}</span>
                            {rptCount > 0 && (
                              <div style={{ position:'absolute', bottom:2, display:'flex', gap:1.5 }}>
                                {Array.from({ length: Math.min(rptCount, 4) }).map((_,di) => (
                                  <div key={di} style={{ width:3, height:3, borderRadius:'50%', background:hasIssue?'#b71c1c':'#2e7d32' }}/>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:24, minWidth:140 }}>
                    {[
                      { color:'#e8f5e9', border:'#a5d6a7', text:'ปกติ ไม่มีปัญหา' },
                      { color:'#fde8e8', border:'#f5a5a5', text:'พบปัญหา' },
                      { color:'#f3f0e8', border:'transparent', text:'ไม่มีรายงาน' },
                    ].map(l => (
                      <div key={l.text} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#574f44' }}>
                        <div style={{ width:14, height:14, borderRadius:3, background:l.color, border:`1.5px solid ${l.border}`, flexShrink:0 }}/>
                        {l.text}
                      </div>
                    ))}
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#574f44' }}>
                      <div style={{ display:'flex', gap:2 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:'#2e7d32' }}/>)}
                      </div>
                      จำนวนรายงาน
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Chart + Widget 5: Reporter Stats + Activity Feed */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20 }}>

                {/* Trend Chart */}
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
                          <div title={`${thd.toLocaleDateString('th-TH')}: ${count} รายการ`}
                               style={{ width:'100%', maxWidth:40, height:ht, background:d===td?'linear-gradient(to top, #1e5c3b, #4fa374)':'linear-gradient(to top, #e5e0d4, #f3f0e8)', borderRadius:'6px 6px 0 0', position:'relative', transition:'all .2s ease', cursor:'pointer' }}
                               onMouseOver={e => e.currentTarget.style.filter='brightness(1.1)'}
                               onMouseOut={e => e.currentTarget.style.filter='brightness(1)'}>
                            <span style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', fontSize:11, fontWeight:700, color:d===td?'#1e5c3b':'#574f44' }}>{count}</span>
                          </div>
                          <div style={{ fontSize:10, color:'#a89f8c', fontWeight:d===td?700:400 }}>{thd.getDate()}/{thd.getMonth()+1}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Widget 5: Reporter Stats */}
                <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <Trophy size={16} color="#b8891a" />
                    <span style={{ fontSize:15, fontWeight:700, color:'#252018' }}>ครูที่รายงานมากที่สุด</span>
                  </div>
                  <div style={{ fontSize:11, color:'#a89f8c', marginBottom:16 }}>เดือนนี้ ทั้งเครือข่าย</div>
                  {topReporters.length === 0 ? (
                    <div style={{ textAlign:'center', color:'#a89f8c', padding:'24px 0', fontSize:13 }}>
                      <Users size={28} color="#ccc5b4" style={{ display:'block', margin:'0 auto 8px' }}/>
                      ยังไม่มีข้อมูลเดือนนี้
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {topReporters.map(({ user, sign, count }, idx) => {
                        const name = user?.name || sign;
                        const schoolColor = user?.schoolId === 's1' ? '#1e5c3b' : user?.schoolId === 's2' ? '#1a4a7a' : '#574f44';
                        const barPct = (count / maxReporterCount) * 100;
                        const medals = ['🥇','🥈','🥉'];
                        return (
                          <div key={sign} style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:16, width:22, textAlign:'center', flexShrink:0 }}>
                              {medals[idx] || <span style={{ fontSize:12, color:'#a89f8c', fontFamily:'IBM Plex Mono,monospace' }}>#{idx+1}</span>}
                            </span>
                            <div style={{ width:30, height:30, borderRadius:'50%', background:schoolColor+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:schoolColor, flexShrink:0 }}>
                              {name.split(' ').slice(-1)[0].slice(0,2)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                <span style={{ fontSize:12, fontWeight:600, color:'#252018', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{name.split(' ').slice(0,2).join(' ')}</span>
                                <span style={{ fontSize:11, fontWeight:700, color:schoolColor, fontFamily:'IBM Plex Mono,monospace', flexShrink:0 }}>{count}</span>
                              </div>
                              <div style={{ height:5, background:'#f3f0e8', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${barPct}%`, background:schoolColor, borderRadius:3, transition:'width .4s ease' }}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Live Activity Feed */}
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
                              <span style={{ fontSize:13, fontWeight:700, color:r.isNormal?'#252018':'#d32f2f' }}>{r.isNormal?'ส่งรายงานเวร':'แจ้งพบปัญหา'}</span>
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
