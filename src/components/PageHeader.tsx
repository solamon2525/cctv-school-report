import React from 'react';
interface Props { title: string; subtitle?: string; children?: React.ReactNode; }
export default function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div style={{ 
      background: 'linear-gradient(to bottom, #fff 0%, #fdfcfa 100%)', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
      borderLeft: '4px solid var(--brand-600)'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--neutral-700)', margin:0, letterSpacing:'-0.01em' }}>{title}</h1>
          {subtitle && <p style={{ fontSize:12, color:'var(--neutral-400)', margin:'2px 0 0' }}>{subtitle}</p>}
        </div>
        {children && <div style={{ display:'flex', gap:8, alignItems:'center' }}>{children}</div>}
      </div>
    </div>
  );
}
