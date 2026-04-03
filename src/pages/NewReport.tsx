import React, { useState, useRef, useEffect } from 'react';
import { load, save, K, DutyReport, AreaReport, AppUser, School, DutySchedule,
  AREAS_KP, AREAS_HL, Shift, today, nowTime, fmtDate } from '../lib/store';
import { addReport, uploadReportPhoto } from '../lib/firebase';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';

interface Photo { name: string; data: string; camId?: string; camName?: string; }
interface Props { user: AppUser; onNav:(p:any)=>void; schoolId:string; }

export default function NewReport({ user, onNav, schoolId }: Props) {
  // Director can pick school
  const schools = load<School>(K.schools);
  const [activeSchool, setActiveSchool] = useState(schoolId);
  const school = schools.find(s => s.id === activeSchool);
  const areas0 = activeSchool === 's1' ? AREAS_KP : AREAS_HL;
  const cams   = load<any>(K.cams).filter((c:any) => c.schoolId === activeSchool);

  const getDefaultShift = (): Shift => new Date().getHours() < 12 ? 'morning' : 'afternoon';

  const [shift,    setShift]    = useState<Shift>(getDefaultShift);
  const [time,     setTime]     = useState(nowTime());
  const [areas,    setAreas]    = useState<AreaReport[]>(() => areas0.map(a=>({area:a,status:'ok',note:''})));

  // Bug #8: auto-update shift every minute in case form is left open past noon
  useEffect(() => {
    const id = setInterval(() => setShift(getDefaultShift()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [note,     setNote]     = useState('');
  const [sign,     setSign]     = useState(user.name);
  const [isNormal, setIsNormal] = useState(true);
  const [photos,   setPhotos]   = useState<Photo[]>([]);
  const [selCam,   setSelCam]   = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SCHOOL_C  = activeSchool === 's1' ? '#1e5c3b' : '#1a4a7a';
  const SCHOOL_BG = activeSchool === 's1' ? '#f0f7f2' : '#eff4fb';

  // Reset areas when school changes
  const handleSchoolChange = (sid: string) => {
    setActiveSchool(sid);
    const a0 = sid === 's1' ? AREAS_KP : AREAS_HL;
    setAreas(a0.map(a => ({ area:a, status:'ok', note:'' })));
    setShift(getDefaultShift()); // reset shift ตามเวลาปัจจุบัน
    setIsNormal(true);
    setNote('');
    setPhotos([]); setSelCam('');
  };

  const setNormalAll = () => {
    setAreas(areas0.map(a => ({ area:a, status:'ok', note:'' })));
    setNote('เหตุการณ์ปกติ นักเรียนและบุคลากรปลอดภัย สถานที่เรียบร้อยดี');
    setIsNormal(true);
    toast('✓ เหตุการณ์ปกติ', 'ok');
  };

  const updArea = (idx: number, field: 'status'|'note', val: string) => {
    setAreas(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      setIsNormal(!next.some(a => a.status === 'issue'));
      return next;
    });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - photos.length);
    const cam = cams.find((c:any) => c.id === selCam);
    for (const f of files) {
      const compressed = await compressImage(f);
      setPhotos(p => [...p, {
        name: f.name, data: compressed,
        camId: cam?.id, camName: cam?.name,
      }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => setPhotos(p => p.filter((_,i) => i !== idx));

  const issueCount = areas.filter(a => a.status === 'issue').length;

  const saveReport = async () => {
    if (isSubmitting) return;
    const reports = load<DutyReport>(K.reports);
    const dup = reports.find(r =>
      r.schoolId === activeSchool && r.date === today() &&
      r.shift === shift
    );
    if (dup) {
      toast(`กะ${shift==='morning'?'เช้า':'บ่าย'} ของวันนี้ถูกรายงานไปแล้ว!`, 'err');
      return;
    }

    setIsSubmitting(true);
    if (photos.length > 0) {
      toast('กำลังอัพโหลดรูปภาพและบันทึกข้อมูล...', 'ok');
    }
    
    try {
      const reportId = 'r'+Date.now();
      
      const uploadTask = Promise.all(photos.map(async (p, idx) => {
        // อัพโหลดรูปภาพเข้า Storage และรับ URL แทน Base64
        const url = await uploadReportPhoto(reportId, `photo_${idx}.jpg`, p.data);
        return { ...p, data: url };
      }));
      
      const timeoutTask = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 15000); // รอได้มากสุด 15 วินาที
      });

      const uploadedPhotos = await Promise.race([uploadTask, timeoutTask]) as any[];

      const rpt: DutyReport = {
        id: reportId, schoolId:activeSchool, date:today(), shift,
        reporterId:user.id, time, isNormal, areas, note:note.trim(),
        sign:sign.trim(), photos: uploadedPhotos, timestamp:Date.now(),
      };
      await addReport(rpt);
      toast('บันทึกรายงานสำเร็จ ✓', 'ok');
      setTimeout(() => onNav('dashboard'), 900);
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'UPLOAD_TIMEOUT') {
        toast('การอัพโหลดใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ต', 'err');
      } else {
        toast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่', 'err');
      }
      setIsSubmitting(false);
    }
  };

  const sc = SCHOOL_C;
  const bg = SCHOOL_BG;

  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:600, color:'#a89f8c',
    textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6,
  };
  const cardStyle: React.CSSProperties = {
    background:'#fff', border:'1px solid #e5e0d4', borderRadius:12,
    padding:'18px 20px', marginBottom:14,
  };

  return (
    <div>
      <PageHeader title="บันทึกรายงานเวร" subtitle={`${school?.name || ''} · ${fmtDate(today())}`}>
        <button onClick={() => onNav('dashboard')} style={{ background:'none', border:'1px solid #e5e0d4', borderRadius:7, padding:'7px 14px', fontSize:13, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'#574f44' }}>ยกเลิก</button>
      </PageHeader>

      <div style={{ padding:24, maxWidth:740 }}>

        {/* Director: school picker */}
        {user.role === 'director' && (
          <div style={cardStyle}>
            <label style={labelStyle}>เลือกโรงเรียน</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {schools.map(s => {
                const sc2 = s.id==='s1'?'#1e5c3b':'#1a4a7a';
                const bg2 = s.id==='s1'?'#f0f7f2':'#eff4fb';
                return (
                  <button key={s.id} onClick={() => handleSchoolChange(s.id)} style={{
                    border:`2px solid ${activeSchool===s.id?sc2:'#e5e0d4'}`,
                    background:activeSchool===s.id?bg2:'#faf8f4', borderRadius:10,
                    padding:'12px', cursor:'pointer', fontFamily:'Sarabun,sans-serif', textAlign:'left',
                  }}>
                    <div style={{ fontSize:14, fontWeight:700, color:activeSchool===s.id?sc2:'#574f44' }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'#a89f8c', marginTop:2 }}>กล้อง {load<any>(K.cams).filter((c:any)=>c.schoolId===s.id).length} ตัว</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Shift + Time */}
        <div style={cardStyle}>
          <label style={labelStyle}>กะการรายงาน</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {(['morning','afternoon'] as Shift[]).map(s => (
              <button key={s} onClick={() => setShift(s)} style={{
                border:`2px solid ${shift===s?sc:'#e5e0d4'}`, background:shift===s?bg:'#faf8f4',
                borderRadius:10, padding:'13px', cursor:'pointer', textAlign:'center', fontFamily:'Sarabun,sans-serif',
              }}>
                <div style={{ fontSize:26, marginBottom:3 }}>{s==='morning'?'🌅':'🌇'}</div>
                <div style={{ fontSize:14, fontWeight:700, color:shift===s?sc:'#574f44' }}>{s==='morning'?'กะเช้า':'กะบ่าย'}</div>
                <div style={{ fontSize:11, color:'#a89f8c' }}>{s==='morning'?'07:00–12:00':'12:00–17:00'} น.</div>
              </button>
            ))}
          </div>
          <label style={labelStyle}>เวลาที่รายงาน</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'IBM Plex Mono,monospace', fontSize:15, color:'#252018', outline:'none', width:160 }}/>
        </div>

        {/* Quick: Normal */}
        <button onClick={setNormalAll} style={{
          width:'100%', marginBottom:14,
          background: (isNormal && issueCount===0) ? sc : '#fff',
          color: (isNormal && issueCount===0) ? '#faf8f4' : sc,
          border:`2px solid ${sc}`, borderRadius:12, padding:'15px 20px',
          fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'Sarabun,sans-serif',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all .15s',
        }}>
          <span style={{ fontSize:22 }}>✓</span>
          เหตุการณ์ปกติ — ทุกจุดเรียบร้อยดี
        </button>

        {/* Area checklist */}
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <label style={{ ...labelStyle, marginBottom:0 }}>ตรวจสอบแต่ละจุด</label>
            {issueCount > 0 && (
              <span style={{ background:'#fde8e8', color:'#b71c1c', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                ⚠ พบปัญหา {issueCount} จุด
              </span>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {areas.map((a, idx) => (
              <div key={a.area} style={{
                background:a.status==='issue'?'#fde8e8':'#faf8f4',
                border:`1px solid ${a.status==='issue'?'rgba(183,28,28,.25)':'#e5e0d4'}`,
                borderLeft:`3px solid ${a.status==='issue'?'#b71c1c':'#2e7d32'}`,
                borderRadius:8, padding:'9px 13px',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:a.status==='issue'?8:0 }}>
                  <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#252018' }}>{a.area}</span>
                  <button onClick={() => updArea(idx,'status','ok')} style={{ padding:'5px 13px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif', background:a.status==='ok'?'#e8f5e9':'#fff', color:a.status==='ok'?'#1b5e20':'#a89f8c', border:`1.5px solid ${a.status==='ok'?'#2e7d32':'#e5e0d4'}` }}>✓ ปกติ</button>
                  <button onClick={() => updArea(idx,'status','issue')} style={{ padding:'5px 13px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif', background:a.status==='issue'?'#fde8e8':'#fff', color:a.status==='issue'?'#b71c1c':'#a89f8c', border:`1.5px solid ${a.status==='issue'?'#b71c1c':'#e5e0d4'}` }}>⚠ พบปัญหา</button>
                </div>
                {a.status === 'issue' && (
                  <input value={a.note} onInput={e => updArea(idx,'note',(e.target as HTMLInputElement).value)}
                    placeholder="ระบุปัญหาที่พบ..."
                    style={{ width:'100%', background:'#fff', border:'1px solid rgba(183,28,28,.25)', borderRadius:7, padding:'7px 11px', fontFamily:'Sarabun,sans-serif', fontSize:13, color:'#252018', outline:'none' }}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 📷 Photo section */}
        <div style={cardStyle}>
          <label style={labelStyle}>📷 แนบรูปจากกล้องวงจรปิด</label>

          {/* Camera selector */}
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <button onClick={() => setSelCam('')} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif', background:!selCam?sc:'#faf8f4', color:!selCam?'#faf8f4':'#574f44', border:`1.5px solid ${!selCam?sc:'#e5e0d4'}` }}>
              ทั่วไป
            </button>
            {cams.map((cam:any) => (
              <button key={cam.id} onClick={() => setSelCam(cam.id)} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif', background:selCam===cam.id?sc:'#faf8f4', color:selCam===cam.id?'#faf8f4':'#574f44', border:`1.5px solid ${selCam===cam.id?sc:'#e5e0d4'}` }}>
                {cam.id}
              </button>
            ))}
          </div>

          {/* Selected cam info */}
          {selCam && (
            <div style={{ background:bg, border:`1px solid ${sc}40`, borderRadius:7, padding:'7px 12px', marginBottom:10, fontSize:12 }}>
              <span style={{ fontWeight:600, color:sc }}>
                {cams.find((c:any)=>c.id===selCam)?.id}
              </span>
              <span style={{ color:'#a89f8c', marginLeft:6 }}>
                {cams.find((c:any)=>c.id===selCam)?.name} · {cams.find((c:any)=>c.id===selCam)?.location}
              </span>
            </div>
          )}

          {/* Upload zone */}
          <div onClick={() => photos.length < 10 && fileRef.current?.click()} style={{
            border:`2px dashed ${photos.length>=10?'#e5e0d4':sc+'60'}`, borderRadius:10,
            padding:'20px', textAlign:'center', cursor:photos.length>=10?'default':'pointer',
            background:bg, transition:'all .15s', marginBottom:photos.length?12:0,
            opacity:photos.length>=10?0.5:1,
          }}>
            <div style={{ fontSize:30, marginBottom:6 }}>📷</div>
            <div style={{ fontSize:14, fontWeight:600, color:sc }}>
              {photos.length >= 10 ? 'ครบ 10 รูปแล้ว' : 'คลิกเพื่อเลือกรูปภาพ'}
            </div>
            <div style={{ fontSize:11, color:'#a89f8c', marginTop:3 }}>
              JPG, PNG · เหลือได้อีก {10-photos.length} รูป
              {selCam ? ` · จาก ${selCam}` : ' · ทั่วไป'}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display:'none' }}/>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position:'relative', borderRadius:8, overflow:'hidden', aspectRatio:'4/3', border:'1px solid #e5e0d4' }}>
                  <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {/* Cam badge */}
                  {p.camId && (
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.55)', padding:'3px 6px' }}>
                      <span style={{ fontSize:9, color:'#fff', fontFamily:'IBM Plex Mono,monospace' }}>{p.camId}</span>
                      {p.camName && <span style={{ fontSize:9, color:'rgba(255,255,255,.7)', marginLeft:4 }}>{p.camName}</span>}
                    </div>
                  )}
                  <button onClick={() => removePhoto(i)} style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(183,28,28,.8)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div style={cardStyle}>
          <label style={labelStyle}>บันทึก / สรุปสถานการณ์</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="บันทึกเหตุการณ์ ข้อสังเกต สิ่งที่ต้องติดตาม..."
            style={{ width:'100%', background:'#faf8f4', border:'1px solid #e5e0d4', borderRadius:8, padding:'10px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'#252018', outline:'none', resize:'vertical', marginBottom:8 }}/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['เหตุการณ์ปกติ','ไม่มีผู้บุกรุก'].map(t => (
              <button key={t} onClick={() => setNote(n => n?(n+' '+t):t)} style={{ background:bg, border:`1px solid ${sc}40`, borderRadius:20, padding:'4px 12px', fontSize:12, cursor:'pointer', color:sc, fontFamily:'Sarabun,sans-serif', fontWeight:500 }}>
                + {t}
              </button>
            ))}
          </div>
        </div>

        {/* Signature + Submit */}
        <div style={cardStyle}>
          <label style={labelStyle}>ผู้รายงาน</label>
          <input value={sign} onChange={e => setSign(e.target.value)} style={{ width:'100%', background:'#faf8f4', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:14, color:'#252018', outline:'none' }}/>
        </div>

        {/* Summary + Submit */}
        <div style={{ background:issueCount>0?'#fde8e8':bg, border:`1px solid ${issueCount>0?'rgba(183,28,28,.2)':sc+'40'}`, borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:22 }}>{issueCount>0?'⚠':'✓'}</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:issueCount>0?'#b71c1c':sc }}>
              {issueCount>0 ? `พบปัญหา ${issueCount} จุด` : 'ทุกจุดเรียบร้อย'}
            </div>
            <div style={{ fontSize:12, color:'#a89f8c' }}>
              {photos.length > 0 ? `แนบรูป ${photos.length} รูป · ` : ''}
              {shift==='morning'?'กะเช้า':'กะบ่าย'} · {time} น. · {school?.shortName}
            </div>
          </div>
        </div>

        <button onClick={saveReport} disabled={isSubmitting} style={{ 
          width:'100%', background:isSubmitting?'#a89f8c':sc, color:'#faf8f4', border:'none', 
          borderRadius:12, padding:'15px', fontSize:16, fontWeight:700, 
          cursor:isSubmitting?'not-allowed':'pointer', fontFamily:'Sarabun,sans-serif' 
        }}>
          {isSubmitting ? '⏳ กำลังบันทึกข้อมูลและอัพโหลดรูป...' : '💾 บันทึกรายงานเวร'}
        </button>
      </div>
    </div>
  );
}
