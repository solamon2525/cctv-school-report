import React, { useState } from 'react';
import { load, save, K, fmtDate } from '../lib/store';
import type { AppUser, DutyReport } from '../lib/store';
import PageHeader from '../components/PageHeader';
import { toast } from '../lib/toast';
const COLS=['var(--brand-600)','var(--ok)','var(--info)','#6d5c9e','#b05a7a'];
export default function Teachers() {
  const [showAdd,setShowAdd]=useState(false); const [n,setN]=useState(''); const [r,setR]=useState(''); const [p,setP]=useState('');
  const ts=load<AppUser>(K.users); const ins=load<DutyReport>(K.reports);
  const del=(id:string)=>{if(!confirm('ลบครูคนนี้?'))return;save(K.teachers,ts.filter(t=>t.id!==id));toast('ลบครูแล้ว','warn');window.location.reload();};
  const add=()=>{if(!n){toast('กรุณากรอกชื่อครู','err');return;}save(K.teachers,[...ts,{id:'t'+Date.now(),name:n,role:r,phone:p}]);toast(`เพิ่ม ${n} สำเร็จ`,'ok');setShowAdd(false);[setN,setR,setP].forEach(s=>s(''));window.location.reload();};
  const inp=(s?:React.CSSProperties):React.CSSProperties=>({background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:8,padding:'9px 12px',fontFamily:'Sarabun,sans-serif',fontSize:14,color:'var(--neutral-700)',outline:'none',width:'100%',...s});
  return (
    <div>
      <PageHeader title="ครูเวร" subtitle="รายชื่อครูที่ทำหน้าที่ตรวจเวร">
        <button onClick={()=>setShowAdd(true)} style={{background:'var(--brand-600)',color:'#faf8f4',border:'none',borderRadius:8,padding:'8px 16px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>+ เพิ่มครู</button>
      </PageHeader>
      <div style={{padding:24,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
        {!ts.length?<div style={{textAlign:'center',color:'var(--neutral-300)',padding:'40px',gridColumn:'span 4',fontSize:13}}>ยังไม่มีครูเวร</div>:
          ts.map((t,i)=>{
            const tot=ins.filter((x: DutyReport)=>x.reporterId===t.id).length;
            const last=ins.filter((x: DutyReport)=>x.reporterId===t.id).sort((a: DutyReport,b: DutyReport)=>b.timestamp-a.timestamp)[0];
            const col=COLS[i%COLS.length];
            const init=t.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2);
            return <div key={t.id} style={{background:'#fff',border:'1px solid var(--neutral-100)',borderRadius:10,padding:'16px 18px'}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:col+'18',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:col,flexShrink:0}}>{init}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700}}>{t.name}</div>
                  <div style={{fontSize:12,color:'var(--neutral-400)'}}>{t.role||'—'}</div>
                  <div style={{fontSize:12,color:'var(--neutral-400)'}}>📞 {(t as any).phone||'—'}</div>
                </div>
                <button onClick={()=>del(t.id)} style={{background:'var(--err-bg)',border:'1px solid rgba(183,28,28,.18)',borderRadius:6,padding:'4px 8px',fontSize:12,cursor:'pointer',color:'var(--err)',fontFamily:'Sarabun,sans-serif',flexShrink:0}}>ลบ</button>
              </div>
              <div style={{borderTop:'1px solid var(--neutral-100)',paddingTop:10,display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--neutral-400)'}}>ตรวจทั้งหมด</span>
                <span style={{fontWeight:700,color:col}}>{tot} ครั้ง</span>
              </div>
              {last&&<div style={{fontSize:11,color:'var(--neutral-400)',marginTop:3}}>ล่าสุด: {fmtDate(last.date)}</div>}
            </div>;
          })
        }
      </div>
      {showAdd&&(
        <div onClick={e=>e.target===e.currentTarget&&setShowAdd(false)} style={{position:'fixed',inset:0,background:'rgba(30,42,28,.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:'100%',maxWidth:420}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><div style={{fontSize:16,fontWeight:700}}>เพิ่มครูเวร</div><button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--neutral-400)'}}>✕</button></div>
            {([['ชื่อ-นามสกุล','เช่น นายสมชาย ใจดี',n,setN],['ตำแหน่ง','เช่น ครูประจำชั้น ป.4',r,setR],['เบอร์โทร','08x-xxx-xxxx',p,setP]] as [string,string,string,React.Dispatch<React.SetStateAction<string>>][]).map(([l,ph,v,s])=>(
              <div key={l} style={{marginBottom:14}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--neutral-400)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>{l}</label>
                <input placeholder={ph as string} value={v as string} onChange={e=>(s as any)(e.target.value)} style={inp()}/></div>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={()=>setShowAdd(false)} style={{background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:8,padding:'9px 18px',fontSize:14,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'var(--neutral-600)'}}>ยกเลิก</button>
              <button onClick={add} style={{background:'var(--brand-600)',color:'#faf8f4',border:'none',borderRadius:8,padding:'9px 18px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
