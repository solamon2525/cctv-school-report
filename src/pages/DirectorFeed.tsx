import React from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate } from '../lib/store';
import PageHeader from '../components/PageHeader';

interface Props { user: AppUser; }

function FeedCard({ rpt, schools, users }: { rpt: DutyReport; schools: School[]; users: AppUser[] }) {
  const reporter = users.find(u => u.id === rpt.reporterId);
  const school = schools.find(s => s.id === rpt.schoolId);
  const SC_C = rpt.schoolId === 's1' ? '#1e5c3b' : '#1a4a7a';
  const SHIFT_C = rpt.shift === 'morning' ? '#8a6000' : '#1a3a8a';
  const SHIFT_BG = rpt.shift === 'morning' ? '#fff8e1' : '#e8f0ff';
  
  const issues = rpt.areas.filter(a => a.status === 'issue');

  return (
    <div style={{ background:'#fff', border:`1px solid ${rpt.isNormal?'#e5e0d4':'rgba(183,28,28,.3)'}`, borderRadius:16, padding:'20px', marginBottom:20, boxShadow:rpt.isNormal?'0 4px 15px rgba(0,0,0,0.03)':'0 4px 20px rgba(183,28,28,0.08)' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ width:40, height:40, background:SC_C, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
            {school?.shortName?.slice(0,2) || 'Sc'}
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#252018' }}>{school?.name}</div>
            <div style={{ fontSize:12, color:'#574f44' }}>รายงานโดย: {reporter?.name || rpt.sign}</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, color:'#574f44', fontFamily:'IBM Plex Mono,monospace', marginBottom:2 }}>{fmtDate(rpt.date)} · {rpt.time} น.</div>
          <span style={{ background:SHIFT_BG, color:SHIFT_C, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
            {rpt.shift==='morning'?'🌅 กะเช้า':'🌇 กะบ่าย'}
          </span>
        </div>
      </div>

      {/* Main Status */}
      <div style={{ background:rpt.isNormal?'#e8f5e9':'#fde8e8', border:`1px solid ${rpt.isNormal?'#a5d6a7':'#ffcdd2'}`, borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{rpt.isNormal ? '✓' : '⚠'}</span>
        <div style={{ fontSize:14, fontWeight:700, color:rpt.isNormal?'#1b5e20':'#b71c1c' }}>
          {rpt.isNormal ? 'เหตุการณ์ปกติ ทุกจุดเรียบร้อยดี' : `พบปัญหาด้านความปลอดภัย ${issues.length} จุด`}
        </div>
      </div>

      {/* Issues list if not normal */}
      {issues.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#b71c1c', marginBottom:6 }}>รายละเอียดจุดที่มีปัญหา:</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {issues.map(a => (
              <div key={a.area} style={{ background:'#fff', border:'1px solid #f5d06e', borderRadius:6, padding:'8px 12px', fontSize:13, color:'#8a6000' }}>
                <strong>{a.area}</strong> {a.note ? `— ${a.note}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Note */}
      {rpt.note && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#574f44', marginBottom:6 }}>บันทึกเพิ่มเติม:</div>
          <div style={{ fontSize:14, color:'#252018', background:'#faf8f4', borderRadius:8, padding:'12px 14px', lineHeight:1.5 }}>
            {rpt.note}
          </div>
        </div>
      )}

      {/* Attached Photos (Large Grid) */}
      {rpt.photos && rpt.photos.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#574f44', marginBottom:10 }}>รูปภาพประกอบจากกล้องวงจรปิด ({rpt.photos.length} รูป):</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
            {rpt.photos.map((p:any, i:number) => (
              <div key={i} style={{ position:'relative', borderRadius:8, overflow:'hidden', border:'1px solid #e5e0d4', cursor:'pointer', aspectRatio:'16/9' }} onClick={()=>window.open(p.data,'_blank')}>
                <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                {p.camId && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,0.8))', padding:'15px 8px 6px 8px' }}>
                    <span style={{ fontSize:11, color:'#fff', fontFamily:'IBM Plex Mono,monospace', fontWeight:600 }}>{p.camId}</span>
                    {p.camName && <span style={{ fontSize:10, color:'rgba(255,255,255,.8)', marginLeft:6 }}>{p.camName}</span>}
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
  const allReports = load<DutyReport>(K.reports).sort((a,b) => b.timestamp - a.timestamp);
  const schools = load<School>(K.schools);
  const users = load<AppUser>(K.users);

  return (
    <div>
      <PageHeader title="สมุดรายงาน (Photo Feed)" subtitle="รายงานการเข้าเวรโดยละเอียดของครูทุกท่าน พร้อมภาพอ้างอิง" />
      
      <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
        {allReports.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#a89f8c' }}>
            <span style={{ fontSize:40, display:'block', marginBottom:16 }}>📭</span>
            <div style={{ fontSize:15, fontWeight:600 }}>ยังไม่มีรายงานในระบบ</div>
          </div>
        ) : (
          allReports.map(rpt => (
            <FeedCard key={rpt.id} rpt={rpt} schools={schools} users={users} />
          ))
        )}
      </div>
    </div>
  );
}
