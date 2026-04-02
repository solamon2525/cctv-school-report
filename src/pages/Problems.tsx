import React, { useState } from 'react';
import { load, save, K, Inspection, Teacher, fmtDate, urgLbl, stLbl } from '../lib/store';
import { UrgBadge } from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { toast } from '../lib/toast';

export default function Problems({ schoolId }: { schoolId:string }) {
  const [tab,setTab]=useState<'open'|'done'>('open');
  const ins=load<Inspection>(K.inspections).filter(i=>i.schoolId===schoolId); const ts=load<Teacher>(K.teachers);
  const all=ins.filter(i=>i.urgency!=='none');
  const open=all.filter(i=>!i.resolved); const done=all.filter(i=>i.resolved);
  const list=(tab==='open'?open:done).sort((a,b)=>{const o:{[k:string]:number}={high:0,medium:1,low:2};return (o[a.urgency]||3)-(o[b.urgency]||3);});
  const tName=(id:string)=>ts.find(t=>t.id===id)?.name||id;
  const toggle=(id:string)=>{
    const data=load<Inspection>(K.inspections); const item=data.find(i=>i.id===id); if(!item)return;
    item.resolved=!item.resolved; save(K.inspections,data);
    toast(item.resolved?'ทำเครื่องหมายแก้ไขแล้ว ✓':'เปิดรายงานปัญหาอีกครั้ง',item.resolved?'ok':'warn');
    window.location.reload();
  };
  const bord:{[k:string]:string}={high:'var(--err)',medium:'var(--warn)',low:'var(--info)'};
  const tBtn=(active:boolean):React.CSSProperties=>({background:active?'var(--brand-600)':'#fff',color:active?'#faf8f4':'var(--neutral-600)',border:active?'none':'1px solid var(--neutral-200)',borderRadius:8,padding:'8px 18px',fontSize:14,fontWeight:active?600:400,cursor:'pointer',fontFamily:'Sarabun,sans-serif',display:'flex',alignItems:'center',gap:6});
  return (
    <div>
      <PageHeader title="รายงานปัญหา" subtitle="รายการปัญหาจากการตรวจ"/>
      <div style={{padding:24}}>
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          <button style={tBtn(tab==='open')} onClick={()=>setTab('open')}>⚠ รอดำเนินการ <span style={{background:'rgba(0,0,0,.15)',padding:'0px 7px',borderRadius:10,fontSize:11}}>{open.length}</span></button>
          <button style={tBtn(tab==='done')} onClick={()=>setTab('done')}>✓ แก้ไขแล้ว <span style={{background:'rgba(0,0,0,.1)',padding:'0px 7px',borderRadius:10,fontSize:11}}>{done.length}</span></button>
        </div>
        {!list.length
          ? <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:40,color:tab==='open'?'var(--ok)':'var(--neutral-300)',marginBottom:8}}>{tab==='open'?'✓':'📋'}</div>
              <div style={{fontSize:14,fontWeight:600,color:tab==='open'?'var(--ok)':'var(--neutral-400)'}}>{tab==='open'?'ไม่มีปัญหาที่รอดำเนินการ':'ยังไม่มีรายการที่แก้ไขแล้ว'}</div>
            </div>
          : list.map(i=>{
              const bads=(i.cameras||[]).filter(c=>c.status!=='ok');
              return <div key={i.id} style={{background:'#fff',border:'1px solid var(--neutral-100)',borderLeft:`3px solid ${i.resolved?'var(--ok)':bord[i.urgency]||'var(--neutral-200)'}`,borderRadius:10,padding:'14px 18px',marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{tName(i.teacherId)}</div>
                    <div style={{fontSize:12,color:'var(--neutral-400)'}}>{fmtDate(i.date)} — {i.shift==='morning'?'🌅 เช้า':'🌇 บ่าย'} {i.time}</div>
                  </div>
                  <div style={{display:'flex',gap:7,alignItems:'center'}}>
                    <UrgBadge urgency={i.urgency}/>
                    <button onClick={()=>toggle(i.id)} style={{background:i.resolved?'var(--neutral-50)':'var(--brand-50)',color:i.resolved?'var(--neutral-600)':'var(--brand-700)',border:`1px solid ${i.resolved?'var(--neutral-200)':'var(--brand-200)'}`,borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>
                      {i.resolved?'↩ เปิดใหม่':'✓ แก้ไขแล้ว'}
                    </button>
                  </div>
                </div>
                {i.notes&&<div style={{background:'var(--neutral-0)',borderRadius:7,padding:'8px 11px',fontSize:13,color:'var(--neutral-600)',marginBottom:8}}>{i.notes}</div>}
                {bads.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {bads.map(c=><span key={c.id} style={{background:c.status==='error'?'var(--err-bg)':'var(--warn-bg)',color:c.status==='error'?'var(--err)':'var(--warn)',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600}}>{c.id}: {stLbl[c.status]}</span>)}
                </div>}
              </div>;
            })
        }
      </div>
    </div>
  );
}
