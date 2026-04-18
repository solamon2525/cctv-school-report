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
import { LayoutDashboard, PenSquare, ImageIcon, ClipboardList, Settings, LogOut } from 'lucide-react';

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
  const onAdminLogout = () => { 
    if (user.role !== 'admin') {
      setPage('dashboard');
    } else {
      setPage('dashboard');
    }
  };

  // Nav items based on role - only admin can access admin panel
  const canAdmin = user.role==='admin';

  return (
    <div style={{ minHeight:'100vh', background:'var(--neutral-0)', fontFamily:'Sarabun,sans-serif' }}>
      {/* Top Header Row (Logo & User Profile) */}
      <div style={{ background:'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.95) 100%)', borderBottom:'1px solid rgba(15, 163, 133, 0.1)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', boxShadow:'0 4px 12px rgba(15, 163, 133, 0.08)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user.schoolId ? (
            getSchoolLogo(user.schoolId) ? (
              <img src={getSchoolLogo(user.schoolId)} alt="logo" style={{ width:38, height:38, objectFit:'contain', borderRadius:10, background:'#fff', border:'1.5px solid rgba(15, 163, 133, 0.2)', padding:2, boxShadow: '0 2px 6px rgba(15, 163, 133, 0.1)' }} />
            ) : (
              <div style={{ width:38, height:38, background:'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 2px 6px rgba(15, 163, 133, 0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                </svg>
              </div>
            )
          ) : (
            <div style={{ display:'flex', gap:6 }}>
              {load<School>(K.schools).map(s => {
                const logo = getSchoolLogo(s.id);
                return logo ? (
                  <img key={s.id} src={logo} alt="logo" style={{ width:38, height:38, objectFit:'contain', borderRadius:10, background:'#fff', border:'1.5px solid rgba(15, 163, 133, 0.2)', padding:2, boxShadow: '0 2px 6px rgba(15, 163, 133, 0.1)' }} />
                ) : (
                  <div key={s.id} style={{ width:38, height:38, background: s.id==='s1'?'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)':'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3.5"/><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
          <div>
            <div style={{ fontSize:14, fontWeight:800, background: 'linear-gradient(135deg, #0fa385 0%, #1bb89f 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight:1 }}>ระบบรายงานเวร</div>
            <div style={{ fontSize:11, color:'#a8a29e', marginTop:2, fontWeight: 500 }}>
              {user.schoolId ? load<School>(K.schools).find(s=>s.id===user.schoolId)?.shortName||'กลุ่มโรงเรียน' : 'กลุ่มโรงเรียน'}
            </div>
          </div>
        </div>

        {/* User info + logout */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#292524', lineHeight:1 }}>{user.name.split(' ')[0]}</div>
            <div style={{ fontSize:11, color:'#a8a29e', marginTop:2, fontWeight: 500 }}>
              {user.role==='director'?'ผู้อำนวยการ':user.role==='admin'?'Admin (ผู้ดูแลระบบ)':load<School>(K.schools).find(s=>s.id===user.schoolId)?.shortName||''}
            </div>
          </div>
          <button onClick={onLogout} className="btn-ghost" style={{ padding:'8px 16px', fontSize:13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={16} />
            ออก
          </button>
        </div>
      </div>

      {/* Sticky Nav Links Row */}
      <div style={{ background:'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.98) 100%)', borderBottom:'1px solid rgba(15, 163, 133, 0.1)', position:'sticky', top:0, zIndex:100, display:'flex', overflowX:'auto', padding:'8px 12px', gap:4, boxShadow:'0 2px 8px rgba(15, 163, 133, 0.06)' }}>
        {([
          ['dashboard', <LayoutDashboard size={17}/>, 'แดชบอร์ด'],
          user.role === 'director' ? ['director-feed', <ImageIcon size={17}/>, 'สมุดรายงาน'] : ['new-report', <PenSquare size={17}/>, 'บันทึกรายงาน'],
          ['history', <ClipboardList size={17}/>, 'ประวัติ'],
          ...(canAdmin?[['admin', <Settings size={17}/>, 'Admin']] as any:[]),
        ] as [Page,React.ReactNode,string][]).map(([p,ic,lb])=>(
          <button key={p} onClick={()=>onNav(p)}
            className={`nav-btn ${page===p ? 'nav-active' : ''}`}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 16px', height:44,
              border:'none', borderBottom:'none',
              color: page===p ? '#fff' : 'var(--neutral-600)',
              fontSize:14, fontWeight: page===p ? 700 : 500,
              cursor:'pointer', fontFamily:'Sarabun,sans-serif', whiteSpace:'nowrap',
              borderRadius: 'var(--r-md)',
              transition: 'all 0.2s ease-out'
            }}>
            <span style={{ display:'flex', alignItems:'center', opacity: page===p ? 1 : 0.7 }}>{ic}</span>
            {lb}
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
