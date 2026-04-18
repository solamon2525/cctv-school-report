import React, { useState, useRef, useEffect } from 'react';
import { load, save, K, DutyReport, AreaReport, AppUser, School, DutySchedule,
  AREAS_KP, AREAS_HL, Shift, today, nowTime, fmtDate } from '../lib/store';
import { addReport, uploadReportPhoto } from '../lib/firebase';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';

interface Photo { name: string; data: string; camId?: string; camName?: string; originalSize?: number; compressedSize?: number; }
interface Props { user: AppUser; onNav:(p:any)=>void; schoolId:string; }

export default function NewReport({ user, onNav, schoolId }: Props) {
  // Director can pick school
  const schools = load<School>(K.schools);
  const [activeSchool, setActiveSchool] = useState(schoolId);
  const school = schools.find(s => s.id === activeSchool);
  const cams   = load<any>(K.cams).filter((c:any) => c.schoolId === activeSchool && c.status !== 'offline');

  const getDefaultShift = (): Shift => new Date().getHours() < 12 ? 'morning' : 'afternoon';

  const [reportDate, setReportDate] = useState(today());
  const [shift,    setShift]    = useState<Shift>(getDefaultShift);
  const [time,     setTime]     = useState(nowTime());
  const [areas,    setAreas]    = useState<AreaReport[]>(() => cams.map((c:any)=>({area:c.name,status:'ok',note:''})));

  // Bug #8: auto-update shift every minute in case form is left open past noon
  useEffect(() => {
    const id = setInterval(() => setShift(getDefaultShift()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [note,     setNote]     = useState('');
  const [sign,     setSign]     = useState(user.name);
  const [isNormal, setIsNormal] = useState(true);
  const [photos,   setPhotos]   = useState<Photo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' });
  const cancelRef = useRef(false);

  const SCHOOL_C  = activeSchool === 's1' ? '#1e5c3b' : '#1a4a7a';
  const SCHOOL_BG = activeSchool === 's1' ? '#f0f7f2' : '#eff4fb';

  // Reset areas when school changes
  const handleSchoolChange = (sid: string) => {
    setActiveSchool(sid);
    const newCams = load<any>(K.cams).filter((c:any) => c.schoolId === sid && c.status !== 'offline');
    setAreas(newCams.map((c:any) => ({ area:c.name, status:'ok', note:'' })));
    setShift(getDefaultShift()); // reset shift ตามเวลาปัจจุบัน
    setIsNormal(true);
    setNote('');
    setPhotos([]);
  };

  const setNormalAll = () => {
    const currentCams = load<any>(K.cams).filter((c:any) => c.schoolId === activeSchool && c.status !== 'offline');
    setAreas(currentCams.map((c:any) => ({ area:c.name, status:'ok', note:'' })));
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

  const compressImage = (file: File): Promise<{ dataUrl: string; originalSize: number; compressedSize: number }> => {
    return new Promise((resolve) => {
      const originalSize = file.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1024; // คืนขนาดเป็น 1024 เพื่อความชัดเจน (ImgBB รับได้เต็มที่)
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // คืน quality เป็น 0.7 เพื่อความคมชัด
          const compressedSize = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
          resolve({ dataUrl, originalSize, compressedSize });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - photos.length);
    for (const f of files) {
      const { dataUrl, originalSize, compressedSize } = await compressImage(f);
      setPhotos(p => [...p, {
        name: f.name, data: dataUrl,
        originalSize, compressedSize,
      }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => setPhotos(p => p.filter((_,i) => i !== idx));

  const issueCount = areas.filter(a => a.status === 'issue').length;

  const cancelUpload = () => {
    cancelRef.current = true;
    setIsSubmitting(false);
    setUploadProgress({ current: 0, total: 0, status: '' });
    toast('ยกเลิกการอัพโหลดแล้ว', 'err');
  };

  const saveReport = async () => {
    if (isSubmitting) return;
    const reports = load<DutyReport>(K.reports);
    const dup = reports.find(r =>
      r.schoolId === activeSchool && r.date === reportDate &&
      r.shift === shift
    );
    if (dup) {
      toast(`กะ${shift==='morning'?'เช้า':'บ่าย'} ของ${reportDate === today() ? 'วันนี้' : fmtDate(reportDate)} ถูกรายงานไปแล้ว!`, 'err');
      return;
    }

    setIsSubmitting(true);
    cancelRef.current = false;
    
    try {
      const reportId = 'r'+Date.now();
      const uploadedPhotos: Photo[] = [];

      if (photos.length > 0) {
        setUploadProgress({ current: 0, total: photos.length, status: 'กำลังอัพโหลดรูปภาพไปเซิร์ฟเวอร์ ImgBB...' });
      }

      for (let idx = 0; idx < photos.length; idx++) {
        if (cancelRef.current) return;
        
        const p = photos[idx];
        setUploadProgress({ current: idx + 1, total: photos.length, status: `อัพโหลดรูปที่ ${idx + 1}/${photos.length}...` });

        try {
          const b64Data = p.data.replace(/^data:image\/\w+;base64,/, '');
          const formData = new FormData();
          formData.append('image', b64Data);

          const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
          const rx = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
          });
          const resMap = await rx.json();

          if (resMap.success) {
            uploadedPhotos.push({ ...p, data: resMap.data.url }); // ได้ URL นามสกุล .jpg ของจริง!
          } else {
            throw new Error('ImgBB Failed');
          }
        } catch (uploadErr) {
          console.warn(`Photo ${idx + 1} upload to ImgBB failed, using fallback directly in DB`, uploadErr);
          uploadedPhotos.push(p); // ถ้าอัพล้มเหลวสุดๆ ก็ยังเก็บเป็น base64 ไว้ในนี้ให้เหมือนเดิม
        }
      }

      if (cancelRef.current) return;
      setUploadProgress({ current: photos.length, total: photos.length, status: 'กำลังบันทึกรายงาน...' });

      const rpt: DutyReport = {
        id: reportId, schoolId:activeSchool, date:reportDate, shift,
        reporterId:user.id, time, isNormal, areas, note:note.trim(),
        sign:sign.trim(), photos: uploadedPhotos, timestamp:Date.now(),
      };
      
      // แปลงเป็น JSON เพื่อลบค่าที่เป็น undefined อัตโนมัติ (ป้องกัน Firestore Error)
      const cleanRpt = JSON.parse(JSON.stringify(rpt));
      await addReport(cleanRpt);

      toast('บันทึกรายงานสำเร็จ ✓', 'ok');
      setUploadProgress({ current: 0, total: 0, status: '' });
      setTimeout(() => onNav('dashboard'), 900);
    } catch (err: any) {
      console.error(err);
      toast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่', 'err');
      setIsSubmitting(false);
      setUploadProgress({ current: 0, total: 0, status: '' });
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
                    <div style={{ fontSize:11, color:'#a89f8c', marginTop:2 }}>กล้อง {load<any>(K.cams).filter((c:any)=>c.schoolId===s.id && c.status!=='offline').length} ตัว (เปิดใช้งาน)</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div style={cardStyle}>
          <label style={labelStyle}>วันที่รายงาน</label>
          <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} max={today()} style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'IBM Plex Mono,monospace', fontSize:15, color:'#252018', outline:'none', width:'100%', marginBottom:14 }}/>
          <div style={{ fontSize:12, color:'#a89f8c', fontWeight:500 }}>📅 {fmtDate(reportDate)}</div>
        </div>

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
          <label style={labelStyle}>📷 แนบรูปรวม (ถ้ามี)</label>

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
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display:'none' }}/>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position:'relative', borderRadius:8, overflow:'hidden', aspectRatio:'4/3', border:'1px solid #e5e0d4' }}>
                  <img src={p.data} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {/* Size badge */}
                  {p.originalSize && p.compressedSize && (
                    <div style={{ position:'absolute', top:4, left:4, background:'rgba(0,0,0,.65)', padding:'2px 6px', borderRadius:4 }}>
                      <span style={{ fontSize:8, color:'#4caf50', fontFamily:'IBM Plex Mono,monospace', fontWeight:700 }}>
                        {(p.originalSize/1024/1024).toFixed(1)}MB → {(p.compressedSize/1024).toFixed(0)}KB
                      </span>
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

        {/* Upload progress bar */}
        {isSubmitting && uploadProgress.total > 0 && (
          <div style={{ marginBottom:14, background:'#fff', border:'1px solid #e5e0d4', borderRadius:10, padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#252018' }}>{uploadProgress.status}</span>
              <span style={{ fontSize:12, color:'#a89f8c', fontFamily:'IBM Plex Mono,monospace' }}>
                {uploadProgress.current}/{uploadProgress.total}
              </span>
            </div>
            <div style={{ width:'100%', height:6, background:'#e5e0d4', borderRadius:3, overflow:'hidden' }}>
              <div style={{
                width:`${(uploadProgress.current / uploadProgress.total) * 100}%`,
                height:'100%', background:sc, borderRadius:3,
                transition:'width 0.3s ease',
              }}/>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={isSubmitting ? cancelUpload : saveReport} style={{ 
            flex:1, background:isSubmitting?'#b71c1c':sc, color:'#faf8f4', border:'none', 
            borderRadius:12, padding:'15px', fontSize:16, fontWeight:700, 
            cursor:'pointer', fontFamily:'Sarabun,sans-serif',
            transition:'background 0.2s',
          }}>
            {isSubmitting ? '✕ ยกเลิกการอัพโหลด' : '💾 บันทึกรายงานเวร'}
          </button>
        </div>
      </div>
    </div>
  );
}
