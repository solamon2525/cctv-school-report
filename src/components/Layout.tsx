import React, { useState } from 'react';
import { load, loadVal, saveVal, K, School, Inspection } from '../lib/store';

type Page = 'overview'|'dashboard'|'new-insp'|'history'|'report'|'cameras'|'teachers'|'problems'|'admin';

const navMain: { id:Page; icon:string; label:string }[] = [
  { id:'overview',  icon:'⊞', label:'ภาพรวม 2 โรงเรียน' },
];
const navSub: { id:Page; icon:string; label:string }[] = [
  { id:'dashboard', icon:'◫', label:'แดชบอร์ด' },
  { id:'new-insp',  icon:'✎', label:'บันทึกการตรวจ' },
  { id:'history',   icon:'≡', label:'ประวัติการตรวจ' },
  { id:'report',    icon:'▦', label:'รายงาน' },
  { id:'cameras',   icon:'◉', label:'จัดการกล้อง' },
  { id:'teachers',  icon:'◈', label:'ครูเวร' },
  { id:'problems',  icon:'△', label:'รายงานปัญหา' },
  { id:'admin',     icon:'⚙', label:'Admin' },
];

interface Props {
  current: Page;
  activeSchoolId: string;
  onNav: (p: Page) => void;
  onSchoolChange: (id: string) => void;
  probCount: number;
  children: React.ReactNode;
}

export default function Layout({ current, activeSchoolId, onNav, onSchoolChange, probCount, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const schools = load<School>(K.schools);
  const activeSchool = schools.find(s => s.id === activeSchoolId) || schools[0];
  const isOverview = current === 'overview';

  const schoolColors: Record<string,{pri:string;light:string;bg:string}> = {
    s1: { pri:'#1e5c3b', light:'#2d7a52', bg:'#f0f7f2' },
    s2: { pri:'#1a4a7a', light:'#2563a8', bg:'#eff4fb' },
  };
  const sc = schoolColors[activeSchoolId] || schoolColors['s1'];

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{
        width: collapsed ? 56 : 252,
        background:'#ffffff',
        borderRight:'1px solid #e5e0d4',
        display:'flex', flexDirection:'column',
        position:'fixed', height:'100vh',
        transition:'width .2s ease', zIndex:100, overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed?'14px 10px':'14px 16px', borderBottom:'1px solid #e5e0d4', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, background:sc.pri, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .3s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#faf8f4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.5"/>
              <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/>
            </svg>
          </div>
          {!collapsed && (
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:sc.pri, whiteSpace:'nowrap', transition:'color .3s' }}>ระบบตรวจ CCTV</div>
              <div style={{ fontSize:10, color:'#a89f8c', whiteSpace:'nowrap' }}>กลุ่มโรงเรียนเครือข่าย</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#a89f8c', fontSize:16, padding:2, flexShrink:0 }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* School Switcher */}
        {!collapsed && (
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e0d4', flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#a89f8c', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>เลือกโรงเรียน</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {schools.map(s => {
                const sc2 = schoolColors[s.id] || schoolColors['s1'];
                const active = s.id === activeSchoolId && !isOverview;
                return (
                  <button key={s.id} onClick={() => { onSchoolChange(s.id); if (current === 'overview') onNav('dashboard'); }}
                    style={{
                      width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:7,
                      border: active ? `1.5px solid ${sc2.pri}` : '1.5px solid #e5e0d4',
                      background: active ? sc2.bg : '#faf8f4',
                      cursor:'pointer', transition:'all .15s', fontFamily:'Sarabun,sans-serif',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:sc2.pri, display:'inline-block', flexShrink:0 }}/>
                      <span style={{ fontSize:13, fontWeight: active?700:400, color: active?sc2.pri:'#574f44' }}>{s.shortName}</span>
                      <span style={{ marginLeft:'auto', fontSize:10, color:'#a89f8c' }}>
                        {load<any>(K.cams).filter((c:any) => c.schoolId === s.id).length} ตัว
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ padding:'8px 6px', borderBottom:'1px solid #e5e0d4', display:'flex', flexDirection:'column', gap:4 }}>
            {schools.map(s => {
              const sc2 = schoolColors[s.id] || schoolColors['s1'];
              return (
                <button key={s.id} onClick={() => { onSchoolChange(s.id); if (current==='overview') onNav('dashboard'); }}
                  title={s.name}
                  style={{ width:44, height:28, borderRadius:6, border:'none', background:s.id===activeSchoolId&&!isOverview?sc2.pri:sc2.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:8, fontWeight:700, color:s.id===activeSchoolId&&!isOverview?'#fff':sc2.pri }}>{s.shortName.slice(0,2)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {/* Overview */}
          {navMain.map(item => {
            const active = current === item.id;
            return (
              <button key={item.id} onClick={() => onNav(item.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9,
                padding: collapsed?'9px 10px':'9px 11px', justifyContent:collapsed?'center':'flex-start',
                borderRadius:8, border:'none', cursor:'pointer', marginBottom:6,
                background: active ? '#fef3dc' : 'transparent',
                color: active ? '#8a6000' : '#574f44',
                fontFamily:'Sarabun,sans-serif', fontSize:14, fontWeight: active?600:400, whiteSpace:'nowrap',
              }}>
                <span style={{ fontSize:16, flexShrink:0, width:20, textAlign:'center' }}>{item.icon}</span>
                {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
              </button>
            );
          })}

          {/* Divider */}
          {!collapsed && (
            <div style={{ fontSize:10, fontWeight:700, color:'#a89f8c', letterSpacing:'.08em', textTransform:'uppercase', padding:'4px 8px 6px', marginTop:4 }}>
              {activeSchool?.shortName || '—'}
            </div>
          )}
          {collapsed && <div style={{ height:1, background:'#e5e0d4', margin:'4px 0' }}/>}

          {navSub.map(item => {
            const active = current === item.id;
            const showBadge = item.id === 'problems' && probCount > 0;
            return (
              <button key={item.id} onClick={() => onNav(item.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9,
                padding: collapsed?'9px 10px':'9px 11px', justifyContent:collapsed?'center':'flex-start',
                borderRadius:8, border:'none', cursor:'pointer', marginBottom:2,
                background: active ? sc.bg : 'transparent',
                color: active ? sc.pri : '#574f44',
                fontFamily:'Sarabun,sans-serif', fontSize:14, fontWeight: active?600:400, whiteSpace:'nowrap',
                transition:'all .15s',
              }}>
                <span style={{ fontSize:16, flexShrink:0, width:20, textAlign:'center' }}>{item.icon}</span>
                {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                {!collapsed && showBadge && (
                  <span style={{ background:'#b71c1c', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{probCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: collapsed?'10px 6px':'10px 14px', borderTop:'1px solid #e5e0d4', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#a89f8c' }}>
            <span className="live-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#2e7d32', display:'inline-block' }}/>
            {!collapsed && <span>ระบบออนไลน์</span>}
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: collapsed?56:252, flex:1, minHeight:'100vh', transition:'margin-left .2s ease', background:'#faf8f4' }}>
        {children}
      </main>
    </div>
  );
}
