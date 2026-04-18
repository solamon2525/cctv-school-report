import React, { useState, useRef, useEffect } from 'react';
import { load, save, K, DutyReport, AreaReport, AppUser, School, DutySchedule,
  AREAS_KP, AREAS_HL, Shift, today, nowTime, fmtDate, isBackdateReportAllowed, getBackdateMaxDays } from '../lib/store';
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

  // Backdate Report Control
  const isBackdateAllowed = isBackdateReportAllowed();
  const maxBackdateDays = getBackdateMaxDays();
  const today_ = today();
  const minAllowedDate = isBackdateAllowed ? (() => {
    const d = new Date();
    d.setDate(d.getDate() - maxBackdateDays);
    return d.toISOString().slice(0, 10);
  })() : today_;

  const [reportDate, setReportDate] = useState(today_);
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

  // Check if date is out of range
  const isDateOutOfRange = reportDate < minAllowedDate || reportDate > today_;
  const dateWarning = isDateOutOfRange ? (
    reportDate > today_ ? 'ไม่สามารถบันทึกรายงานวันในอนาคตได้' :
    !isBackdateAllowed ? 'ไม่อนุญาตให้บันทึกรายงานย้อนหลัง' :
    `ไม่สามารถบันทึกรายงานเกินกว่า ${maxBackdateDays} วันได้`
  ) : '';

  // Reset areas when school changes
  const handleSchoolChange = (sid: string) => {
    setActiveSchool(sid);
    const newCams = load<any>(K.cams).filter((c:any) => c.schoolId === sid && c.status !== 'offline');
    setAreas(newCams.map((c:any) => ({ area:c.name, status:'ok', note:'' })));
    setShift(getDefaultShift()); // reset shift ตามเวลาปัจจุบัน
    setIsNormal(true);
    setNote('');
    setPhotos([]);
    setReportDate(today_);
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
    
    // Validate date range
    if (isDateOutOfRange) {
      toast(dateWarning, 'err');
      return;
    }

    const reports = load<DutyReport>(K.reports);
    const dup = reports.find(r =>
      r.schoolId === activeSchool && r.date === reportDate &&
      r.shift === shift
    );
    if (dup) {
      toast(`กะ${shift==='morning'?'เช้า':'บ่าย'} ของ${reportDate === today_ ? 'วันนี้' : fmtDate(reportDate)} ถูกรายงานไปแล้ว!`, 'err');
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
      <PageHeader title="บันทึกรายงานเวร" subtitle={`${school?.name || ''} · ${fmtDate(today_)}`}>
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

        {/* Date Picker with Backdate Control */}
        <div style={cardStyle}>
          <label style={labelStyle}>วันที่รายงาน</label>
          <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} min={minAllowedDate} max={today_} style={{ background:'#fff', border: isDateOutOfRange ? '2px solid #b71c1c' : '1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'IBM Plex Mono,monospace', fontSize:15, color:'#252018', outline:'none', width:'100%', marginBottom:14 }}/>
          <div style={{ fontSize:12, color:'#a89f8c', fontWeight:500 }}>📅 {fmtDate(reportDate)}</div>
          {isDateOutOfRange && <div style={{ fontSize:12, color:'#b71c1c', fontWeight:600, marginTop:8 }}>⚠️ {dateWarning}</div>}
          {isBackdateAllowed && !isDateOutOfRange && <div style={{ fontSize:11, color:'#1e5c3b', marginTop:8 }}>✓ สามารถบันทึกรายงานย้อนหลังได้สูงสุด {maxBackdateDays} วัน</div>}
        </div>

        {/* Shift + Time */}
        <div style={cardStyle}>
          <label style={labelStyle}>กะการรายงาน</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {(['morning','afternoon'] as Shift[]).map(s => (
              <button key={s} onClick={() => setShift(s)} style={{
                border:`2px solid ${shift===s?sc:'#e5e0d4'}`, background:shift===s?bg:'#faf8f4',
                borderRadius:10, padding:'12px', cursor:'pointer', fontFamily:'Sarabun,sans-serif', textAlign:'center',
              }}>
                <div style={{ fontSize:14, fontWeight:700, color:shift===s?sc:'#574f44' }}>{s==='morning'?'🌅 เช้า':'🌆 บ่าย'}</div>
                <div style={{ fontSize:11, color:'#a89f8c', marginTop:2 }}>{s==='morning'?'06:00 - 12:00':'12:00 - 18:00'}</div>
              </button>
            ))}
          </div>
          <label style={labelStyle}>เวลารายงาน</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'IBM Plex Mono,monospace', fontSize:15, color:'#252018', outline:'none', width:'100%' }}/>
        </div>

        {/* Areas */}
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <label style={labelStyle}>สถานที่ {issueCount > 0 && <span style={{ color:'#b71c1c' }}>({issueCount} ปัญหา)</span>}</label>
            <button onClick={setNormalAll} style={{ background:'#f0f7f2', border:'1px solid #b3dcc0', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#1e5c3b', fontFamily:'Sarabun,sans-serif' }}>✓ ปกติทั้งหมด</button>
          </div>
          {areas.map((a, i) => (
            <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<areas.length-1?'1px solid #f3f0e8':'none' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#252018', marginBottom:6 }}>{a.area}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                {(['ok','issue'] as const).map(st => (
                  <button key={st} onClick={() => updArea(i, 'status', st)} style={{
                    border:`2px solid ${a.status===st?'#1e5c3b':'#e5e0d4'}`, background:a.status===st?'#f0f7f2':'#faf8f4',
                    borderRadius:8, padding:'8px', cursor:'pointer', fontFamily:'Sarabun,sans-serif', fontSize:12, fontWeight:600,
                    color:a.status===st?'#1e5c3b':'#574f44',
                  }}>
                    {st==='ok'?'✓ ปกติ':'⚠️ มีปัญหา'}
                  </button>
                ))}
              </div>
              {a.status==='issue' && (
                <input type="text" value={a.note} onChange={e => updArea(i, 'note', e.target.value)} placeholder="อธิบายปัญหา..." style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:13, color:'#252018', outline:'none', width:'100%' }}/>
              )}
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={cardStyle}>
          <label style={labelStyle}>หมายเหตุ</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="บันทึกเพิ่มเติม..." style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:13, color:'#252018', outline:'none', width:'100%', minHeight:80, resize:'vertical' }}/>
        </div>

        {/* Sign */}
        <div style={cardStyle}>
          <label style={labelStyle}>ลายเซ็น</label>
          <input type="text" value={sign} onChange={e => setSign(e.target.value)} placeholder="ชื่อผู้บันทึก" style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'9px 12px', fontFamily:'Sarabun,sans-serif', fontSize:13, color:'#252018', outline:'none', width:'100%' }}/>
        </div>

        {/* Photos */}
        <div style={cardStyle}>
          <label style={labelStyle}>รูปภาพ ({photos.length}/10)</label>
          <button onClick={() => fileRef.current?.click()} style={{ background:'#f0f7f2', border:'1px solid #b3dcc0', borderRadius:8, padding:'10px', fontSize:13, cursor:'pointer', color:'#1e5c3b', fontFamily:'Sarabun,sans-serif', fontWeight:600, width:'100%', marginBottom:12 }}>📷 เพิ่มรูปภาพ</button>
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleFiles} style={{ display:'none' }}/>
          {photos.map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px', background:'#faf8f4', borderRadius:8, marginBottom:8 }}>
              <div style={{ flex:1, fontSize:12, color:'#5a5248' }}>{p.name}</div>
              <button onClick={() => removePhoto(i)} style={{ background:'#fde8e8', border:'1px solid rgba(183,28,28,.2)', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer', color:'#b71c1c', fontFamily:'Sarabun,sans-serif' }}>ลบ</button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => onNav('dashboard')} style={{ flex:1, background:'#fff', border:'1px solid #e5e0d4', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Sarabun,sans-serif', color:'#574f44' }}>ยกเลิก</button>
          <button onClick={saveReport} disabled={isSubmitting || isDateOutOfRange} style={{ flex:1, background:isDateOutOfRange?'#ccc':sc, color:isDateOutOfRange?'#999':'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:isDateOutOfRange||isSubmitting?'not-allowed':'pointer', fontFamily:'Sarabun,sans-serif' }}>
            {isSubmitting ? `${uploadProgress.status}` : '💾 บันทึกรายงาน'}
          </button>
        </div>
        {isSubmitting && uploadProgress.total > 0 && (
          <div style={{ marginTop:12, padding:12, background:'#f0f7f2', borderRadius:8 }}>
            <div style={{ fontSize:12, color:'#1e5c3b', fontWeight:600, marginBottom:6 }}>{uploadProgress.status}</div>
            <div style={{ width:'100%', height:6, background:'#e0f2f1', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${(uploadProgress.current/uploadProgress.total)*100}%`, height:'100%', background:'#1e5c3b', transition:'width 0.3s' }}/>
            </div>
            <div style={{ fontSize:11, color:'#5a5248', marginTop:6 }}>{uploadProgress.current}/{uploadProgress.total}</div>
            <button onClick={cancelUpload} style={{ marginTop:8, background:'#fde8e8', border:'1px solid rgba(183,28,28,.2)', borderRadius:6, padding:'6px 12px', fontSize:12, cursor:'pointer', color:'#b71c1c', fontFamily:'Sarabun,sans-serif', fontWeight:600, width:'100%' }}>ยกเลิก</button>
          </div>
        )}
      </div>
    </div>
  );
}
