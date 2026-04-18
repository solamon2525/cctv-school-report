import React from 'react';
interface Props { title: string; subtitle?: string; children?: React.ReactNode; }
export default function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(15, 163, 133, 0.02) 0%, rgba(27, 184, 159, 0.02) 100%)', 
      boxShadow: '0 4px 12px rgba(15, 163, 133, 0.08)',
      padding: '18px 28px', position: 'sticky', top: 0, zIndex: 50,
      borderLeft: '5px solid var(--brand-600)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(15, 163, 133, 0.1)'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ 
            fontSize:22, fontWeight:800, 
            background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin:0, letterSpacing:'-0.02em' 
          }}>{title}</h1>
          {subtitle && <p style={{ fontSize:13, color:'var(--neutral-400)', margin:'4px 0 0', fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {children && <div style={{ display:'flex', gap:10, alignItems:'center' }}>{children}</div>}
      </div>
    </div>
  );
}
