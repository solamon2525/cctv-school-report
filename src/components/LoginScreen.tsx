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
      background:'linear-gradient(135deg, #064E3B 0%, #0D6B54 25%, #0F766E 50%, #14B8A6 75%, #2DD4BF 100%)',
      padding:'20px 16px',
      fontFamily:'Noto Sans Thai,sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated gradient mesh background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.15) 0%, transparent 50%)',
        animation: 'gradient-shift 15s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-100px',
        right: '-100px',
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(45, 212, 191, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-80px',
        left: '-80px',
        animation: 'float 25s ease-in-out infinite reverse'
      }} />

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(10deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .login-user-row {
          position: relative;
          overflow: hidden;
        }
        .login-user-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        .login-user-row:hover::before {
          left: 100%;
        }
        .login-user-row:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateX(4px);
        }
      `}</style>

      {/* Content wrapper with relative positioning */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* School logos — side by side */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
          {schools.map((s, i) => {
            const logo = getSchoolLogo(s.id);
            return (
              <React.Fragment key={s.id}>
                <div style={{ textAlign:'center', animation: 'slide-up 0.5s ease-out' }}>
                  {logo ? (
                    <img src={logo} alt={s.name}
                      style={{ width:88, height:88, objectFit:'contain', borderRadius:16, border:'3px solid rgba(255, 255, 255, 0.3)', background:'rgba(255, 255, 255, 0.1)', padding:6, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}/>
                  ) : (
                    <div style={{ width:88, height:88, borderRadius:16, background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)', border: '2px solid rgba(255, 255, 255, 0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ fontSize:13, fontWeight:700, color: '#fff', marginTop:10, maxWidth:110, fontFamily:'Prompt,sans-serif', textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>{s.shortName}</div>
                </div>
                {i < schools.length-1 && (
                  <div style={{ fontSize:24, color:'rgba(255, 255, 255, 0.3)', fontWeight:300, margin:'0 8px' }}>·</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ fontSize:20, fontWeight:700, color: '#fff', marginBottom:6, fontFamily:'Prompt,sans-serif', textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>ระบบรายงานเวรประจำวัน</div>
        <div style={{ fontSize:14, color:'rgba(255, 255, 255, 0.85)', marginBottom:28, fontWeight: 500, textShadow: '0 1px 4px rgba(0, 0, 0, 0.1)' }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>

        <div style={{ width:'100%', maxWidth: step==='select'?540:340, animation: 'fade-in 0.3s ease-out' }}>
          {step === 'select' && (
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <span style={{ 
                fontSize: '10px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '6px 12px', 
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                display: 'inline-block'
              }}>
                BUILD v2.2.0 • 19 APR 2026 14:30
              </span>
            </div>
          )}
          {step === 'select' && (
            <div style={{ background:'rgba(255, 255, 255, 0.95)', border:'1px solid rgba(255, 255, 255, 0.3)', borderRadius:24, overflow:'hidden', boxShadow:'0 25px 50px rgba(0, 0, 0, 0.3), inset 0 0 1px rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(0, 0, 0, 0.05)', fontSize:12, fontWeight:700, background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', color:'var(--primary-600)', textTransform:'uppercase', letterSpacing:'.08em' }}>เลือกผู้ใช้งาน</div>
              {[
                { label:'ผู้บริหาร',            users: users.filter(u=>u.role==='director') },
                { label:'โรงเรียนบ้านคำไผ่',    users: users.filter(u=>u.schoolId==='s1') },
                { label:'โรงเรียนบ้านหินเหลิ่ง',users: users.filter(u=>u.schoolId==='s2') },
              ].map(group => (
                <div key={group.label}>
                  <div style={{ padding:'12px 24px 8px', fontSize:11, fontWeight:700, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.08em', background:'rgba(0, 0, 0, 0.02)', borderBottom:'1px solid rgba(0, 0, 0, 0.05)' }}>{group.label}</div>
                  {group.users.map((u, idx) => (
                    <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                      className="login-user-row"
                      style={{ 
                        width:'100%', 
                        display:'flex', 
                        alignItems:'center', 
                        gap:14, 
                        padding:'16px 24px', 
                        background:'none', 
                        border:'none', 
                        borderBottom:'1px solid rgba(0, 0, 0, 0.05)', 
                        cursor:'pointer', 
                        textAlign:'left', 
                        fontFamily:'Noto Sans Thai,sans-serif', 
                        transition:'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        animation: `slide-up 0.4s ease-out ${idx * 0.05}s both`
                      }}>
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt={u.name} style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`3px solid ${ROLE_COLOR[u.role]}40`, boxShadow: `0 4px 12px ${ROLE_COLOR[u.role]}30`, transition: 'all 0.3s' }} />
                      ) : (
                        <div style={{ width:48, height:48, borderRadius:'50%', background: `linear-gradient(135deg, ${ROLE_COLOR[u.role]} 0%, ${ROLE_COLOR[u.role]}dd 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0, boxShadow: `0 4px 12px ${ROLE_COLOR[u.role]}30`, transition: 'all 0.3s' }}>
                          {u.name.split(' ').slice(-1)[0].slice(0,2)}
                        </div>
                      )}
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{ROLE_LABEL[u.role]} · {schoolName(u.schoolId)}</div>
                      </div>
                      <span style={{ color:'var(--text-tertiary)', fontSize:20, opacity:0.4, transition: 'all 0.3s' }}>›</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {step === 'pin' && selUser && (
            <div style={{ background:'rgba(255, 255, 255, 0.95)', border:'1px solid rgba(255, 255, 255, 0.3)', borderRadius:24, padding:'40px 32px', boxShadow:'0 25px 50px rgba(0, 0, 0, 0.3), inset 0 0 1px rgba(255, 255, 255, 0.5)', textAlign:'center', animation: 'bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', backdropFilter: 'blur(10px)' }}>
              <button onClick={() => { setStep('select'); setPin(''); setDots(0); setErr(''); }}
                style={{ display:'block', background:'none', border:'none', color:'var(--primary-600)', fontSize:14, cursor:'pointer', marginBottom:20, fontFamily:'Noto Sans Thai,sans-serif', fontWeight: 600, transition: 'all 0.3s', padding:'6px 12px', borderRadius: '8px' }}>
                ‹ กลับ
              </button>
              {selUser.photoUrl ? (
                <img src={selUser.photoUrl} alt={selUser.name} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', display:'block', border:`4px solid ${ROLE_COLOR[selUser.role]}`, boxShadow: `0 8px 24px ${ROLE_COLOR[selUser.role]}40`, animation: 'slide-up 0.4s ease-out' }} />
              ) : (
                <div style={{ width:80, height:80, borderRadius:'50%', background: `linear-gradient(135deg, ${ROLE_COLOR[selUser.role]} 0%, ${ROLE_COLOR[selUser.role]}dd 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', margin:'0 auto 16px', boxShadow: `0 8px 24px ${ROLE_COLOR[selUser.role]}40`, animation: 'slide-up 0.4s ease-out' }}>
                  {selUser.name.split(' ').slice(-1)[0].slice(0,2)}
                </div>
              )}
              <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6, fontFamily:'Prompt,sans-serif' }}>{selUser.name}</div>
              <div style={{ fontSize:13, color:'var(--text-tertiary)', marginBottom:32, fontWeight: 500 }}>{ROLE_LABEL[selUser.role]}</div>
              <div className={shaking ? 'pin-shake' : ''} style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:36 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:18, height:18, borderRadius:'50%', background:i<dots?ROLE_COLOR[selUser.role]:'rgba(0, 0, 0, 0.1)', transition:'all .2s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: i<dots ? `0 0 0 6px ${ROLE_COLOR[selUser.role]}25` : 'none', transform: i<dots ? 'scale(1.1)' : 'scale(1)' }}/>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:16 }}>
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
                  <button key={i} onClick={() => d==='⌫'?handleBack():d?handleDigit(d):null}
                    disabled={!d&&d!=='0'}
                    style={{ 
                      height: 68, 
                      borderRadius: 16, 
                      background: d==='⌫' ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' : d ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)' : 'transparent', 
                      border: d ? '1.5px solid rgba(0, 0, 0, 0.08)' : 'none', 
                      fontSize: d==='⌫' ? 26 : 28, 
                      fontWeight: 700, 
                      color: d==='⌫' ? '#E11D48' : 'var(--text-primary)', 
                      cursor: d ? 'pointer' : 'default', 
                      fontFamily: 'IBM Plex Mono,monospace', 
                      opacity: !d && d!=='0' ? 0 : 1,
                      boxShadow: d ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onPointerDown={(e) => {
                      if (d) {
                        e.currentTarget.style.transform = 'scale(0.92)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                      }
                    }}
                    onPointerUp={(e) => {
                      if (d) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (d) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    >
                    {d}
                  </button>
                ))}
              </div>
              {err && <div style={{ color:'#E11D48', fontSize:13, background:'rgba(225, 29, 72, 0.1)', borderRadius:12, padding:'12px 16px', fontWeight: 600, border: '1.5px solid rgba(225, 29, 72, 0.2)', animation: 'slide-up 0.3s ease-out' }}>{err}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
