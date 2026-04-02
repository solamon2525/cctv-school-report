import React, { useState } from 'react';
import { load, save, K, DutyReport, School, AppUser, fmtDate, today } from '../lib/store';
import { deleteReport } from '../lib/firebase';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';

const PER = 20;
interface Props { schoolId: string; user: AppUser; }

export default function History({ schoolId, user }: Props) {
  const [fd, setFd] = useState(''); const [fsh, setFsh] = useState(''); const [pg, setPg] = useState(1);
  const [detail, setDetail] = useState<DutyReport|null>(null);
  const users = load<AppUser>(K.users);
  const school = load<School>(K.schools).find(s=>s.id===schoolId);

  // Director sees all schools
  const schoolIds = user.role==='director' ? load<School>(K.schools).map(s=>s.id) : [schoolId];
  const rpts = load<DutyReport>(K.reports).filter(r=>schoolIds.includes(r.schoolId));
  let res = [...rpts];
  if (fd) res = res.filter(r=>r.date===fd);
  if (fsh) res = res.filter(r=>r.shift===fsh);
  res.sort((a,b)=>b.timestamp-a.timestamp);
  const pages = Math.max(1,Math.ceil(res.length/PER));
  const slice = res.slice((pg-1)*PER,pg*PER);
  const schools = load<School>(K.schools);

  const del = async (id:string) => {
    if (!confirm('ลบรายงานนี้?')) return;
    try {
      await deleteReport(id);
      toast('ลบรายงานแล้ว','warn');
    } catch (err) {
      console.error('Delete failed:', err);
      toast('ลบไม่สำเร็จ: ' + (err as any)?.message, 'err');
    }
  };

  const inp = (s?:React.CSSProperties):React.CSSProperties => ({background:'#fff',border:'1px solid #e5e0d4',borderRadius:7,padding:'8px 11px',fontFamily:'Sarabun,sans-serif',fontSize:14,color:'#252018',outline:'none',...s});

  return (
    <div>
      <PageHeader title="ประวัติการรายงาน" subtitle={`${user.role==='director'?'ทั้งเครือข่าย':school?.name||''} · ${rpts.length} รายการ`}/>
      <div style={{padding:24}}>
        <div style={{background:'#fff',border:'1px solid #e5e0d4',borderRadius:10,padding:'14px 18px',marginBottom:18,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div><div style={{fontSize:11,fontWeight:600,color:'#a89f8c',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>วันที่</div><input type="date" value={fd} onChange={e=>{setFd(e.target.value);setPg(1);}} style={inp({width:160})}/></div>
          <div><div style={{fontSize:11,fontWeight:600,color:'#a89f8c',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>กะ</div>
            <select value={fsh} onChange={e=>{setFsh(e.target.value);setPg(1);}} style={inp({width:140})}>
              <option value="">ทั้งหมด</option><option value="morning">🌅 เช้า</option><option value="afternoon">🌇 บ่าย</option>
            </select>
          </div>
          <button onClick={()=>{setFd('');setFsh('');setPg(1);}} style={{background:'#f3f0e8',border:'1px solid #e5e0d4',borderRadius:7,padding:'8px 14px',fontSize:13,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#574f44',alignSelf:'flex-end'}}>ล้าง</button>
          {res.length<rpts.length&&<span style={{fontSize:12,color:'#1e5c3b',alignSelf:'flex-end',fontWeight:600}}>กรองแล้ว: {res.length} รายการ</span>}
        </div>

        <div style={{background:'#fff',border:'1px solid #e5e0d4',borderRadius:10,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{background:'#faf8f4'}}>
                  {(user.role==='director'?['วันที่','โรงเรียน','กะ','เวลา','ผู้รายงาน','สถานะ','']:['วันที่','กะ','เวลา','ผู้รายงาน','สถานะ','']).map(h=>(
                    <th key={h} style={{textAlign:'left',fontSize:10,fontWeight:700,color:'#a89f8c',letterSpacing:'.07em',textTransform:'uppercase',padding:'10px 14px',borderBottom:'1px solid #e5e0d4'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!slice.length
                  ? <tr><td colSpan={7} style={{textAlign:'center',padding:'36px',color:'#a89f8c',fontSize:13}}>ไม่พบรายการ</td></tr>
                  : slice.map(r=>{
                      const rep=users.find(u=>u.id===r.reporterId);
                      const sc=schools.find(s=>s.id===r.schoolId);
                      const issues=r.areas.filter(a=>a.status==='issue');
                      return (
                        <tr key={r.id} style={{borderBottom:'1px solid #f3f0e8'}}>
                          <td style={{padding:'10px 14px',color:'#252018',fontWeight:500,fontFamily:'IBM Plex Mono,monospace',fontSize:13}}>{fmtDate(r.date)}</td>
                          {user.role==='director'&&<td style={{padding:'10px 14px'}}><span style={{fontSize:12,color:r.schoolId==='s1'?'#1e5c3b':'#1a4a7a',fontWeight:600}}>{sc?.shortName}</span></td>}
                          <td style={{padding:'10px 14px'}}>
                            <span style={{background:r.shift==='morning'?'#fff8e1':'#e8f0ff',color:r.shift==='morning'?'#8a6000':'#1a3a8a',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600}}>
                              {r.shift==='morning'?'🌅 เช้า':'🌇 บ่าย'}
                            </span>
                          </td>
                          <td style={{padding:'10px 14px',color:'#a89f8c',fontFamily:'IBM Plex Mono,monospace',fontSize:13}}>{r.time}</td>
                          <td style={{padding:'10px 14px',color:'#574f44',fontSize:13}}>{rep?.name||r.sign||'—'}</td>
                          <td style={{padding:'10px 14px'}}>
                            <span style={{background:r.isNormal?'#e8f5e9':'#fde8e8',color:r.isNormal?'#1b5e20':'#b71c1c',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700}}>
                              {r.isNormal?'✓ ปกติ':`⚠ ${issues.length} ปัญหา`}
                            </span>
                          </td>
                          <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
                            <button onClick={()=>setDetail(r)} style={{background:'#faf8f4',border:'1px solid #e5e0d4',borderRadius:6,padding:'4px 10px',fontSize:12,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#574f44',marginRight:5}}>ดู</button>
                            {(user.role==='admin'||user.role==='director')&&<button onClick={()=>del(r.id)} style={{background:'#fde8e8',border:'1px solid rgba(183,28,28,.2)',borderRadius:6,padding:'4px 10px',fontSize:12,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#b71c1c'}}>ลบ</button>}
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
          {pages>1&&(
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:'12px',borderTop:'1px solid #e5e0d4'}}>
              <button onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg<=1} style={{background:'#fff',border:'1px solid #e5e0d4',borderRadius:6,padding:'5px 12px',fontSize:13,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#574f44',opacity:pg<=1?.4:1}}>← ก่อนหน้า</button>
              <span style={{fontSize:13,color:'#a89f8c'}}>หน้า {pg}/{pages} ({res.length} รายการ)</span>
              <button onClick={()=>setPg(p=>Math.min(pages,p+1))} disabled={pg>=pages} style={{background:'#fff',border:'1px solid #e5e0d4',borderRadius:6,padding:'5px 12px',fontSize:13,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#574f44',opacity:pg>=pages?.4:1}}>ถัดไป →</button>
            </div>
          )}
        </div>
      </div>

      {detail&&(
        <div onClick={e=>e.target===e.currentTarget&&setDetail(null)} style={{position:'fixed',inset:0,background:'rgba(30,42,28,.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:'100%',maxWidth:540,maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:700}}>รายละเอียดรายงาน</div>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#a89f8c'}}>✕</button>
            </div>
            {[['วันที่',fmtDate(detail.date)],['โรงเรียน',schools.find(s=>s.id===detail.schoolId)?.name||''],['กะ',detail.shift==='morning'?'🌅 กะเช้า':'🌇 กะบ่าย'],['เวลา',detail.time],['ผู้รายงาน',users.find(u=>u.id===detail.reporterId)?.name||detail.sign]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f3f0e8',fontSize:13}}>
                <span style={{color:'#a89f8c'}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:14,marginBottom:8,fontSize:12,fontWeight:700,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em'}}>สถานะแต่ละจุด</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {detail.areas.map(a=>(
                <div key={a.area} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:a.status==='issue'?'#fde8e8':'#f0f7f2',borderRadius:7}}>
                  <span style={{fontSize:13,fontWeight:500}}>{a.area}</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    {a.note&&<span style={{fontSize:11,color:'#8a6000'}}>{a.note}</span>}
                    <span style={{fontSize:11,fontWeight:700,color:a.status==='issue'?'#b71c1c':'#1b5e20'}}>{a.status==='issue'?'⚠ พบปัญหา':'✓ ปกติ'}</span>
                  </div>
                </div>
              ))}
            </div>
            {detail.note&&<div style={{marginTop:12,background:'#faf8f4',borderRadius:8,padding:'10px 13px',fontSize:13,color:'#574f44'}}>{detail.note}</div>}
            {detail.photos && detail.photos.length>0 && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>📷 รูปภาพแนบ ({detail.photos.length} รูป)</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:7}}>
                  {detail.photos.map((p:any,i:number)=>(
                    <div key={i} style={{position:'relative',borderRadius:8,overflow:'hidden',aspectRatio:'4/3',border:'1px solid #e5e0d4',cursor:'pointer'}} onClick={()=>window.open(p.data,'_blank')}>
                      <img src={p.data} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      {p.camId&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,.6)',padding:'2px 6px',display:'flex',alignItems:'center',gap:4}}>
                        <span style={{fontSize:9,color:'#fff',fontFamily:'IBM Plex Mono,monospace'}}>{p.camId}</span>
                        {p.camName&&<span style={{fontSize:9,color:'rgba(255,255,255,.7)'}}>{p.camName}</span>}
                      </div>}
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
