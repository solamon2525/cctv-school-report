import React, { useState, useEffect, useRef } from 'react';
import { load, save, K, Camera, Teacher, Inspection, CamRecord, CamStatus, Urgency, Shift, zoneLbl, stLbl, today, nowTime } from '../lib/store';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';

const tabs = ['ข้อมูลทั่วไป','ตรวจกล้อง','รูปภาพ','บันทึก & ยืนยัน'] as const;
type Tab = typeof tabs[number];

export default function NewInspection({ onNav, setDirty }: { onNav:(p:any)=>void; setDirty:(v:boolean)=>void }) {
  const cams = load<Camera>(K.cams).filter(c => c.schoolId === schoolId);
  const teachers = load<Teacher>(K.teachers);
  const [tab, setTab] = useState<Tab>('ข้อมูลทั่วไป');
  const [teacherId, setTeacherId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [shift, setShift] = useState<Shift>('morning');
  const [camCD, setCamCD] = useState<Record<string,{status:CamStatus;note:string}>>(() =>
    Object.fromEntries(cams.map(c => [c.id, { status:'ok', note:'' }]))
  );
  const [photos, setPhotos] = useState<{name:string;data:string}[]>([]);
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('none');
  const [sign, setSign] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDirty(true); return () => setDirty(false); }, []);

  const updCam = (id:string, field:'status'|'note', val:string) => setCamCD(p => ({ ...p, [id]:{ ...p[id], [field]:val } }));
  const setAllOk = () => setCamCD(Object.fromEntries(cams.map(c => [c.id, { status:'ok' as CamStatus, note:'' }])));

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]).slice(0, 10-photos.length);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPhotos(p => [...p, { name:f.name, data:ev.target?.result as string }]);
      r.readAsDataURL(f);
    });
  };

  const camIssues = Object.entries(camCD).filter(([,v]) => v.status !== 'ok');
  const okCount = Object.values(camCD).filter(v => v.status === 'ok').length;

  const save_ = () => {
    if (!teacherId || !date) { toast('กรุณาเลือกครูเวร และวันที่','err'); setTab('ข้อมูลทั่วไป'); return; }
    const ins = load<Inspection>(K.inspections);
    const ni: Inspection = {
      id:'i'+Date.now(), date, shift, schoolId, teacherId, time,
      cameras: cams.map(c => ({ id:c.id, status:camCD[c.id]?.status||'ok', note:camCD[c.id]?.note||'' })),
      photos, notes, urgency, sign, resolved:false,
      timestamp: new Date(date+'T'+(time||'00:00')).getTime(),
    };
    ins.push(ni);
    save(K.inspections, ins);
    const updCams = load<Camera>(K.cams).map(c => ({ ...c, status: camCD[c.id]?.status||c.status }));
    save(K.cams, updCams);
    setDirty(false);
    toast('บันทึกการตรวจสำเร็จ ✓','ok');
    setTimeout(() => onNav('dashboard'), 1000);
  };

  const stColor = (s:CamStatus) => ({ ok:'var(--ok)', warning:'var(--warn)', error:'var(--err)', offline:'var(--neutral-400)' }[s]);

  return (
    <div>
      <PageHeader title="บันทึกการตรวจ" subtitle="กรอกรายละเอียดการตรวจกล้องวงจรปิด">
        <button onClick={() => onNav('dashboard')} style={{ background:'none', border:'1px solid var(--neutral-200)', borderRadius:7, padding:'7px 14px', fontSize:13, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)' }}>ยกเลิก</button>
      </PageHeader>

      {/* Tab bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid var(--neutral-100)', display:'flex', padding:'0 24px', gap:2 }}>
        {tabs.map((t,i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'10px 16px', fontSize:14, fontWeight: tab===t ? 600 : 400,
            color: tab===t ? 'var(--brand-600)' : 'var(--neutral-400)',
            borderBottom: tab===t ? '2px solid var(--brand-600)' : '2px solid transparent',
            background:'none', border:'none', cursor:'pointer', fontFamily:'Sarabun,sans-serif', whiteSpace:'nowrap',
          }}>
            <span style={{ marginRight:5 }}>{['①','②','③','④'][i]}</span>{t}
          </button>
        ))}
      </div>

      <div style={{ padding:24, maxWidth:900 }}>

        {/* ── Tab 1 ── */}
        {tab==='ข้อมูลทั่วไป' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>ครูเวร *</label>
                <select value={teacherId} onChange={e=>{setTeacherId(e.target.value);setDirty(true);}} style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none' }}>
                  <option value="">— เลือกครูเวร —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>วันที่ตรวจ *</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>เวลา</label>
                <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none' }}/>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>กะการตรวจ *</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {(['morning','afternoon'] as Shift[]).map(s => (
                  <button key={s} onClick={() => { setShift(s); setDirty(true); }} style={{
                    border: `2px solid ${shift===s ? 'var(--brand-600)' : 'var(--neutral-100)'}`,
                    background: shift===s ? 'var(--brand-50)' : '#fff',
                    borderRadius:10, padding:'16px 12px', cursor:'pointer', textAlign:'center', transition:'all .15s',
                  }}>
                    <div style={{ fontSize:28, marginBottom:4 }}>{s==='morning'?'🌅':'🌇'}</div>
                    <div style={{ fontSize:14, fontWeight:700, color: shift===s ? 'var(--brand-700)' : 'var(--neutral-600)', fontFamily:'Sarabun,sans-serif' }}>{s==='morning'?'เช้า':'บ่าย'}</div>
                    <div style={{ fontSize:11, color:'var(--neutral-400)', fontFamily:'Sarabun,sans-serif' }}>{s==='morning'?'07:00–12:00':'12:00–17:00'} น.</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'span 2', display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setTab('ตรวจกล้อง')} style={{ background:'var(--brand-600)', color:'#faf8f4', border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>ถัดไป: ตรวจกล้อง →</button>
            </div>
          </div>
        )}

        {/* ── Tab 2 ── */}
        {tab==='ตรวจกล้อง' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:13, color:'var(--neutral-400)' }}>ปกติ <b style={{color:'var(--ok)'}}>{okCount}</b> / ผิดปกติ <b style={{color:'var(--err)'}}>{camIssues.length}</b> จาก {cams.length} ตัว</div>
              <button onClick={setAllOk} style={{ background:'var(--brand-50)', color:'var(--brand-700)', border:'1px solid var(--brand-200)', borderRadius:7, padding:'6px 14px', fontSize:13, cursor:'pointer', fontFamily:'Sarabun,sans-serif', fontWeight:600 }}>✓ ทั้งหมดปกติ</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {cams.map(c => (
                <div key={c.id} style={{ background:'#fff', border:'1px solid var(--neutral-100)', borderLeft:`3px solid ${stColor(camCD[c.id]?.status||'ok')}`, borderRadius:8, padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr auto auto', gap:10, alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}><span className="mono" style={{fontSize:11,color:'var(--neutral-300)',marginRight:6}}>{c.id}</span>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--neutral-400)' }}>📍 {c.location} · {zoneLbl[c.zone]}</div>
                  </div>
                  <select value={camCD[c.id]?.status||'ok'} onChange={e=>updCam(c.id,'status',e.target.value)} style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:6, padding:'5px 9px', fontFamily:'Sarabun,sans-serif', fontSize:12, cursor:'pointer', outline:'none', color:stColor(camCD[c.id]?.status||'ok') }}>
                    <option value="ok">✓ ปกติ</option>
                    <option value="warning">⚠ ผิดปกติ</option>
                    <option value="error">✗ ไม่มีสัญญาณ</option>
                    <option value="offline">— ปิดใช้งาน</option>
                  </select>
                  <input value={camCD[c.id]?.note||''} onInput={e=>updCam(c.id,'note',(e.target as HTMLInputElement).value)} placeholder="หมายเหตุ..." style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:6, padding:'5px 9px', fontFamily:'Sarabun,sans-serif', fontSize:12, width:160, outline:'none', color:'var(--neutral-700)' }}/>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <button onClick={() => setTab('ข้อมูลทั่วไป')} style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 18px', fontSize:14, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)' }}>← ย้อนกลับ</button>
              <button onClick={() => setTab('รูปภาพ')} style={{ background:'var(--brand-600)', color:'#faf8f4', border:'none', borderRadius:8, padding:'9px 20px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>ถัดไป: รูปภาพ →</button>
            </div>
          </div>
        )}

        {/* ── Tab 3 ── */}
        {tab==='รูปภาพ' && (
          <div>
            <div onClick={() => fileRef.current?.click()} style={{ border:'2px dashed var(--neutral-200)', borderRadius:12, padding:'28px', textAlign:'center', cursor:'pointer', background:'var(--neutral-0)', transition:'border-color .15s' }}>
              <div style={{ fontSize:38, marginBottom:8 }}>📷</div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--neutral-600)' }}>คลิกเพื่ออัพโหลดรูปภาพ</div>
              <div style={{ fontSize:12, color:'var(--neutral-400)', marginTop:4 }}>JPG, PNG — สูงสุด 10 รูป · เหลือได้อีก {10-photos.length} รูป</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:'none' }}/>
            {photos.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8, marginTop:12 }}>
                {photos.map((p,i) => (
                  <div key={i} style={{ aspectRatio:'1', borderRadius:8, overflow:'hidden', position:'relative', border:'1px solid var(--neutral-100)' }}>
                    <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    <button onClick={() => setPhotos(ps => ps.filter((_,j)=>j!==i))} style={{ position:'absolute', top:3, right:3, width:18, height:18, borderRadius:'50%', background:'rgba(30,30,30,.65)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <button onClick={() => setTab('ตรวจกล้อง')} style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 18px', fontSize:14, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)' }}>← ย้อนกลับ</button>
              <button onClick={() => setTab('บันทึก & ยืนยัน')} style={{ background:'var(--brand-600)', color:'#faf8f4', border:'none', borderRadius:8, padding:'9px 20px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>ถัดไป: บันทึก →</button>
            </div>
          </div>
        )}

        {/* ── Tab 4 ── */}
        {tab==='บันทึก & ยืนยัน' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>บันทึก / สิ่งผิดปกติ</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={6} placeholder="บันทึกสิ่งที่พบระหว่างการตรวจ..." style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none', resize:'vertical' }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>ระดับความเร่งด่วน</label>
                <select value={urgency} onChange={e=>setUrgency(e.target.value as Urgency)} style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none' }}>
                  <option value="none">— ไม่มีปัญหา</option>
                  <option value="low">ต่ำ — แจ้งเพื่อทราบ</option>
                  <option value="medium">ปานกลาง — ดำเนินการภายใน 3 วัน</option>
                  <option value="high">สูง — ดำเนินการด่วน</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--neutral-500)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>ลายเซ็นดิจิทัล</label>
                <input value={sign} onChange={e=>setSign(e.target.value)} placeholder="พิมพ์ชื่อเพื่อยืนยัน..." style={{ width:'100%', background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'var(--neutral-700)', outline:'none' }}/>
              </div>
            </div>
            <div style={{ background:'var(--neutral-0)', border:'1px solid var(--neutral-100)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--neutral-500)', marginBottom:12 }}>สรุปก่อนบันทึก</div>
              {[['กล้องปกติ', `${okCount} ตัว`, 'var(--ok)'], ['มีปัญหา', `${camIssues.length} ตัว`, camIssues.length?'var(--err)':'var(--ok)'], ['รูปภาพ', `${photos.length} รูป`, 'var(--info)']].map(([k,v,c]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--neutral-100)', fontSize:13 }}>
                  <span style={{ color:'var(--neutral-500)' }}>{k}</span>
                  <span style={{ fontWeight:600, color:c }}>{v}</span>
                </div>
              ))}
              {camIssues.slice(0,4).map(([id,v]) => (
                <div key={id} style={{ fontSize:12, color:'var(--warn)', padding:'2px 0' }}>{id}: {stLbl[v.status as CamStatus]}{v.note?' — '+v.note:''}</div>
              ))}
              {camIssues.length > 4 && <div style={{ fontSize:11, color:'var(--neutral-400)' }}>+{camIssues.length-4} รายการอื่น</div>}
            </div>
            <div style={{ gridColumn:'span 2', display:'flex', justifyContent:'space-between' }}>
              <button onClick={() => setTab('รูปภาพ')} style={{ background:'#fff', border:'1px solid var(--neutral-200)', borderRadius:8, padding:'10px 18px', fontSize:14, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'var(--neutral-600)' }}>← ย้อนกลับ</button>
              <button onClick={save_} style={{ background:'var(--brand-600)', color:'#faf8f4', border:'none', borderRadius:8, padding:'10px 24px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif' }}>💾 บันทึกการตรวจ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
