import React, { useState, useEffect } from 'react';
import { seedData, load, loadVal, saveVal, save, K, AppUser, School, getSchoolLogo } from './lib/store';
import { db, COL, ensureAuth } from './lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel';
import DirectorFeed from './pages/DirectorFeed';
import { LayoutDashboard, PenSquare, ImageIcon, ClipboardList, Settings } from 'lucide-react';

type Page = 'dashboard'|'new-report'|'history'|'admin'|'director-feed';

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
    // Ensure Firebase anonymous auth before setting up listeners
    ensureAuth().then(() => {
      console.log('Firebase auth ready');
    }).catch(err => console.error('Auth failed:', err));

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
  const canAdmin = user.role==='admin';

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f4', fontFamily:'Sarabun,sans-serif' }}>
      {/* Top Header Row (Logo & User Profile) */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f0e8', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {user.schoolId && getSchoolLogo(user.schoolId) ? (
            <img src={getSchoolLogo(user.schoolId)} alt="logo" style={{ width:34, height:34, objectFit:'contain', borderRadius:8, background:'#fff', border:'1px solid #e5e0d4', padding:2 }} />
          ) : (
            <div style={{ width:34, height:34, background:'#1e5c3b', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#faf8f4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
              </svg>
            </div>
          )}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1e5c3b', lineHeight:1 }}>ระบบรายงานเวร</div>
            <div style={{ fontSize:10, color:'#a89f8c', marginTop:2 }}>
              {user.schoolId ? load<School>(K.schools).find(s=>s.id===user.schoolId)?.shortName||'กลุ่มโรงเรียน' : 'กลุ่มโรงเรียน'}
            </div>
          </div>
        </div>

        {/* User info + logout */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#252018', lineHeight:1 }}>{user.name.split(' ')[0]}</div>
            <div style={{ fontSize:10, color:'#a89f8c', marginTop:2 }}>
              {user.role==='director'?'ผู้อำนวยการ':user.role==='admin'?'Admin':load<School>(K.schools).find(s=>s.id===user.schoolId)?.shortName||''}
            </div>
          </div>
          <button onClick={onLogout} style={{ background:'#f3f0e8', border:'1px solid #e5e0d4', borderRadius:7, padding:'7px 12px', fontSize:12, cursor:'pointer', color:'#574f44', fontFamily:'Sarabun,sans-serif' }}>ออก</button>
        </div>
      </div>

      {/* Sticky Nav Links Row */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e0d4', position:'sticky', top:0, zIndex:100, display:'flex', overflowX:'auto', padding:'0 10px', boxShadow:'0 2px 10px rgba(0,0,0,0.03)' }}>
        {([
          ['dashboard', <LayoutDashboard size={18}/>, 'แดชบอร์ด'],
          user.role === 'director' ? ['director-feed', <ImageIcon size={18}/>, 'สมุดรายงาน'] : ['new-report', <PenSquare size={18}/>, 'บันทึกรายงาน'],
          ['history', <ClipboardList size={18}/>, 'ประวัติ'],
          ...(canAdmin?[['admin', <Settings size={18}/>, 'Admin']] as any:[]),
        ] as [Page,React.ReactNode,string][]).map(([p,ic,lb])=>(
          <button key={p} onClick={()=>onNav(p)} 
            className={`nav-btn ${page===p ? 'nav-active' : ''}`}
            style={{
            display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:48,
            background:'none', border:'none', borderBottom: page===p?'2px solid #1e5c3b':'2px solid transparent',
            color: page===p?'#1e5c3b':'#574f44', fontSize:14, fontWeight:page===p?600:400,
            cursor:'pointer', fontFamily:'Sarabun,sans-serif', whiteSpace:'nowrap',
          }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', opacity: page===p?1:0.7 }}>{ic}</span>{lb}
          </button>
        ))}
      </div>

      {/* Pages */}
      <div style={{ minHeight:'calc(100vh - 52px)' }}>
        {page==='dashboard'  && <Dashboard key={syncTick} user={user} onNav={onNav} schoolId={schoolId}/>}
        {page==='director-feed' && <DirectorFeed user={user} />}
        {page==='new-report' && <NewReport user={user} onNav={onNav} schoolId={user.schoolId||schoolId}/>}
        {page==='history'    && <History   key={syncTick} user={user} schoolId={schoolId}/>}
        {page==='admin'      && canAdmin && <AdminPanel key={syncTick} user={user} onLogout={onAdminLogout}/>}
      </div>
    </div>
  );
}
