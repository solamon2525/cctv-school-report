import React, { useState } from 'react';
import { load, saveVal, startAdminSession, AppUser, School, K, getSchoolLogo } from '../lib/store';
import { addLoginLog } from '../lib/firebase';
import { toast } from '../lib/toast';

interface Props { onLogin: (user: AppUser) => void; }

export default function LoginScreen({ onLogin }: Props) {
  const [step, setStep]   = useState<'select'|'pin'>('select');
  const [selUser, setSelUser] = useState<AppUser|null>(null);
  const [pin, setPin]     = useState('');
  const [dots, setDots]   = useState<number>(0);
  const [err, setErr]     = useState('');
  const [shaking, setShaking] = useState(false);

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
      addLoginLog({ timestamp: Date.now(), userId: selUser.id, userName: selUser.name, role: selUser.role, schoolId: selUser.schoolId ?? null, success: true }).catch(() => {});
      if (selUser.role === 'admin' || selUser.role === 'director') startAdminSession(selUser.id);
      saveVal(K.activeUser, selUser.id);
      toast(`ยินดีต้อนรับ ${selUser.name.split(' ')[0]}`, 'ok');
      onLogin(selUser);
    } else {
      addLoginLog({ timestamp: Date.now(), userId: selUser.id, userName: selUser.name, role: selUser.role, schoolId: selUser.schoolId ?? null, success: false, failReason: 'wrong_pin' }).catch(() => {});
      setErr('PIN ไม่ถูกต้อง'); setPin(''); setDots(0);
      setShaking(true); setTimeout(() => setShaking(false), 400);
    }
  };

  const schoolName = (id: string|null) =>
    id ? (schools.find(s=>s.id===id)?.shortName||'') : 'ดูได้ทั้ง 2 โรงเรียน';
  const ROLE_LABEL: Record<string,string> = { director:'ผู้อำนวยการ', admin:'ครู (Admin)', teacher:'ครู' };
  const ROLE_COLOR: Record<string,string> = { director:'#f59e0b', admin:'#0fa385', teacher:'#3b82f6' };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #e8f5f0 0%, #fafaf9 50%, #eff6ff 100%)', padding:'0 16px' }}>

      {/* School logos — side by side */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
        {schools.map((s, i) => {
          const logo = getSchoolLogo(s.id);
          return (
            <React.Fragment key={s.id}>
              <div style={{ textAlign:'center', animation: 'slide-up 0.5s ease-out' }}>
                {logo ? (
                  <img src={logo} alt={s.name}
                    style={{ width:80, height:80, objectFit:'contain', borderRadius:14, border:'2px solid rgba(15, 163, 133, 0.2)', background:'#fff', padding:4, boxShadow: '0 4px 12px rgba(15, 163, 133, 0.1)' }}/>
                ) : (
                  <div style={{ width:80, height:80, borderRadius:14, background: s.id==='s1'?'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)':'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                    </svg>
                  </div>
                )}
                <div style={{ fontSize:12, fontWeight:700, background: s.id==='s1'?'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)':'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop:8, maxWidth:100 }}>{s.shortName}</div>
              </div>
              {i < schools.length-1 && (
                <div style={{ fontSize:22, color:'rgba(15, 163, 133, 0.2)', fontWeight:300, margin:'0 4px' }}>·</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ fontSize:16, fontWeight:800, background: 'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom:4 }}>ระบบรายงานเวรประจำวัน</div>
      <div style={{ fontSize:13, color:'#78716c', marginBottom:24, fontWeight: 500 }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>

      <div style={{ width:'100%', maxWidth: step==='select'?520:320, animation: 'fade-in 0.3s ease-out' }}>
        {step === 'select' && (
          <div style={{ background:'#fff', border:'1px solid rgba(15, 163, 133, 0.15)', borderRadius:18, overflow:'hidden', boxShadow:'0 8px 24px rgba(15, 163, 133, 0.12)' }}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(15, 163, 133, 0.08)', fontSize:12, fontWeight:700, background: 'linear-gradient(135deg, rgba(15, 163, 133, 0.03) 0%, rgba(27, 184, 159, 0.03) 100%)', color:'#0fa385', textTransform:'uppercase', letterSpacing:'.08em' }}>เลือกผู้ใช้งาน</div>
            {[
              { label:'ผู้บริหาร',            users: users.filter(u=>u.role==='director') },
              { label:'โรงเรียนบ้านคำไผ่',    users: users.filter(u=>u.schoolId==='s1') },
              { label:'โรงเรียนบ้านหินเหลิ่ง',users: users.filter(u=>u.schoolId==='s2') },
            ].map(group => (
              <div key={group.label}>
                <div style={{ padding:'8px 22px 4px', fontSize:11, fontWeight:700, color:'#a8a29e', textTransform:'uppercase', letterSpacing:'.08em', background:'#fafaf9', borderBottom:'1px solid rgba(15, 163, 133, 0.05)' }}>{group.label}</div>
                {group.users.map(u => (
                  <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                    className="login-user-row"
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 22px', background:'none', border:'none', borderBottom:'1px solid rgba(15, 163, 133, 0.05)', cursor:'pointer', textAlign:'left', fontFamily:'Sarabun,sans-serif' }}>
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt={u.name} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${ROLE_COLOR[u.role]}40`, boxShadow: `0 2px 8px ${ROLE_COLOR[u.role]}20` }} />
                    ) : (
                      <div style={{ width:40, height:40, borderRadius:'50%', background: ROLE_COLOR[u.role]+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:ROLE_COLOR[u.role], flexShrink:0, boxShadow: `0 2px 8px ${ROLE_COLOR[u.role]}15` }}>
                        {u.name.split(' ').slice(-1)[0].slice(0,2)}
                      </div>
                    )}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:'#292524' }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'#a8a29e' }}>{ROLE_LABEL[u.role]} · {schoolName(u.schoolId)}</div>
                    </div>
                    <span style={{ color:'rgba(15, 163, 133, 0.3)', fontSize:18 }}>›</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {step === 'pin' && selUser && (
          <div style={{ background:'#fff', border:'1px solid rgba(15, 163, 133, 0.15)', borderRadius:18, padding:'32px 28px', boxShadow:'0 8px 24px rgba(15, 163, 133, 0.12)', textAlign:'center', animation: 'bounce-in 0.3s ease-out' }}>
            <button onClick={() => { setStep('select'); setPin(''); setDots(0); setErr(''); }}
              style={{ display:'block', background:'none', border:'none', color:'#0fa385', fontSize:14, cursor:'pointer', marginBottom:16, fontFamily:'Sarabun,sans-serif', fontWeight: 600, transition: 'all 0.2s' }}>
              ‹ กลับ
            </button>
            {selUser.photoUrl ? (
              <img src={selUser.photoUrl} alt={selUser.name} style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover', margin:'0 auto 12px', display:'block', border:`3px solid ${ROLE_COLOR[selUser.role]}`, boxShadow: `0 4px 12px ${ROLE_COLOR[selUser.role]}30` }} />
            ) : (
              <div style={{ width:60, height:60, borderRadius:'50%', background: `linear-gradient(135deg, ${ROLE_COLOR[selUser.role]} 0%, ${ROLE_COLOR[selUser.role]}dd 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', margin:'0 auto 12px', boxShadow: `0 4px 12px ${ROLE_COLOR[selUser.role]}30` }}>
                {selUser.name.split(' ').slice(-1)[0].slice(0,2)}
              </div>
            )}
            <div style={{ fontSize:16, fontWeight:700, color:'#292524', marginBottom:3 }}>{selUser.name}</div>
            <div style={{ fontSize:13, color:'#a8a29e', marginBottom:24, fontWeight: 500 }}>{ROLE_LABEL[selUser.role]}</div>
            <div className={shaking ? 'pin-shake' : ''} style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:28 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:i<dots?ROLE_COLOR[selUser.role]:'#e7e5e4', transition:'all .15s', boxShadow: i<dots ? `0 0 0 4px ${ROLE_COLOR[selUser.role]}25` : 'none' }}/>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
                <button key={i} onClick={() => d==='⌫'?handleBack():d?handleDigit(d):null}
                  disabled={!d&&d!=='0'}
                  style={{ 
                    height: 60, borderRadius: 14, 
                    background: d==='⌫' ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : d ? '#fff' : 'transparent', 
                    border: d ? '1.5px solid rgba(15, 163, 133, 0.15)' : 'none', 
                    fontSize: d==='⌫' ? 22 : 24, fontWeight: 700, 
                    color: d==='⌫' ? '#ef4444' : '#292524', 
                    cursor: d ? 'pointer' : 'default', 
                    fontFamily: 'IBM Plex Mono,monospace', 
                    opacity: !d && d!=='0' ? 0 : 1,
                    boxShadow: d ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                  onPointerDown={(e) => {
                    if (d) e.currentTarget.style.transform = 'scale(0.92)';
                  }}
                  onPointerUp={(e) => {
                    if (d) e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onPointerLeave={(e) => {
                    if (d) e.currentTarget.style.transform = 'scale(1)';
                  }}
                  >
                  {d}
                </button>
              ))}
            </div>
            {err && <div style={{ color:'#ef4444', fontSize:13, background:'#fef2f2', borderRadius:10, padding:'8px 14px', fontWeight: 500, border: '1px solid #fecaca' }}>{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
