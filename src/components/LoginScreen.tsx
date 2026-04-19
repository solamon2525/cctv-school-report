import React, { useState, useEffect } from 'react';
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
  const [isOnline, setIsOnline] = useState(true);

  const users   = load<AppUser>(K.users);
  const schools = load<School>(K.schools);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(10deg); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .login-user-row {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .login-user-row:hover {
          background: rgba(16, 185, 129, 0.05) !important;
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 1;
        }
        .marquee-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
          padding: 6px 0;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 100;
          backdrop-filter: blur(5px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .marquee-text {
          display: inline-block;
          animation: marquee 20s linear infinite;
          font-size: 13px;
          font-weight: 500;
        }
        @media (max-width: 480px) {
          .login-container {
            border-radius: 20px !important;
          }
          .school-logo {
            width: 80px !important;
            height: 80px !important;
          }
        }
      `}</style>

      {/* Marquee Banner */}
      <div className="marquee-container">
        <div className="marquee-text">
          📣 ประกาศ: ครูเวร สามารถ login และบันทึกข้อมูลได้ตามเวรประจำวัน &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          📣 ประกาศ: ครูเวร สามารถ login และบันทึกข้อมูลได้ตามเวรประจำวัน
        </div>
      </div>

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: step==='select'?540:380, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        
        {/* Status Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          background: 'rgba(0,0,0,0.3)', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          marginBottom: 20,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: isOnline ? '#10B981' : '#EF4444',
            boxShadow: isOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444'
          }} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isOnline ? 'System Online' : 'System Offline'}
          </span>
        </div>

        {/* School logos */}
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
          {schools.map((s, i) => {
            const logo = getSchoolLogo(s.id);
            return (
              <React.Fragment key={s.id}>
                <div style={{ textAlign:'center', animation: 'slide-up 0.5s ease-out' }}>
                  {logo ? (
                    <img src={logo} alt={s.name} className="school-logo"
                      style={{ width:90, height:90, objectFit:'contain' }}/>
                  ) : (
                    <div className="school-logo" style={{ width:80, height:80, borderRadius:16, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/></svg>
                    </div>
                  )}
                  <div style={{ fontSize:12, fontWeight:700, color: '#fff', marginTop:8, fontFamily:'Prompt,sans-serif' }}>{s.shortName}</div>
                </div>
                {i < schools.length-1 && <div style={{ fontSize:20, color:'rgba(255,255,255,0.3)' }}>·</div>}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize:22, fontWeight:700, color: '#fff', marginBottom:4, fontFamily:'Prompt,sans-serif' }}>ระบบรายงานเวรประจำวัน</div>
          <div style={{ fontSize:14, color:'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>
        </div>

        <div style={{ width:'100%', animation: 'fade-in 0.3s ease-out' }}>
          {step === 'select' && (
            <div className="login-container" style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #eee', fontSize:13, fontWeight:700, color:'#064E3B', background: '#f8faf9' }}>เลือกผู้ใช้งาน</div>
              {[
                { label:'ผู้บริหาร', users: users.filter(u=>u.role==='director') },
                { label:'โรงเรียนบ้านคำไผ่', users: users.filter(u=>u.schoolId==='s1') },
                { label:'โรงเรียนบ้านหินเหลิ่ง', users: users.filter(u=>u.schoolId==='s2') },
              ].map(group => (
                <div key={group.label}>
                  <div style={{ padding:'8px 20px', fontSize:11, fontWeight:700, color:'#666', textTransform:'uppercase', background:'#fcfcfc', borderBottom:'1px solid #f0f0f0' }}>{group.label}</div>
                  {group.users.map((u, idx) => (
                    <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                      className="login-user-row"
                      style={{ 
                        width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 20px', 
                        background:'none', border:'none', borderBottom:'1px solid #f5f5f5', cursor:'pointer', textAlign:'left'
                      }}>
                      <img src={u.photoUrl || 'https://placehold.co/100?text=USER'} alt={u.name} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', border:`2px solid ${ROLE_COLOR[u.role]}` }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#333' }}>{u.name}</div>
                        <div style={{ fontSize:11, color:'#888' }}>{ROLE_LABEL[u.role]} • {schoolName(u.schoolId)}</div>
                      </div>
                      <div style={{ color:'#ccc' }}>›</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {step === 'pin' && selUser && (
            <div className="login-container" style={{ background:'#fff', borderRadius:24, padding:32, textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }}>
              <button onClick={()=>setStep('select')} style={{ position:'absolute', top:20, left:20, background:'none', border:'none', color:'#999', cursor:'pointer', fontSize:14 }}>← กลับ</button>
              <img src={selUser.photoUrl || 'https://placehold.co/100?text=USER'} alt={selUser.name} style={{ width:80, height:80, borderRadius:'50%', marginBottom:16, border:`4px solid ${ROLE_COLOR[selUser.role]}` }} />
              <div style={{ fontSize:18, fontWeight:700, color:'#333' }}>{selUser.name}</div>
              <div style={{ fontSize:13, color:'#666', marginBottom:24 }}>กรุณาใส่รหัส PIN 4 หลัก</div>
              
              <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:32 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:16, height:16, borderRadius:'50%', border:'2px solid #ddd', background: dots > i ? '#064E3B' : 'none', transition:'all 0.2s' }} />
                ))}
              </div>

              {err && <div style={{ color:'#EF4444', fontSize:13, marginBottom:16, fontWeight:600 }}>{err}</div>}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} onClick={()=>handleDigit(d.toString())} style={{ height:60, borderRadius:12, border:'1px solid #eee', background:'#fcfcfc', fontSize:20, fontWeight:700, color:'#333', cursor:'pointer' }}>{d}</button>
                ))}
                <div />
                <button onClick={()=>handleDigit('0')} style={{ height:60, borderRadius:12, border:'1px solid #eee', background:'#fcfcfc', fontSize:20, fontWeight:700, color:'#333', cursor:'pointer' }}>0</button>
                <button onClick={handleBack} style={{ height:60, borderRadius:12, border:'none', background:'none', color:'#999', cursor:'pointer' }}>⌫</button>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
            BUILD v2.2.2 • 19 APR 2026
          </span>
        </div>
      </div>
    </div>
  );
}
