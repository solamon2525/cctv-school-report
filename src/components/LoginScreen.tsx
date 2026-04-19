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
  const ROLE_COLOR: Record<string,string> = { director:'#F59E0B', admin:'#10B981', teacher:'#3B82F6' };

  return (
    <div style={{ 
      minHeight:'100vh', 
      display:'flex', 
      flexDirection:'column', 
      alignItems:'center', 
      justifyContent:'center', 
      background:'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E0F2FE 100%)', 
      padding:'20px 16px',
      fontFamily:'Noto Sans Thai,sans-serif'
    }}>

      {/* School logos — side by side */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
        {schools.map((s, i) => {
          const logo = getSchoolLogo(s.id);
          return (
            <React.Fragment key={s.id}>
              <div style={{ textAlign:'center', animation: 'slide-up 0.5s ease-out' }}>
                {logo ? (
                  <img src={logo} alt={s.name}
                    style={{ width:88, height:88, objectFit:'contain', borderRadius:16, border:'2px solid var(--border-light)', background:'rgba(255, 255, 255, 0.9)', padding:6, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}/>
                ) : (
                  <div style={{ width:88, height:88, borderRadius:16, background: s.id==='s1'?'var(--gradient-primary)':'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                    </svg>
                  </div>
                )}
                <div style={{ fontSize:13, fontWeight:700, background: s.id==='s1'?'var(--gradient-primary)':'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop:10, maxWidth:110, fontFamily:'Prompt,sans-serif' }}>{s.shortName}</div>
              </div>
              {i < schools.length-1 && (
                <div style={{ fontSize:24, color:'rgba(0, 0, 0, 0.1)', fontWeight:300, margin:'0 8px' }}>·</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ fontSize:18, fontWeight:700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom:6, fontFamily:'Prompt,sans-serif' }}>ระบบรายงานเวรประจำวัน</div>
      <div style={{ fontSize:14, color:'var(--text-tertiary)', marginBottom:28, fontWeight: 500 }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>

      <div style={{ width:'100%', maxWidth: step==='select'?540:340, animation: 'fade-in 0.3s ease-out' }}>
        {step === 'select' && (
          <div style={{ background:'rgba(255, 255, 255, 0.95)', border:'1px solid var(--border-light)', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 50px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-light)', fontSize:12, fontWeight:700, background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)', color:'var(--primary-600)', textTransform:'uppercase', letterSpacing:'.08em' }}>เลือกผู้ใช้งาน</div>
            {[
              { label:'ผู้บริหาร',            users: users.filter(u=>u.role==='director') },
              { label:'โรงเรียนบ้านคำไผ่',    users: users.filter(u=>u.schoolId==='s1') },
              { label:'โรงเรียนบ้านหินเหลิ่ง',users: users.filter(u=>u.schoolId==='s2') },
            ].map(group => (
              <div key={group.label}>
                <div style={{ padding:'10px 24px 6px', fontSize:11, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.08em', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-light)' }}>{group.label}</div>
                {group.users.map(u => (
                  <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                    className="login-user-row"
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 24px', background:'none', border:'none', borderBottom:'1px solid var(--border-light)', cursor:'pointer', textAlign:'left', fontFamily:'Noto Sans Thai,sans-serif', transition:'all 0.2s ease' }}>
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt={u.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${ROLE_COLOR[u.role]}40`, boxShadow: `0 2px 8px ${ROLE_COLOR[u.role]}20` }} />
                    ) : (
                      <div style={{ width:44, height:44, borderRadius:'50%', background: ROLE_COLOR[u.role]+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:ROLE_COLOR[u.role], flexShrink:0, boxShadow: `0 2px 8px ${ROLE_COLOR[u.role]}15` }}>
                        {u.name.split(' ').slice(-1)[0].slice(0,2)}
                      </div>
                    )}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{ROLE_LABEL[u.role]} · {schoolName(u.schoolId)}</div>
                    </div>
                    <span style={{ color:'var(--text-tertiary)', fontSize:20, opacity:0.4 }}>›</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {step === 'pin' && selUser && (
          <div style={{ background:'rgba(255, 255, 255, 0.95)', border:'1px solid var(--border-light)', borderRadius:20, padding:'36px 32px', boxShadow:'0 20px 50px rgba(0, 0, 0, 0.1)', textAlign:'center', animation: 'bounce-in 0.3s ease-out' }}>
            <button onClick={() => { setStep('select'); setPin(''); setDots(0); setErr(''); }}
              style={{ display:'block', background:'none', border:'none', color:'var(--primary-600)', fontSize:14, cursor:'pointer', marginBottom:18, fontFamily:'Noto Sans Thai,sans-serif', fontWeight: 600, transition: 'all 0.2s', padding:'4px 8px' }}>
              ‹ กลับ
            </button>
            {selUser.photoUrl ? (
              <img src={selUser.photoUrl} alt={selUser.name} style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover', margin:'0 auto 14px', display:'block', border:`3px solid ${ROLE_COLOR[selUser.role]}`, boxShadow: `0 4px 16px ${ROLE_COLOR[selUser.role]}30` }} />
            ) : (
              <div style={{ width:68, height:68, borderRadius:'50%', background: `linear-gradient(135deg, ${ROLE_COLOR[selUser.role]} 0%, ${ROLE_COLOR[selUser.role]}dd 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', margin:'0 auto 14px', boxShadow: `0 4px 16px ${ROLE_COLOR[selUser.role]}30` }}>
                {selUser.name.split(' ').slice(-1)[0].slice(0,2)}
              </div>
            )}
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', marginBottom:4, fontFamily:'Prompt,sans-serif' }}>{selUser.name}</div>
            <div style={{ fontSize:13, color:'var(--text-tertiary)', marginBottom:28, fontWeight: 500 }}>{ROLE_LABEL[selUser.role]}</div>
            <div className={shaking ? 'pin-shake' : ''} style={{ display:'flex', justifyContent:'center', gap:18, marginBottom:32 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:16, height:16, borderRadius:'50%', background:i<dots?ROLE_COLOR[selUser.role]:'var(--border-light)', transition:'all .15s', boxShadow: i<dots ? `0 0 0 5px ${ROLE_COLOR[selUser.role]}25` : 'none' }}/>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
                <button key={i} onClick={() => d==='⌫'?handleBack():d?handleDigit(d):null}
                  disabled={!d&&d!=='0'}
                  style={{ 
                    height: 64, 
                    borderRadius: 14, 
                    background: d==='⌫' ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' : d ? 'rgba(255, 255, 255, 0.8)' : 'transparent', 
                    border: d ? '1.5px solid var(--border-light)' : 'none', 
                    fontSize: d==='⌫' ? 24 : 26, 
                    fontWeight: 700, 
                    color: d==='⌫' ? '#E11D48' : 'var(--text-primary)', 
                    cursor: d ? 'pointer' : 'default', 
                    fontFamily: 'IBM Plex Mono,monospace', 
                    opacity: !d && d!=='0' ? 0 : 1,
                    boxShadow: d ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
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
            {err && <div style={{ color:'#E11D48', fontSize:13, background:'rgba(225, 29, 72, 0.1)', borderRadius:10, padding:'10px 14px', fontWeight: 600, border: '1px solid rgba(225, 29, 72, 0.2)' }}>{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
