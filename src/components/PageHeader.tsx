import React from 'react';
interface Props { title: string; subtitle?: string; children?: React.ReactNode; }
export default function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div style={{ background:'#fff', borderBottom:'1px solid var(--neutral-100)', padding:'16px 24px', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'var(--neutral-700)', margin:0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:12, color:'var(--neutral-400)', margin:'2px 0 0' }}>{subtitle}</p>}
        </div>
        {children && <div style={{ display:'flex', gap:8, alignItems:'center' }}>{children}</div>}
      </div>
    </div>
  );
}
