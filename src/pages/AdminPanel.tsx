import React, { useState } from 'react';
import { load, save, K, AppUser, School, Camera, DutySchedule, DutyReport, today, fmtDate, Shift, clearAdminSession, getSchoolLogo, setSchoolLogo } from '../lib/store';
import { saveUser, deleteUser, saveDuty, deleteDuty, clearAllDatabase, importDatabase } from '../lib/firebase';
import { toast } from '../lib/toast';
import PageHeader from '../components/PageHeader';
import Cameras from './Cameras';

const inp=(s?:React.CSSProperties):React.CSSProperties=>({background:'#fff',border:'1px solid #e5e0d4',borderRadius:8,padding:'9px 12px',fontFamily:'Sarabun,sans-serif',fontSize:14,color:'#252018',outline:'none',width:'100%',...s});
const ROLE_LABEL:Record<string,string>={director:'ผู้อำนวยการ',admin:'ครู (Admin)',teacher:'ครู'};
const COLS=['#1e5c3b','#1a4a7a','#8a4f00','#7a1a4a','#3a6b8a'];
const SCHOOL_C:Record<string,string>={s1:'#1e5c3b',s2:'#1a4a7a'};

function UserMgmt() {
  const [name,setName]=useState(''); const [role,setRole]=useState<'teacher'|'admin'>('teacher');
  const [schoolId,setSId]=useState('s1'); const [pin,setPin]=useState(''); const [editId,setEId]=useState<string|null>(null);
  const users=load<AppUser>(K.users); const schools=load<School>(K.schools);

  const save_=()=>{
    if(!name.trim()){toast('กรุณากรอกชื่อ','err');return;}
    if(pin&&(pin.length!==4||!/^\d{4}$/.test(pin))){toast('PIN ต้องเป็นตัวเลข 4 หลัก','err');return;}
    let newUser: AppUser;
    if(editId){
      const all=load<AppUser>(K.users);
      const cur=all.find(u=>u.id===editId);
      newUser={...cur!,name:name.trim(),role,schoolId:schoolId||null,pin:pin||cur!.pin};
    } else {
      if(!pin){toast('กรุณากำหนด PIN','err');return;}
      newUser={id:'u'+Date.now(),name:name.trim(),role,schoolId:schoolId||null,pin};
    }
    saveUser(newUser); toast(editId?'แก้ไขแล้ว':'เพิ่มแล้ว','ok');
    setName('');setPin('');setEId(null); setTimeout(()=>window.location.reload(), 500);
  };
  const edit=(u:AppUser)=>{setEId(u.id);setName(u.name);setRole(u.role==='director'?'teacher':u.role as any);setSId(u.schoolId||'s1');setPin('');};
  const del=(id:string)=>{
    if(load<AppUser>(K.users).find(u=>u.id===id)?.role==='director'){toast('ไม่สามารถลบผู้อำนวยการได้','err');return;}
    if(!confirm('ลบผู้ใช้นี้?'))return;
    deleteUser(id);
    toast('ลบแล้ว','warn'); setTimeout(()=>window.location.reload(), 500);
  };
  const reports=load<DutyReport>(K.reports);

  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:20}}>
      <div style={{flex:'1 1 300px',background:'#fff',border:'1px solid #e5e0d4',borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:'#252018',marginBottom:16}}>{editId?'✎ แก้ไขผู้ใช้':'+ เพิ่มครู/ผู้ใช้'}</div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>ชื่อ-นามสกุล *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น นายณัฐพงศ์ สิงห์ชมภู" style={inp()}/></div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>บทบาท</label>
          <select value={role} onChange={e=>setRole(e.target.value as any)} style={inp()}>
            <option value="teacher">ครู</option><option value="admin">ครู (Admin)</option>
          </select>
        </div>
        <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>โรงเรียน</label>
          <select value={schoolId} onChange={e=>setSId(e.target.value)} style={inp()}>
            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{marginBottom:18}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>PIN {editId?'(ว่าง = คงเดิม)':' *'}</label>
          <input type="password" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/,'').slice(0,4))} placeholder="4 หลัก" style={inp({fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.3em'})}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          {editId&&<button onClick={()=>{setEId(null);setName('');setPin('');}} style={{flex:1,background:'#fff',border:'1px solid #e5e0d4',borderRadius:8,padding:10,fontSize:14,cursor:'pointer',fontFamily:'Sarabun,sans-serif',color:'#574f44'}}>ยกเลิก</button>}
          <button onClick={save_} style={{flex:1,background:'#1e5c3b',color:'#faf8f4',border:'none',borderRadius:8,padding:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>{editId?'บันทึก':'เพิ่มผู้ใช้'}</button>
        </div>
      </div>
      <div style={{flex:'1.6 1 400px',background:'#fff',border:'1px solid #e5e0d4',borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:'#252018',marginBottom:16}}>ผู้ใช้งานทั้งหมด ({users.length} คน)</div>
        {users.map((u,i)=>{
          const cnt=reports.filter(r=>r.reporterId===u.id).length;
          const col=COLS[i%COLS.length];
          const init=u.name.split('').slice(u.name.indexOf(' ')+1).join('').slice(0,2);
          const sc=schools.find(s=>s.id===u.schoolId);
          return(
            <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f3f0e8'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:col+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:col,flexShrink:0}}>{init}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#252018'}}>{u.name}</div>
                <div style={{fontSize:11,color:'#a89f8c'}}>{ROLE_LABEL[u.role]} · {sc?.shortName||'ทั้ง 2 รร'} · รายงานแล้ว {cnt} ครั้ง</div>
                <div style={{fontSize:10,color:'#ccc5b4',fontFamily:'IBM Plex Mono,monospace'}}>PIN: {'●'.repeat(u.pin.length)}</div>
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>edit(u)} style={{background:'#f0f7f2',border:'1px solid #b3dcc0',borderRadius:6,padding:'4px 10px',fontSize:12,cursor:'pointer',color:'#1e5c3b',fontFamily:'Sarabun,sans-serif'}}>แก้ไข</button>
                <button onClick={()=>del(u.id)} style={{background:'#fde8e8',border:'1px solid rgba(183,28,28,.2)',borderRadius:6,padding:'4px 10px',fontSize:12,cursor:'pointer',color:'#b71c1c',fontFamily:'Sarabun,sans-serif'}}>ลบ</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DutyMgmt() {
  const [selSchool,setSelSchool]=useState('s1'); const [selDate,setSelDate]=useState(today()); const [selShift,setSelShift]=useState<Shift>('morning'); const [selUser,setSelUser]=useState('');
  const schools=load<School>(K.schools); const users=load<AppUser>(K.users); const duties=load<DutySchedule>(K.duty);
  const days:string[]=[];
  for(let i=-3;i<=10;i++){const d=new Date();d.setDate(d.getDate()+i);days.push(d.toISOString().slice(0,10));}
  const getDuty=(sid:string,date:string,sh:Shift)=>duties.find(d=>d.schoolId===sid&&d.date===date&&d.shift===sh);
  const assign=()=>{
    if(!selUser){toast('กรุณาเลือกครูเวร','err');return;}
    const entry:DutySchedule={id:'duty-'+Date.now(),schoolId:selSchool,date:selDate,shift:selShift,teacherId:selUser,timestamp:Date.now()};
    const exist=getDuty(selSchool,selDate,selShift);
    if(exist) entry.id=exist.id;
    saveDuty(entry); toast(`กำหนดเวร ${users.find(u=>u.id===selUser)?.name?.split(' ')[0]} สำเร็จ`,'ok'); setTimeout(()=>window.location.reload(), 500);
  };
  const rem=(id:string)=>{deleteDuty(id);toast('ยกเลิกแล้ว','warn');setTimeout(()=>window.location.reload(), 500);};
  const dayNames=['อา','จ','อ','พ','พฤ','ศ','ส'];

  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:20}}>
      <div style={{flex:'1 1 290px',background:'#fff',border:'1px solid #e5e0d4',borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:'#252018',marginBottom:16}}>📋 มอบหมายครูเวร</div>
        <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>โรงเรียน</label>
          <select value={selSchool} onChange={e=>setSelSchool(e.target.value)} style={inp()}>
            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>วันที่</label><input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={inp()}/></div>
        <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>กะ</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
            {(['morning','afternoon']as Shift[]).map(s=>(
              <button key={s} onClick={()=>setSelShift(s)} style={{border:`2px solid ${selShift===s?SCHOOL_C[selSchool]:'#e5e0d4'}`,background:selShift===s?SCHOOL_C[selSchool]+'12':'#faf8f4',borderRadius:8,padding:'9px',cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>
                <div style={{fontSize:18}}>{s==='morning'?'🌅':'🌇'}</div>
                <div style={{fontSize:12,fontWeight:600,color:selShift===s?SCHOOL_C[selSchool]:'#574f44'}}>{s==='morning'?'เช้า':'บ่าย'}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>ครูเวร</label>
          <select value={selUser} onChange={e=>setSelUser(e.target.value)} style={inp()}>
            <option value="">— เลือกครู —</option>
            {users.filter(u=>u.schoolId===selSchool||u.role==='director').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {getDuty(selSchool,selDate,selShift)&&<div style={{background:'#fff8e1',border:'1px solid #f5d06e',borderRadius:7,padding:'7px 11px',marginBottom:10,fontSize:12,color:'#8a6000'}}>⚠ มีครูเวรแล้ว — จะถูกแทนที่</div>}
        <button onClick={assign} style={{width:'100%',background:SCHOOL_C[selSchool],color:'#faf8f4',border:'none',borderRadius:8,padding:'11px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Sarabun,sans-serif'}}>✓ บันทึกตารางเวร</button>
      </div>

      <div style={{flex:'2 1 400px',background:'#fff',border:'1px solid #e5e0d4',borderRadius:12,padding:20,overflowX:'auto'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#252018',marginBottom:14}}>📅 ตารางเวร 14 วัน</div>
        <div style={{minWidth:580}}>
          <div style={{display:'grid',gridTemplateColumns:'80px repeat(4,1fr)',gap:3,marginBottom:4}}>
            <div/>{schools.map(s=>(['morning','afternoon']as Shift[]).map(sh=>(
              <div key={s.id+sh} style={{textAlign:'center',fontSize:9,fontWeight:700,color:SCHOOL_C[s.id],textTransform:'uppercase',letterSpacing:'.05em',paddingBottom:3,borderBottom:`2px solid ${SCHOOL_C[s.id]}`}}>
                {s.shortName} {sh==='morning'?'เช้า':'บ่าย'}
              </div>
            )))}
          </div>
          {days.map(date=>{
            const isT=date===today(); const isP=date<today();
            const d=new Date(date+'T12:00:00');
            return(
              <div key={date} style={{display:'grid',gridTemplateColumns:'80px repeat(4,1fr)',gap:3,marginBottom:2,background:isT?'#f0f7f2':'transparent',borderRadius:5}}>
                <div style={{fontSize:11,fontFamily:'IBM Plex Mono,monospace',color:isT?'#1e5c3b':isP?'#ccc5b4':'#574f44',fontWeight:isT?700:400,padding:'6px 4px',display:'flex',alignItems:'center',gap:3}}>
                  {isT&&<span style={{width:4,height:4,borderRadius:'50%',background:'#1e5c3b',display:'inline-block'}}/>}
                  {dayNames[d.getDay()]} {d.getDate()}/{d.getMonth()+1}
                </div>
                {schools.map(s=>(['morning','afternoon']as Shift[]).map(sh=>{
                  const duty=getDuty(s.id,date,sh);
                  const uName=duty?users.find(u=>u.id===duty.teacherId)?.name?.split(' ').slice(-1)[0]:'';
                  return(
                    <div key={s.id+sh} style={{background:duty?SCHOOL_C[s.id]+'12':'#faf8f4',border:`1px solid ${duty?SCHOOL_C[s.id]+'40':'#e5e0d4'}`,borderRadius:4,padding:'5px 6px',minHeight:30,display:'flex',alignItems:'center',justifyContent:'space-between',opacity:isP?.75:1}}>
                      <span style={{fontSize:11,color:duty?SCHOOL_C[s.id]:'#ccc5b4',fontWeight:duty?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>{uName||(isP?'—':'ว่าง')}</span>
                      {duty&&!isP&&<button onClick={()=>rem(duty.id)} style={{background:'none',border:'none',fontSize:11,cursor:'pointer',color:'#b71c1c',padding:'0 2px',flexShrink:0}}>✕</button>}
                    </div>
                  );
                }))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CamMgmt({ user }: { user:AppUser }) {
  const [selSchool,setSelSchool]=useState(user.schoolId || 's1');
  const schools = load<School>(K.schools);
  return (
    <div>
      {user.role === 'director' && (
        <div style={{marginBottom:16, background:'#fff', border:'1px solid #e5e0d4', borderRadius:12, padding:20}}>
          <label style={{display:'block',fontSize:11,fontWeight:600,color:'#a89f8c',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>เลือกโรงเรียนเพื่อจัดการกล้อง</label>
          <select value={selSchool} onChange={e=>setSelSchool(e.target.value)} style={inp()}>
            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div style={{background:'#fff',border:'1px solid #e5e0d4',borderRadius:12,overflow:'hidden'}}>
        <Cameras schoolId={selSchool} />
      </div>
    </div>
  );
}

function DatabaseMgmt() {
  const handleExport = () => {
    const data = {
      reports: load(K.reports),
      duty: load(K.duty),
      users: load(K.users),
      cams: load(K.cams),
      schools: load(K.schools)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cctv_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('ส่งออกฐานข้อมูลสำเร็จ', 'ok');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (!confirm('ข้อมูลเก่าบน Firebase จะถูกแทนที่ด้วยไฟล์นี้\nคุณแน่ใจหรือไม่?')) return;
        toast('กำลังอัปโหลดข้อมูล...', 'ok');
        await importDatabase(json);
        toast('นำเข้าข้อมูลสำเร็จ!', 'ok');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        toast('ไฟล์ไม่ถูกต้อง หรือนำเข้าล้มเหลว', 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    const code = prompt('หากต้องการล้างข้อมูลทั้งหมด (รายงาน, ครู, กล้อง)\nพิมพ์คำว่า "CONFIRM" เพื่อยืนยัน');
    if (code !== 'CONFIRM') {
      if (code !== null) toast('ยกเลิกการล้างข้อมูล', 'warn');
      return;
    }
    toast('กำลังลบข้อมูลทั้งหมด...', 'warn');
    await clearAllDatabase();
    toast('ล้างฐานข้อมูลแล้ว', 'ok');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e0d4', borderRadius: 12, padding: 24, maxWidth: 500 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#252018', marginBottom: 20 }}>จัดการฐานข้อมูลระบบ</div>
      
      <div style={{ background: '#f0f7f2', border: '1px solid #b3dcc0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e5c3b', marginBottom: 4 }}>📤 ส่งออกข้อมูล (Backup)</div>
        <div style={{ fontSize: 12, color: '#4a6f56', marginBottom: 12 }}>ดาวน์โหลดข้อมูลทั้งหมดในระบบเก็บไว้เป็นไฟล์ .json</div>
        <button onClick={handleExport} style={{ background: '#1e5c3b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sarabun,sans-serif' }}>
          ดาวน์โหลด Backup
        </button>
      </div>

      <div style={{ background: '#fcf8e3', border: '1px solid #f5e49f', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#8a6d3b', marginBottom: 4 }}>📥 นำเข้าข้อมูล (Restore)</div>
        <div style={{ fontSize: 12, color: '#8a6d3b', marginBottom: 12, opacity: 0.8 }}>อัปโหลดไฟล์ .json กลับเข้าระบบ (จะบันทึกลง Firebase แทนที่ของเดิมที่มี ID ตรงกัน)</div>
        <label style={{ background: '#fff', border: '1px solid #e5e0d4', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sarabun,sans-serif', display: 'inline-block', color: '#574f44' }}>
          เลือกไฟล์ Backup.json
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ background: '#fde8e8', border: '1px solid rgba(183,28,28,.2)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#b71c1c', marginBottom: 4 }}>🗑️ ล้างฐานข้อมูล (Factory Reset)</div>
        <div style={{ fontSize: 12, color: '#b71c1c', marginBottom: 12, opacity: 0.8 }}>ลบข้อมูลรายงาน, ครูเวร, รายชื่อโรงเรียน และกล้องทั้งหมดแบบถาวร</div>
        <button onClick={handleClear} style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sarabun,sans-serif' }}>
          ลบข้อมูลทั้งหมด!
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ user, onLogout }: { user:AppUser; onLogout:()=>void }) {
  const [sub,setSub]=useState<'duty'|'users'|'cameras'|'database'>('duty');
  const handleLogout=()=>{ clearAdminSession(); toast('ออกจากระบบ Admin','warn'); onLogout(); };
  return(
    <div>
      <PageHeader title="ระบบ Admin" subtitle={`เข้าสู่ระบบโดย: ${user.name}`}>
        <button onClick={handleLogout} style={{background:'#fde8e8',color:'#b71c1c',border:'1px solid rgba(183,28,28,.2)',borderRadius:7,padding:'7px 14px',fontSize:13,cursor:'pointer',fontFamily:'Sarabun,sans-serif',fontWeight:600}}>🔒 ออก Admin</button>
      </PageHeader>
      <div style={{background:'#fff',borderBottom:'1px solid #e5e0d4',display:'flex',padding:'0 24px',gap:2,overflowX:'auto',whiteSpace:'nowrap'}}>
        {([['duty','📅','ตารางเวร'],['cameras','📹','ตั้งชื่อกล้อง'],['users','👨‍🏫','จัดการผู้ใช้'],['database','💾','ฐานข้อมูล']] as const).map(([id,ic,lb])=>(
          <button key={id} onClick={()=>setSub(id)} style={{padding:'10px 18px',fontSize:14,fontWeight:sub===id?600:400,color:sub===id?'#1e5c3b':'#a89f8c',borderBottom:sub===id?'2px solid #1e5c3b':'2px solid transparent',background:'none',border:'none',cursor:'pointer',fontFamily:'Sarabun,sans-serif',display:'flex',alignItems:'center',gap:6}}>
            {ic} {lb}
          </button>
        ))}
      </div>
      <div style={{padding:24}}>
        {sub==='duty'&&<DutyMgmt/>}
        {sub==='cameras'&&<CamMgmt user={user}/>}
        {sub==='users'&&<UserMgmt/>}
        {sub==='database'&&<DatabaseMgmt/>}
      </div>
    </div>
  );
}
