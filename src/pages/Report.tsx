import React, { useState, useMemo } from 'react';
import { load, K } from '../lib/store';
import type { DutyReport, AppUser } from '../lib/store';
import PageHeader from '../components/PageHeader';

function Row({label,val,color}:{label:string;val:string;color?:string}) {
  return <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--neutral-50)',fontSize:13 }}><span style={{color:'var(--neutral-500)'}}>{label}</span><span style={{fontWeight:600,color:color||'var(--neutral-700)'}}>{val}</span></div>;
}
function Bar({label,val,max,color='var(--brand-600)'}:{label:string;val:number;max:number;color?:string}) {
  const pct = max>0?Math.round((val/max)*100):0;
  return <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
    <div style={{fontSize:11,color:'var(--neutral-400)',width:100,textAlign:'right',flexShrink:0}}>{label}</div>
    <div style={{flex:1,background:'var(--neutral-50)',borderRadius:4,height:22,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:7,minWidth:val?26:0}}>
        {val>0&&<span style={{fontSize:11,fontWeight:700,color:'#fff'}}>{val}</span>}
      </div>
    </div>
  </div>;
}

export default function Report({ schoolId }: { schoolId:string }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()+1).padStart(2,'0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const ins = load<DutyReport>(K.reports);
  const teachers = load<AppUser>(K.users).filter(u => u.schoolId === schoolId || u.schoolId === null);
  const mns = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  const filtered = useMemo(() => ins.filter(i=>i.date.startsWith(`${year}-${month}`)), [ins,year,month]);
  const morn = filtered.filter(i=>i.shift==='morning').length;
  const aftn = filtered.filter(i=>i.shift==='afternoon').length;
  const probs = filtered.filter(i=>!i.isNormal).length;
  const camIssMap: Record<string,number> = {};
  filtered.forEach(i=>(i.areas||[]).forEach((a: {area:string;status:string;note:string})=>{if(a.status!=='ok') camIssMap[a.area]=(camIssMap[a.area]||0)+1;}));
  const camIss = Object.entries(camIssMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCamIss = camIss[0]?.[1]||1;
  const maxTeach = Math.max(...teachers.map((t: AppUser)=>filtered.filter(i=>i.reporterId===t.id).length),1);
  const tot = morn+aftn||1;

  const inp = (s:React.CSSProperties):React.CSSProperties=>({background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:7,padding:'8px 11px',fontFamily:'Sarabun,sans-serif',fontSize:14,color:'var(--neutral-700)',outline:'none',...s});

  return (
    <div>
      <PageHeader title="รายงานสรุปผล" subtitle="สถิติและสรุปการตรวจประจำเดือน">
        <button onClick={()=>window.print()} style={{background:'var(--brand-600)',color:'#faf8f4',border:'none',borderRadius:8,padding:'8px 16px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>🖨 พิมพ์รายงาน</button>
      </PageHeader>
      <div style={{padding:24}}>
        <div style={{display:'flex',gap:12,marginBottom:20}}>
          <div><div style={{fontSize:11,fontWeight:600,color:'var(--neutral-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>เดือน</div>
            <select value={month} onChange={e=>setMonth(e.target.value)} style={inp({width:160})}>
              {mns.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
          </div>
          <div><div style={{fontSize:11,fontWeight:600,color:'var(--neutral-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>ปี (พ.ศ.)</div>
            <select value={year} onChange={e=>setYear(e.target.value)} style={inp({width:130})}>
              {[0,1,2].map(i=><option key={i} value={String(now.getFullYear()-i)}>{now.getFullYear()-i+543}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div style={{background:'#fff',border:'1px solid var(--neutral-100)',borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--neutral-500)',marginBottom:12}}>📊 สรุปการตรวจ</div>
            <Row label="การตรวจทั้งหมด" val={`${filtered.length} ครั้ง`} color="var(--brand-600)"/>
            <Row label="กะเช้า" val={`${morn} ครั้ง`}/>
            <Row label="กะบ่าย" val={`${aftn} ครั้ง`}/>
            <Row label="พบปัญหา" val={`${probs} ครั้ง`} color={probs?'var(--err)':'var(--ok)'}/>
            <Row label="ไม่มีปัญหา" val={`${filtered.length-probs} ครั้ง`} color="var(--ok)"/>
          </div>
          <div style={{background:'#fff',border:'1px solid var(--neutral-100)',borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--neutral-500)',marginBottom:12}}>👨‍🏫 สถิติตามครู</div>
            {teachers.map((t: AppUser)=><Bar key={t.id} label={t.name.split(' ')[0]} val={filtered.filter(i=>i.reporterId===t.id).length} max={maxTeach}/>)}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#fff',border:'1px solid var(--neutral-100)',borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--neutral-500)',marginBottom:12}}>🌅 เช้า vs 🌇 บ่าย</div>
            <div style={{display:'flex',gap:12,marginBottom:14}}>
              {([['เช้า',morn,'var(--gold-500)'],['บ่าย',aftn,'var(--info)']] as [string,number,string][]).map(([l,v,c])=>(
                <div key={l} style={{flex:1,textAlign:'center',background:'var(--neutral-0)',borderRadius:8,padding:'14px 10px'}}>
                  <div className="mono" style={{fontSize:26,fontWeight:700,color:c as string}}>{v}</div>
                  <div style={{fontSize:12,color:'var(--neutral-400)'}}>{l==='เช้า'?'🌅':'🌇'} {l} ({Math.round((Number(v)/tot)*100)}%)</div>
                </div>
              ))}
            </div>
            <div style={{background:'var(--neutral-100)',borderRadius:4,height:8,overflow:'hidden'}}>
              <div style={{width:`${Math.round((morn/tot)*100)}%`,height:'100%',background:'var(--gold-500)',borderRadius:4}}/>
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid var(--neutral-100)',borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--neutral-500)',marginBottom:12}}>📹 กล้องที่มีปัญหาบ่อยสุด</div>
            {!camIss.length
              ? <div style={{textAlign:'center',padding:'20px 0',color:'var(--ok)',fontSize:13}}>✓ ไม่พบกล้องที่มีปัญหา</div>
              : camIss.map(([id,n])=><Bar key={id} label={id} val={n} max={maxCamIss} color="var(--err)"/>)
            }
          </div>
        </div>
      </div>
    </div>
  );
}
