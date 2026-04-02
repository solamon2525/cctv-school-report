import React, { useState, useEffect } from 'react';
import { seedData, load, loadVal, saveVal, save, K, AppUser, School, getSchoolLogo } from './lib/store';
import { db, COL } from './lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel';

type Page = 'dashboard'|'new-report'|'history'|'admin';

seedData();

export default function App() {
  const [user, setUser]   = useState<AppUser|null>(() => {
    const uid = loadVal(K.activeUser);
    if (!uid) return null;
    return load<AppUser>(K.users).find(u=>u.id===uid) || null;
  });
  const [page, setPage]   = useState<Page>('dashboard');
  const [dirty, setDirty] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, COL.schools), snap => { save(K.schools, snap.docs.map(d=>({id:d.id, ...d.data()}))); setSyncTick(t=>t+1); }),
      onSnapshot(collection(db, COL.users),   snap => { save(K.users,   snap.docs.map(d=>({id:d.id, ...d.data()}))); setSyncTick(t=>t+1); }),
      onSnapshot(query(collection(db, COL.reports), orderBy('timestamp', 'desc')), snap => {
        save(K.reports, snap.docs.map(d=>({id:d.id, ...d.data()})));
        setSyncTick(t=>t+1);
      }),
      onSnapshot(collection(db, COL.cameras), snap => { save(K.cams,  snap.docs.map(d=>({id:d.id, ...d.data()}))); setSyncTick(t=>t+1); }),
      onSnapshot(query(collection(db, COL.duty), orderBy('date', 'asc')), snap => { save(K.duty, snap.docs.map(d=>({id:d.id, ...d.data()}))); setSyncTick(t=>t+1); })
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  if (!user) return <LoginScreen onLogin={u => { setUser(u); setPage('dashboard'); }}/>;

  const schoolId = user.schoolId || load<School>(K.schools)[0]?.id || 's1';

  const onNav = (p: Page) => {
    if (dirty && page==='new-report' && p!=='new-report') {
      if (!confirm('มีข้อมูลที่ยังไม่ได้บันทึก\nออกจากหน้านี้?')) return;
      setDirty(false);
    }
    setPage(p); window.scrollTo(0,0);
  };

  const onLogout = () => { saveVal(K.activeUser,''); setUser(null); };
  const onAdminLogout = () => { setPage('dashboard'); };

  // Nav items based on role
  const canAdmin = user.role==='admin'||user.role==='director';

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f4', fontFamily:'Sarabun,sans-serif' }}>
      {/* Top nav bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e0d4', position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', padding:'0 12px', height:52, overflowX:'auto' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:28 }}>
          <div style={{ width:30, height:30, background:'#1e5c3b', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#1e5c3b', lineHeight:1 }}>ระบบรายงานเวร</div>
            <div style={{ fontSize:10, color:'#a89f8c' }}>กลุ่มโรงเรียน</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto', minWidth:0 }}>
          {([
            ['dashboard','◫','แดชบอร์ด'],
            ['new-report','✎','บันทึกรายงาน'],
            ['history','≡','ประวัติ'],
            ...(canAdmin?[['admin','⚙','Admin']] as any:[]),
          ] as [Page,string,string][]).map(([p,ic,lb])=>(
            <button key={p} onClick={()=>onNav(p)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:52,
              background:'none', border:'none', borderBottom: page===p?'2px solid #1e5c3b':'2px solid transparent',
              color: page===p?'#1e5c3b':'#574f44', fontSize:14, fontWeight:page===p?600:400,
              cursor:'pointer', fontFamily:'Sarabun,sans-serif', whiteSpace:'nowrap',
            }}>
              <span style={{ fontSize:15 }}>{ic}</span>{lb}
            </button>
          ))}
        </div>

        {/* User info + logout */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#252018' }}>{user.name}</div>
            <div style={{ fontSize:10, color:'#a89f8c' }}>
              {user.role==='director'?'ผู้อำนวยการ':user.role==='admin'?'Admin':load<School>(K.schools).find(s=>s.id===user.schoolId)?.shortName||''}
            </div>
          </div>
          <button onClick={onLogout} style={{ background:'#f3f0e8', border:'1px solid #e5e0d4', borderRadius:7, padding:'6px 12px', fontSize:12, cursor:'pointer', color:'#574f44', fontFamily:'Sarabun,sans-serif' }}>ออก</button>
        </div>
      </div>

      {/* Pages */}
      <div style={{ minHeight:'calc(100vh - 52px)' }}>
        {page==='dashboard'  && <Dashboard key={syncTick} user={user} onNav={onNav} schoolId={schoolId}/>}
        {page==='new-report' && <NewReport user={user} onNav={onNav} schoolId={user.schoolId||schoolId}/>}
        {page==='history'    && <History   key={syncTick} user={user} schoolId={schoolId}/>}
        {page==='admin'      && canAdmin && <AdminPanel user={user} onLogout={onAdminLogout}/>}
      </div>
    </div>
  );
}
