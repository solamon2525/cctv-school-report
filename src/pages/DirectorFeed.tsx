import React from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate } from '../lib/store';
import PageHeader from '../components/PageHeader';
import { BookOpen } from 'lucide-react';

interface Props { user: AppUser; }

function FeedCard({ rpt, schools, users }: { rpt: DutyReport; schools: School[]; users: AppUser[] }) {
  const reporter = users.find(u => u.id === rpt.reporterId);
  const school   = schools.find(s => s.id === rpt.schoolId);
  const SC_C     = rpt.schoolId === 's1' ? 'var(--school-s1)' : 'var(--school-s2)';
  const SC_BG    = rpt.schoolId === 's1' ? 'var(--brand-50)'  : '#eff4fb';
  const issues   = rpt.areas.filter(a => a.status === 'issue');

  return (
    <div className="card card-hover fade-in" style={{
      borderLeft: `4px solid ${rpt.isNormal ? 'var(--ok)' : 'var(--err)'}`,
      marginBottom: 20,
      boxShadow: rpt.isNormal ? 'var(--shadow-xs)' : '0 4px 20px rgba(183,28,28,.1)',
      border: `1px solid ${rpt.isNormal ? 'var(--neutral-100)' : 'rgba(183,28,28,.25)'}`,
      borderLeftWidth: 4,
    }}>
      <div style={{ padding:20 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:42, height:42, background:SC_C, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0, boxShadow:'var(--shadow-sm)' }}>
              {school?.shortName?.slice(0,2) || 'รร'}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--neutral-700)' }}>{school?.name}</div>
              <div style={{ fontSize:12, color:'var(--neutral-500)', marginTop:2 }}>โดย {reporter?.name || rpt.sign}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
            <div style={{ fontSize:12, color:'var(--neutral-400)', fontFamily:'IBM Plex Mono,monospace' }}>{fmtDate(rpt.date)} · {rpt.time} น.</div>
            <span className={`badge ${rpt.shift === 'morning' ? 's-morning' : 's-afternoon'}`}>
              {rpt.shift === 'morning' ? '🌅 กะเช้า' : '🌇 กะบ่าย'}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        <div style={{
          background: rpt.isNormal ? 'var(--ok-bg)' : 'var(--err-bg)',
          border: `1px solid ${rpt.isNormal ? '#a5d6a7' : 'rgba(183,28,28,.25)'}`,
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          marginBottom: issues.length > 0 || rpt.note ? 14 : 0,
          display: 'flex', alignItems: 'center', gap:10,
        }}>
          <span style={{ fontSize:18 }}>{rpt.isNormal ? '✅' : '⚠️'}</span>
          <span style={{ fontSize:14, fontWeight:700, color: rpt.isNormal ? 'var(--ok)' : 'var(--err)' }}>
            {rpt.isNormal ? 'เหตุการณ์ปกติ ทุกจุดเรียบร้อยดี' : `พบปัญหา ${issues.length} จุด`}
          </span>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--err)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>จุดที่มีปัญหา</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {issues.map(a => (
                <div key={a.area} style={{ background:'#fff', border:'1px solid var(--warn-bg)', borderLeft:'3px solid var(--warn)', borderRadius:'var(--r-sm)', padding:'8px 12px', fontSize:13, color:'var(--warn)' }}>
                  <strong style={{ color:'var(--neutral-700)' }}>{a.area}</strong>
                  {a.note ? <span style={{ color:'var(--neutral-500)' }}> — {a.note}</span> : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {rpt.note && (
          <div style={{ background:'var(--neutral-50)', borderRadius:'var(--r-md)', padding:'10px 14px', fontSize:13, color:'var(--neutral-600)', marginBottom: rpt.photos?.length ? 14 : 0, borderLeft:'3px solid var(--brand-200)', lineHeight:1.6 }}>
            {rpt.note}
          </div>
        )}
      </div>

      {/* Photos */}
      {rpt.photos && rpt.photos.length > 0 && (
        <div style={{ borderTop:'1px solid var(--neutral-100)', padding:'14px 20px 20px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--neutral-400)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>
            รูปภาพ ({rpt.photos.length} รูป)
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8 }}>
            {rpt.photos.map((p: any, i: number) => (
              <div key={i}
                style={{ position:'relative', borderRadius:'var(--r-md)', overflow:'hidden', border:'1px solid var(--neutral-100)', cursor:'pointer', aspectRatio:'16/9', transition:'transform .15s, box-shadow .15s' }}
                onClick={() => window.open(p.data, '_blank')}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform='scale(1.03)'; el.style.boxShadow='var(--shadow-md)'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform='scale(1)'; el.style.boxShadow='none'; }}>
                <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                {p.camId && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,.75))', padding:'16px 8px 6px' }}>
                    <span style={{ fontSize:10, color:'#fff', fontFamily:'IBM Plex Mono,monospace', fontWeight:600 }}>{p.camId}</span>
                    {p.camName && <span style={{ fontSize:10, color:'rgba(255,255,255,.75)', marginLeft:5 }}>{p.camName}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DirectorFeed({ user }: Props) {
  const allReports = load<DutyReport>(K.reports).sort((a, b) => b.timestamp - a.timestamp);
  const schools    = load<School>(K.schools);
  const users      = load<AppUser>(K.users);

  return (
    <div>
      <PageHeader title="สมุดรายงาน" subtitle="รายงานการเข้าเวรโดยละเอียดพร้อมภาพอ้างอิงจากกล้องวงจรปิด"/>
      <div style={{ padding:24, maxWidth:860, margin:'0 auto' }}>
        {allReports.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={40}/>
            <p style={{ fontWeight:600, fontSize:14, color:'var(--neutral-600)' }}>ยังไม่มีรายงานในระบบ</p>
            <p>เมื่อครูส่งรายงานแล้ว จะแสดงที่นี่</p>
          </div>
        ) : (
          allReports.map(rpt => (
            <FeedCard key={rpt.id} rpt={rpt} schools={schools} users={users}/>
          ))
        )}
      </div>
    </div>
  );
}
