import React, { useState } from 'react';
import { load, K, DutyReport, School, AppUser, fmtDate } from '../lib/store';
import { deleteReport } from '../lib/firebase';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';
import { Eye, Trash2, ChevronLeft, ChevronRight, Inbox, X } from 'lucide-react';

const PER = 20;
interface Props { schoolId: string; user: AppUser; }

export default function History({ schoolId, user }: Props) {
  const [fd, setFd]       = useState('');
  const [fsh, setFsh]     = useState('');
  const [pg, setPg]       = useState(1);
  const [detail, setDetail] = useState<DutyReport|null>(null);

  const users   = load<AppUser>(K.users);
  const schools = load<School>(K.schools);
  const school  = schools.find(s => s.id === schoolId);

  const schoolIds = user.role === 'director' ? schools.map(s => s.id) : [schoolId];
  let res = load<DutyReport>(K.reports).filter(r => schoolIds.includes(r.schoolId));
  if (fd)  res = res.filter(r => r.date === fd);
  if (fsh) res = res.filter(r => r.shift === fsh);
  res.sort((a, b) => b.timestamp - a.timestamp);

  const pages = Math.max(1, Math.ceil(res.length / PER));
  const slice = res.slice((pg - 1) * PER, pg * PER);

  const del = async (id: string) => {
    if (!confirm('ลบรายงานนี้?')) return;
    try {
      await deleteReport(id);
      toast('ลบรายงานแล้ว', 'warn');
    } catch (err) {
      toast('ลบไม่สำเร็จ: ' + (err as any)?.message, 'err');
    }
  };

  const isAdmin = user.role === 'admin' || user.role === 'director';

  return (
    <div>
      <PageHeader
        title="ประวัติการรายงาน"
        subtitle={`${user.role === 'director' ? 'ทั้งเครือข่าย' : school?.name || ''} · ${res.length} รายการ`}
      />

      <div style={{ padding:24 }}>

        {/* Filter Bar */}
        <div style={{ background:'#fff', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-lg)', padding:'14px 18px', marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end', boxShadow:'var(--shadow-xs)' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--neutral-400)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>วันที่</div>
            <input type="date" value={fd} onChange={e => { setFd(e.target.value); setPg(1); }}
              className="field-input" style={{ width:165 }}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--neutral-400)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>กะ</div>
            <select value={fsh} onChange={e => { setFsh(e.target.value); setPg(1); }}
              className="field-input" style={{ width:145 }}>
              <option value="">ทั้งหมด</option>
              <option value="morning">🌅 กะเช้า</option>
              <option value="afternoon">🌇 กะบ่าย</option>
            </select>
          </div>
          <button onClick={() => { setFd(''); setFsh(''); setPg(1); }}
            className="btn-ghost" style={{ padding:'8px 14px', fontSize:13, alignSelf:'flex-end' }}>
            ล้าง
          </button>
          {res.length < load<DutyReport>(K.reports).filter(r => schoolIds.includes(r.schoolId)).length && (
            <span style={{ fontSize:12, color:'var(--brand-600)', alignSelf:'flex-end', fontWeight:600, background:'var(--brand-50)', padding:'5px 12px', borderRadius:20 }}>
              กรองแล้ว: {res.length} รายการ
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{ background:'#fff', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-xs)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={{ background:'var(--neutral-50)' }}>
                  {(user.role === 'director'
                    ? ['วันที่','โรงเรียน','กะ','เวลา','ผู้รายงาน','สถานะ','']
                    : ['วันที่','กะ','เวลา','ผู้รายงาน','สถานะ','']
                  ).map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:'var(--neutral-400)', letterSpacing:'.07em', textTransform:'uppercase', padding:'11px 16px', borderBottom:'2px solid var(--neutral-100)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!slice.length ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Inbox size={36}/>
                        <p>ไม่พบรายการ{fd || fsh ? ' ที่ตรงกับตัวกรองนี้' : ''}</p>
                      </div>
                    </td>
                  </tr>
                ) : slice.map(r => {
                  const rep    = users.find(u => u.id === r.reporterId);
                  const sc     = schools.find(s => s.id === r.schoolId);
                  const issues = r.areas.filter(a => a.status === 'issue');
                  const schoolColor = r.schoolId === 's1' ? 'var(--school-s1)' : 'var(--school-s2)';
                  return (
                    <tr key={r.id} className="tbl-row" style={{ borderBottom:'1px solid var(--neutral-50)' }}>
                      <td style={{ padding:'11px 16px', color:'var(--neutral-700)', fontWeight:500, fontFamily:'IBM Plex Mono,monospace', fontSize:13 }}>{fmtDate(r.date)}</td>
                      {user.role === 'director' && (
                        <td style={{ padding:'11px 16px' }}>
                          <span style={{ fontSize:12, color:schoolColor, fontWeight:700, background:r.schoolId==='s1'?'var(--brand-50)':'#eff4fb', padding:'2px 9px', borderRadius:20 }}>
                            {sc?.shortName}
                          </span>
                        </td>
                      )}
                      <td style={{ padding:'11px 16px' }}>
                        <span className={`badge ${r.shift === 'morning' ? 's-morning' : 's-afternoon'}`}>
                          {r.shift === 'morning' ? '🌅 เช้า' : '🌇 บ่าย'}
                        </span>
                      </td>
                      <td style={{ padding:'11px 16px', color:'var(--neutral-400)', fontFamily:'IBM Plex Mono,monospace', fontSize:13 }}>{r.time} น.</td>
                      <td style={{ padding:'11px 16px', color:'var(--neutral-600)', fontSize:13 }}>{rep?.name || r.sign || '—'}</td>
                      <td style={{ padding:'11px 16px' }}>
                        <span className={`badge ${r.isNormal ? 's-ok' : 's-err'}`}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:r.isNormal?'var(--ok)':'var(--err)', flexShrink:0 }}/>
                          {r.isNormal ? 'ปกติ' : `${issues.length} ปัญหา`}
                        </span>
                      </td>
                      <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => setDetail(r)}
                            style={{ display:'flex', alignItems:'center', gap:5, background:'var(--neutral-50)', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-sm)', padding:'5px 10px', fontSize:12, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)', transition:'all .15s' }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background='var(--brand-50)'; (e.currentTarget as HTMLElement).style.color='var(--brand-600)'; (e.currentTarget as HTMLElement).style.borderColor='var(--brand-200)'; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background='var(--neutral-50)'; (e.currentTarget as HTMLElement).style.color='var(--neutral-600)'; (e.currentTarget as HTMLElement).style.borderColor='var(--neutral-100)'; }}>
                            <Eye size={13}/> ดู
                          </button>
                          {isAdmin && (
                            <button onClick={() => del(r.id)}
                              style={{ display:'flex', alignItems:'center', gap:5, background:'var(--err-bg)', border:'1px solid rgba(183,28,28,.2)', borderRadius:'var(--r-sm)', padding:'5px 10px', fontSize:12, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--err)', transition:'all .15s' }}
                              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background='#fcc'; }}
                              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background='var(--err-bg)'; }}>
                              <Trash2 size={13}/> ลบ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'12px 16px', borderTop:'1px solid var(--neutral-100)', background:'var(--neutral-50)' }}>
              <button onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg <= 1}
                style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-sm)', padding:'6px 12px', fontSize:13, cursor:pg<=1?'not-allowed':'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)', opacity:pg<=1?.4:1, transition:'all .15s' }}>
                <ChevronLeft size={14}/> ก่อนหน้า
              </button>
              <span style={{ fontSize:12, color:'var(--neutral-400)', background:'#fff', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-sm)', padding:'6px 14px' }}>
                {pg} / {pages}
              </span>
              <button onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg >= pages}
                style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-sm)', padding:'6px 12px', fontSize:13, cursor:pg>=pages?'not-allowed':'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)', opacity:pg>=pages?.4:1, transition:'all .15s' }}>
                ถัดไป <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal-card" style={{ padding:28 }}>
            {/* Modal Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--neutral-700)', letterSpacing:'-.01em' }}>รายละเอียดรายงาน</div>
                <div style={{ fontSize:12, color:'var(--neutral-400)', marginTop:2 }}>{fmtDate(detail.date)} · {detail.shift === 'morning' ? 'กะเช้า' : 'กะบ่าย'}</div>
              </div>
              <button onClick={() => setDetail(null)}
                style={{ background:'var(--neutral-50)', border:'1px solid var(--neutral-100)', borderRadius:'var(--r-sm)', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--neutral-400)', transition:'all .15s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background='var(--err-bg)'; (e.currentTarget as HTMLElement).style.color='var(--err)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background='var(--neutral-50)'; (e.currentTarget as HTMLElement).style.color='var(--neutral-400)'; }}>
                <X size={15}/>
              </button>
            </div>

            {/* Info grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              {[
                ['โรงเรียน', schools.find(s => s.id === detail.schoolId)?.name || ''],
                ['ผู้รายงาน', users.find(u => u.id === detail.reporterId)?.name || detail.sign],
                ['เวลา', `${detail.time} น.`],
                ['กะ', detail.shift === 'morning' ? '🌅 กะเช้า' : '🌇 กะบ่าย'],
              ].map(([k, v]) => (
                <div key={k} style={{ background:'var(--neutral-50)', borderRadius:'var(--r-sm)', padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--neutral-400)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--neutral-700)' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Area checklist */}
            <div style={{ fontSize:11, fontWeight:700, color:'var(--neutral-400)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>สถานะแต่ละจุด</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:16 }}>
              {detail.areas.map(a => (
                <div key={a.area} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:a.status==='issue'?'var(--err-bg)':'var(--brand-50)', borderRadius:'var(--r-sm)', border:`1px solid ${a.status==='issue'?'rgba(183,28,28,.2)':'var(--brand-100)'}` }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{a.area}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {a.note && <span style={{ fontSize:11, color:'var(--warn)' }}>{a.note}</span>}
                    <span className={`badge ${a.status==='issue'?'s-err':'s-ok'}`} style={{ fontSize:10 }}>
                      {a.status === 'issue' ? '⚠ พบปัญหา' : '✓ ปกติ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Note */}
            {detail.note && (
              <div style={{ background:'var(--neutral-50)', borderRadius:'var(--r-md)', padding:'12px 14px', fontSize:13, color:'var(--neutral-600)', marginBottom:16, borderLeft:'3px solid var(--brand-300)' }}>
                {detail.note}
              </div>
            )}

            {/* Photos */}
            {detail.photos && detail.photos.length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--neutral-400)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>
                  รูปภาพแนบ ({detail.photos.length} รูป)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                  {detail.photos.map((p: any, i: number) => (
                    <div key={i} style={{ position:'relative', borderRadius:'var(--r-md)', overflow:'hidden', aspectRatio:'4/3', border:'1px solid var(--neutral-100)', cursor:'pointer', transition:'transform .15s' }}
                      onClick={() => window.open(p.data, '_blank')}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                      <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      {p.camId && (
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.7))', padding:'12px 6px 4px' }}>
                          <span style={{ fontSize:9, color:'#fff', fontFamily:'IBM Plex Mono,monospace' }}>{p.camId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
