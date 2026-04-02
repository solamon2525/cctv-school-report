import React, { useState, useEffect } from 'react';
import { isAdminLoggedIn, adminLogin, getAdminPin, setAdminPin } from '../lib/store';
import { toast } from '../lib/toast';

interface Props {
  children: React.ReactNode;
  onLoggedIn?: () => void;
}

export default function AdminGuard({ children, onLoggedIn }: Props) {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [dots, setDots] = useState<string[]>([]);

  const handleDigit = (d: string) => {
    if (dots.length >= 4) return;
    const next = [...dots, d];
    setDots(next);
    setPin(p => p + d);
    setError('');
    if (next.length === 4) {
      setTimeout(() => attempt(pin + d), 200);
    }
  };

  const attempt = (p: string) => {
    if (adminLogin(p)) {
      setLoggedIn(true);
      toast('เข้าสู่ระบบ Admin สำเร็จ ✓', 'ok');
      onLoggedIn?.();
    } else {
      setError('PIN ไม่ถูกต้อง กรุณาลองใหม่');
      setDots([]); setPin('');
    }
  };

  const clear = () => { setDots([]); setPin(''); setError(''); };

  if (loggedIn) return <>{children}</>;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#faf8f4' }}>
      <div style={{ background:'#fff', border:'1px solid #e5e0d4', borderRadius:16, padding:'36px 32px', width:320, textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,.08)' }}>
        {/* Lock icon */}
        <div style={{ width:56, height:56, background:'#f0f7f2', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:24 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#252018', marginBottom:4 }}>Admin เท่านั้น</div>
        <div style={{ fontSize:13, color:'#a89f8c', marginBottom:24 }}>กรุณากรอก PIN 4 หลักเพื่อเข้าสู่ระบบ</div>

        {/* PIN dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:16, height:16, borderRadius:'50%',
              background: i < dots.length ? '#1e5c3b' : '#e5e0d4',
              transition:'background .15s',
            }}/>
          ))}
        </div>

        {/* Keypad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i} onClick={() => d === '⌫' ? clear() : d ? handleDigit(d) : null}
              disabled={!d && d !== '0'}
              style={{
                height:52, borderRadius:10,
                background: d === '⌫' ? '#fde8e8' : d ? '#faf8f4' : 'transparent',
                border: d ? '1px solid #e5e0d4' : 'none',
                fontSize: d === '⌫' ? 18 : 20, fontWeight:600,
                color: d === '⌫' ? '#b71c1c' : '#252018',
                cursor: d ? 'pointer' : 'default',
                fontFamily:'IBM Plex Mono,monospace',
                transition:'all .1s',
                opacity: !d && d !== '0' ? 0 : 1,
              }}>
              {d}
            </button>
          ))}
        </div>

        {error && <div style={{ color:'#b71c1c', fontSize:13, marginTop:8, background:'#fde8e8', borderRadius:7, padding:'7px 12px' }}>{error}</div>}
        <div style={{ fontSize:11, color:'#ccc5b4', marginTop:16 }}>PIN เริ่มต้น: 1234</div>
      </div>
    </div>
  );
}
