import React, { useState } from 'react';
import { load, save, K, Camera, CamStatus, CamZone, School, zoneLbl, stLbl, stBorderColor } from '../lib/store';
import { saveCamera, deleteCamera, updateCamera } from '../lib/firebase';
import { CamBadge } from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { toast } from '../lib/toast';

export default function Cameras({ schoolId }: { schoolId:string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newId,setNewId]=useState(''); const [newName,setNewName]=useState(''); const [newLoc,setNewLoc]=useState(''); const [newZone,setNewZone]=useState<CamZone>('exterior');
  const cams = load<Camera>(K.cams).filter(c => c.schoolId === schoolId);
  const ok=cams.filter(c=>c.status==='ok').length;

  const setSt = (id:string, status:CamStatus) => { updateCamera(id, {status}); toast(`${id}: ${stLbl[status]}`,'ok'); setTimeout(()=>window.location.reload(), 500); };
  const del = (id:string) => { if(!confirm('ลบกล้องนี้?'))return; deleteCamera(id); toast('ลบกล้องแล้ว','warn'); setTimeout(()=>window.location.reload(), 500); };
  const doAdd = () => {
    if(!newId||!newName){toast('กรุณากรอกรหัสและชื่อกล้อง','err');return;}
    if(cams.find(c=>c.id===newId)){toast('รหัสนี้มีอยู่แล้ว','err');return;}
    saveCamera({id:newId,schoolId,name:newName,location:newLoc||'—',zone:newZone,status:'ok'});
    toast(`เพิ่ม ${newId} สำเร็จ`,'ok'); setShowAdd(false); [setNewId,setNewName,setNewLoc].forEach(s=>s('')); setTimeout(()=>window.location.reload(), 500);
  };
  const inp=(s?:React.CSSProperties):React.CSSProperties=>({background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:8,padding:'9px 12px',fontFamily:'Sarabun,sans-serif',fontSize:14,color:'var(--neutral-700)',outline:'none',width:'100%',...s});

  return (
    <div>
      <PageHeader title="จัดการกล้อง CCTV" subtitle={(() => { const s=load<any>(K.schools).find((x:any)=>x.id===schoolId); return (s?.name||'') + ' · กล้อง ' + cams.length + ' ตัว · ปกติ ' + ok + ' · ผิดปกติ ' + (cams.length-ok); })()}>
        <button onClick={()=>setShowAdd(true)} style={{background:'var(--brand-600)',color:'#faf8f4',border:'none',borderRadius:8,padding:'8px 16px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>+ เพิ่มกล้อง</button>
      </PageHeader>
      <div style={{padding:24}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {cams.map(c=>(
            <div key={c.id} style={{background:'#fff',border:'1px solid var(--neutral-100)',borderLeft:`3px solid ${stBorderColor[c.status]}`,borderRadius:10,padding:'13px 15px'}}>
              <div className="mono" style={{fontSize:10,color:'var(--neutral-300)',marginBottom:2}}>{c.id}</div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:11,color:'var(--neutral-400)',marginBottom:4}}>📍 {c.location}</div>
              <div style={{fontSize:11,color:'var(--neutral-400)',marginBottom:8}}>🗂 {zoneLbl[c.zone]}</div>
              <CamBadge status={c.status}/>
              <select value={c.status} onChange={e=>setSt(c.id,e.target.value as CamStatus)} style={{marginTop:8,background:'var(--neutral-0)',border:'1px solid var(--neutral-200)',borderRadius:6,padding:'5px 8px',fontFamily:'Sarabun,sans-serif',fontSize:12,cursor:'pointer',outline:'none',color:'var(--neutral-600)',width:'100%'}}>
                <option value="ok">✓ ปกติ</option><option value="warning">⚠ ผิดปกติ</option><option value="error">✗ ไม่มีสัญญาณ</option><option value="offline">— ปิดใช้งาน</option>
              </select>
              <button onClick={()=>del(c.id)} style={{marginTop:6,width:'100%',background:'var(--err-bg)',border:'1px solid rgba(183,28,28,.18)',borderRadius:6,padding:'5px',fontSize:12,cursor:'pointer',color:'var(--err)',fontFamily:'Sarabun,sans-serif'}}>ลบ</button>
            </div>
          ))}
        </div>
      </div>
      {showAdd&&(
        <div onClick={e=>e.target===e.currentTarget&&setShowAdd(false)} style={{position:'fixed',inset:0,background:'rgba(30,42,28,.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:'100%',maxWidth:440}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><div style={{fontSize:16,fontWeight:700}}>เพิ่มกล้อง CCTV</div><button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--neutral-400)'}}>✕</button></div>
            {[['รหัสกล้อง','เช่น CAM-13',newId,setNewId],['ชื่อกล้อง','เช่น กล้องหน้าโรงเรียน',newName,setNewName],['จุดติดตั้ง','เช่น ประตูหน้า',newLoc,setNewLoc]].map(([l,p,v,s])=>(
              <div key={l} style={{marginBottom:14}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--neutral-400)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>{l}</label>
                <input placeholder={p as string} value={v as string} onChange={e=>(s as any)(e.target.value)} style={inp()}/></div>
            ))}
            <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--neutral-400)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>โซน</label>
              <select value={newZone} onChange={e=>setNewZone(e.target.value as CamZone)} style={inp()}>
                {Object.entries(zoneLbl).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowAdd(false)} style={{background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:8,padding:'9px 18px',fontSize:14,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'var(--neutral-600)'}}>ยกเลิก</button>
              <button onClick={doAdd} style={{background:'var(--brand-600)',color:'#faf8f4',border:'none',borderRadius:8,padding:'9px 18px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
