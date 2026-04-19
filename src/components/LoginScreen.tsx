import React, { useState, useEffect, useMemo } from 'react';
import { load, saveVal, startAdminSession, AppUser, School, K, getSchoolLogo, DutyReport, today } from '../lib/store';
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
  const [statDays, setStatDays] = useState<1|7|15|30>(7);

  const users   = load<AppUser>(K.users);
  const schools = load<School>(K.schools);
  const reports = load<DutyReport>(K.reports);

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

  // Calculate stats based on selected days
  const stats = useMemo(() => {
    const now = new Date();
    const t = today();
    
    if (statDays === 1) {
      const todayReports = reports.filter(r => r.date === t);
      const totalRequired = 4; // 2 schools * 2 shifts
      const completed = todayReports.length;
      const percent = Math.min(100, Math.round((completed / totalRequired) * 100));
      return { completed, total: totalRequired, percent, label: 'วันนี้' };
    } else {
      // Calculate for range
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - statDays);
      const rangeReports = reports.filter(r => new Date(r.date) >= cutoff);
      
      // Group by date to see how many days were fully reported
      const daysMap: Record<string, number> = {};
      for (let i = 0; i < statDays; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        daysMap[d.toISOString().slice(0, 10)] = 0;
      }
      
      rangeReports.forEach(r => {
        if (daysMap[r.date] !== undefined) daysMap[r.date]++;
      });

      const totalPossible = statDays * 4;
      const totalDone = rangeReports.length;
      const percent = Math.min(100, Math.round((totalDone / totalPossible) * 100));
      
      return { completed: totalDone, total: totalPossible, percent, label: `ย้อนหลัง ${statDays} วัน` };
    }
  }, [reports, statDays]);

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
      padding:'60px 16px 40px',
      fontFamily:'Noto Sans Thai,sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        
        .login-user-row { transition: all 0.2s ease; position: relative; overflow: hidden; }
        .login-user-row:hover { background: rgba(16, 185, 129, 0.05) !important; transform: scale(1.01); z-index: 1; }
        
        .marquee-container {
          width: 100%; overflow: hidden; white-space: nowrap; background: rgba(0, 0, 0, 0.25);
          color: #fff; padding: 8px 0; position: fixed; top: 0; left: 0; z-index: 100;
          backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .marquee-text { display: inline-block; animation: marquee 25s linear infinite; font-size: 13px; font-weight: 500; }
        
        .stat-tab { 
          padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: 12px; 
          cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7);
        }
        .stat-tab.active { background: #fff; color: #064E3B; border-color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .chart-ring {
          transition: stroke-dashoffset 0.8s ease-in-out;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        @media (max-width: 480px) {
          .login-container { border-radius: 20px !important; }
          .stat-card { padding: 16px !important; }
        }
      `}</style>

      {/* Marquee Banner */}
      <div className="marquee-container">
        <div className="marquee-text">
          📣 ประกาศ: ครูเวร สามารถ login และบันทึกข้อมูลได้ตามเวรประจำวัน &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          📣 ประกาศ: ครูเวร สามารถ login และบันทึกข้อมูลได้ตามเวรประจำวัน
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', 
        padding: '6px 14px', borderRadius: '30px', marginBottom: 24,
        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
        animation: 'fade-in 0.5s ease-out'
      }}>
        <div style={{ 
          width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#10B981' : '#EF4444',
          boxShadow: isOnline ? '0 0 10px #10B981' : '0 0 10px #EF4444',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isOnline ? 'System Online' : 'System Offline'}
        </span>
      </div>

      {/* Stats Dashboard */}
      {step === 'select' && (
        <div className="stat-card" style={{ 
          width: '100%', maxWidth: 540, background: 'rgba(255,255,255,0.12)', 
          backdropFilter: 'blur(20px)', borderRadius: 24, padding: 20, marginBottom: 30,
          border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          animation: 'slide-up 0.6s ease-out'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ color:'#fff', fontSize:15, fontWeight:700, fontFamily:'Prompt' }}>สถิติการรายงานเวร</div>
            <div style={{ display:'flex', gap:6 }}>
              {([1, 7, 15, 30] as const).map(d => (
                <div key={d} onClick={() => setStatDays(d)} className={`stat-tab ${statDays===d?'active':''}`}>
                  {d === 1 ? 'วันนี้' : `${d} วัน`}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            {/* Donut Chart */}
            <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
              <svg width="100" height="100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle className="chart-ring" cx="50" cy="50" r="42" fill="none" stroke="#fff" 
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - stats.percent / 100)}`} />
              </svg>
              <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ color:'#fff', fontSize:20, fontWeight:800, lineHeight:1 }}>{stats.percent}%</div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontWeight:600 }}>สำเร็จ</div>
              </div>
            </div>

            {/* Stats Info */}
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ color:'rgba(255,255,255,0.9)', fontSize:13, marginBottom:12, fontWeight:500 }}>
                ความครอบคลุม {stats.label}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ background:'rgba(255,255,255,0.1)', padding:'10px 14px', borderRadius:16 }}>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10, marginBottom:4 }}>รายงานแล้ว</div>
                  <div style={{ color:'#fff', fontSize:18, fontWeight:700 }}>{stats.completed} <span style={{fontSize:11, fontWeight:500}}>ครั้ง</span></div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.1)', padding:'10px 14px', borderRadius:16 }}>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10, marginBottom:4 }}>เป้าหมาย</div>
                  <div style={{ color:'#fff', fontSize:18, fontWeight:700 }}>{stats.total} <span style={{fontSize:11, fontWeight:500}}>ครั้ง</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Login UI */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: step==='select'?540:380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* School logos */}
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
          {schools.map((s, i) => {
            const logo = getSchoolLogo(s.id);
            return (
              <React.Fragment key={s.id}>
                <div style={{ textAlign:'center', animation: 'slide-up 0.5s ease-out' }}>
                  {logo ? (
                    <img src={logo} alt={s.name} style={{ width:85, height:85, objectFit:'contain' }}/>
                  ) : (
                    <div style={{ width:70, height:70, borderRadius:16, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/></svg>
                    </div>
                  )}
                  <div style={{ fontSize:12, fontWeight:700, color: '#fff', marginTop:8, fontFamily:'Prompt' }}>{s.shortName}</div>
                </div>
                {i < schools.length-1 && <div style={{ fontSize:20, color:'rgba(255,255,255,0.3)' }}>·</div>}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize:24, fontWeight:800, color: '#fff', marginBottom:4, fontFamily:'Prompt', textShadow:'0 2px 10px rgba(0,0,0,0.2)' }}>ระบบรายงานเวรประจำวัน</div>
          <div style={{ fontSize:14, color:'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>กลุ่มโรงเรียนบ้านคำไผ่ – บ้านหินเหลิ่ง</div>
        </div>

        <div style={{ width:'100%', animation: 'fade-in 0.4s ease-out' }}>
          {step === 'select' && (
            <div className="login-container" style={{ background:'#fff', borderRadius:24, overflow:'hidden', boxShadow:'0 30px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #f0f0f0', fontSize:14, fontWeight:700, color:'#064E3B', background: '#f8faf9', display:'flex', justifyContent:'space-between' }}>
                <span>เลือกผู้ใช้งานเพื่อเข้าสู่ระบบ</span>
                <span style={{ color:'#10B981' }}>●</span>
              </div>
              {[
                { label:'ผู้บริหาร', users: users.filter(u=>u.role==='director') },
                { label:'โรงเรียนบ้านคำไผ่', users: users.filter(u=>u.schoolId==='s1') },
                { label:'โรงเรียนบ้านหินเหลิ่ง', users: users.filter(u=>u.schoolId==='s2') },
              ].map(group => (
                <div key={group.label}>
                  <div style={{ padding:'10px 24px', fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', background:'#fcfcfc', borderBottom:'1px solid #f1f5f9', letterSpacing:'0.05em' }}>{group.label}</div>
                  {group.users.map((u, idx) => (
                    <button key={u.id} onClick={() => { setSelUser(u); setStep('pin'); setPin(''); setDots(0); setErr(''); }}
                      className="login-user-row"
                      style={{ 
                        width:'100%', display:'flex', alignItems:'center', gap:16, padding:'14px 24px', 
                        background:'none', border:'none', borderBottom:'1px solid #f8fafc', cursor:'pointer', textAlign:'left'
                      }}>
                      <div style={{ position:'relative' }}>
                        <img src={u.photoUrl || 'https://placehold.co/100?text=USER'} alt={u.name} style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', border:`2px solid ${ROLE_COLOR[u.role]}` }} />
                        <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, background:'#10B981', borderRadius:'50%', border:'2px solid #fff' }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{ROLE_LABEL[u.role]} • {u.schoolId ? (schools.find(s=>s.id===u.schoolId)?.shortName||'') : 'ทั้ง 2 โรงเรียน'}</div>
                      </div>
                      <div style={{ color:'#cbd5e1', fontSize:20 }}>›</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {step === 'pin' && selUser && (
            <div className="login-container" style={{ background:'#fff', borderRadius:28, padding:40, textAlign:'center', boxShadow:'0 30px 60px rgba(0,0,0,0.25)', position:'relative' }}>
              <button onClick={()=>setStep('select')} style={{ position:'absolute', top:24, left:24, background:'#f1f5f9', border:'none', color:'#64748b', cursor:'pointer', fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:12 }}>← กลับ</button>
              <div style={{ marginBottom:24 }}>
                <img src={selUser.photoUrl || 'https://placehold.co/100?text=USER'} alt={selUser.name} style={{ width:90, height:90, borderRadius:'50%', border:`4px solid ${ROLE_COLOR[selUser.role]}`, boxShadow:'0 10px 20px rgba(0,0,0,0.1)' }} />
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:'#1e293b', marginBottom:4 }}>{selUser.name}</div>
              <div style={{ fontSize:14, color:'#64748b', marginBottom:32 }}>กรุณาใส่รหัส PIN 4 หลัก</div>
              
              <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:40 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ 
                    width:18, height:18, borderRadius:'50%', border:'2px solid #e2e8f0', 
                    background: dots > i ? '#064E3B' : 'none', 
                    transform: dots > i ? 'scale(1.1)' : 'scale(1)',
                    transition:'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                  }} />
                ))}
              </div>

              {err && <div style={{ color:'#ef4444', fontSize:14, marginBottom:20, fontWeight:700, animation:'shaking 0.4s' }}>{err}</div>}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, maxWidth:280, margin:'0 auto' }}>
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} onClick={()=>handleDigit(d.toString())} style={{ height:65, borderRadius:16, border:'1px solid #f1f5f9', background:'#f8fafc', fontSize:24, fontWeight:700, color:'#1e293b', cursor:'pointer', transition:'all 0.1s active:scale(0.95)' }}>{d}</button>
                ))}
                <div />
                <button onClick={()=>handleDigit('0')} style={{ height:65, borderRadius:16, border:'1px solid #f1f5f9', background:'#f8fafc', fontSize:24, fontWeight:700, color:'#1e293b', cursor:'pointer' }}>0</button>
                <button onClick={handleBack} style={{ height:65, borderRadius:16, border:'none', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:20 }}>⌫</button>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: '20px', fontWeight:600 }}>
            BUILD v2.3.0 • 19 APR 2026
          </span>
        </div>
      </div>
    </div>
  );
}
