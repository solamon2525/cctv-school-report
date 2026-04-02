import React, { useState } from 'react';
import { load, saveVal, startAdminSession, AppUser, School, K, getSchoolLogo } from '../lib/store';
import { toast } from '../lib/toast';

interface Props { onLogin: (user: AppUser) => void; }

export default function LoginScreen({ onLogin }: Props) {
  const [step, setStep]   = useState<'select'|'pin'>('select');
  const [selUser, setSelUser] = useState<AppUser|null>(null);
  const [pin, setPin]     = useState('');
  const [dots, setDots]   = useState<number>(0);
  const [err, setErr]     = useState('');

  const users   = load<AppUser>(K.users);
  const schools = load<School>(K.schools);

  const handleDigit = (d: string) => {
    if (dots >= 4) return;
    const next = pin + d;
    setPin(next); setDots(next.length); setErr('');
    if (next.length === 4) setTimeout(() => verify(next), 180);
  };
  const handleBack = () => { const np = pin.slice(0,-1); setPin(np); setDots(np.length); };

  const verify = (p: string) => {
    if (!selUser) return;
    if (p === selUser.pin) {
      if (selUser.role === 'admin' || selUser.role === 'director') startAdminSession(selUser.id);
      saveVal(K.activeUser, selUser.id);
      toast(`ยินดีต้อนรับ ${selUser.name.split(' ')[0]}`, 'ok');
      onLogin(selUser);
    } else {
      setErr('PIN ไม่ถูกต้อง'); setPin(''); setDots(0);
    }
  };

  const schoolName = (id: string|null) =>
    id ? (schools.find(s=>s.id===id)?.shortName||'') : 'ดูได้ทั้ง 2 โรงเรียน';
  const ROLE_LABEL: Record<string,string> = { director:'ผู้อำนวยการ', admin:'ครู (Admin)', teacher:'ครู' };
  const ROLE_COLOR: Record<string,string> = { director:'#b8891a', admin:'#1e5c3b', teacher:'#1a4a7a' };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg,#f0f7f2 0%,#faf8f4 60%,#eff4fb 100%)', padding:'0 16px' }}>

      {/* School logos — side by side */}
      <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:28, flexWrap:'wrap', justifyContent:'center' }}>
        {schools.map((s, i) => {
          const logo = getSchoolLogo(s.id);
          return (
            <React.Fragment key={s.id}>
              <div style={{ textAlign:'center' }}>
                {logo ? (
                  <img src={logo} alt={s.name}
                    style={{ width:80, height:80, objectFit:'contain', borderRadius:12, border:'1px solid #e5e0d4', background:'#fff', padding:4 }}/>
                ) : (
                  <div style={{ width:80, height:80, borderRadius:12, background:s.id==='s1'?'#1e5c3b':'#1a4a7a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#faf8f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                    </svg>
                  </div>
                )}
                <div style={{ fontSize:11, fontWeight:600, color:s.id==='s1'?'#1e5c3b':'#1a4a7a', marginTop:6, maxWidth:100 }}>{s.shortName}</div>
              </div>
              {i < schools.length-1 && (
                <div style={{ fontSize:22, color:'#ccc5b4', fontWeight:300 }}>·</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:3 }}>ระบบรายงานเวรประจำวัน</div>
      <div style={{ fontSize:12, color:'#a89f8c', marginBottom:22 }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>

      <div style={{ width:'100%', maxWidth: step==='select'?520:320 }}>
        {step === 'select' && (
          <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.07)' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f3f0e8', fontSize:11, fontWeight:700, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.06em' }}>เลือกผู้ใช้งาน</div>
            {[
              { label:'ผู้บริหาร',            users: users.filter(u=>u.role==='director') },
              { label:'โรงเรียนบ้านคำไผ่',    users: users.filter(u=>u.schoolId==='s1') },
              { label:'โรงเรียนบ้านหินเหลิ่ง',users: users.filter(u=>u.schoolId==='s2') },
            ].map(group => (
              <div key={group.label}>
                <div style={{ padding:'7px 20px 3px', fontSize:10, fontWeight:700, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.07em', background:'#faf8f4', borderBottom:'1px solid #f3f0e8' }}>{group.label}</div>
                {group.users.map(u => (
                  <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 20px', background:'none', border:'none', borderBottom:'1px solid #f3f0e8', cursor:'pointer', textAlign:'left', fontFamily:'Sarabun,sans-serif' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:ROLE_COLOR[u.role]+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:ROLE_COLOR[u.role], flexShrink:0 }}>
                      {u.name.split(' ').slice(-1)[0].slice(0,2)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#252018' }}>{u.name}</div>
                      <div style={{ fontSize:11, color:'#a89f8c' }}>{ROLE_LABEL[u.role]} · {schoolName(u.schoolId)}</div>
                    </div>
                    <span style={{ color:'#ccc5b4', fontSize:18 }}>›</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {step === 'pin' && selUser && (
          <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:'28px 24px', boxShadow:'0 4px 24px rgba(0,0,0,.07)', textAlign:'center' }}>
            <button onClick={() => { setStep('select'); setPin(''); setDots(0); setErr(''); }}
              style={{ display:'block', background:'none', border:'none', color:'#a89f8c', fontSize:14, cursor:'pointer', marginBottom:14, fontFamily:'Sarabun,sans-serif' }}>
              ‹ กลับ
            </button>
            <div style={{ width:48, height:48, borderRadius:'50%', background:ROLE_COLOR[selUser.role]+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:ROLE_COLOR[selUser.role], margin:'0 auto 10px' }}>
              {selUser.name.split(' ').slice(-1)[0].slice(0,2)}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#252018', marginBottom:3 }}>{selUser.name}</div>
            <div style={{ fontSize:12, color:'#a89f8c', marginBottom:20 }}>{ROLE_LABEL[selUser.role]}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:22 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:13, height:13, borderRadius:'50%', background:i<dots?ROLE_COLOR[selUser.role]:'#e5e0d4', transition:'background .12s' }}/>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
                <button key={i} onClick={() => d==='⌫'?handleBack():d?handleDigit(d):null}
                  disabled={!d&&d!=='0'}
                  style={{ height:48, borderRadius:9, background:d==='⌫'?'#fde8e8':d?'#faf8f4':'transparent', border:d?'1px solid #e5e0d4':'none', fontSize:d==='⌫'?16:19, fontWeight:600, color:d==='⌫'?'#b71c1c':'#252018', cursor:d?'pointer':'default', fontFamily:'IBM Plex Mono,monospace', opacity:!d&&d!=='0'?0:1 }}>
                  {d}
                </button>
              ))}
            </div>
            {err && <div style={{ color:'#b71c1c', fontSize:13, background:'#fde8e8', borderRadius:7, padding:'6px 12px' }}>{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
