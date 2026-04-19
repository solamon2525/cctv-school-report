import React from 'react';

interface Props { 
  title: string; 
  subtitle?: string; 
  children?: React.ReactNode; 
}

export default function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      padding: '20px 28px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      borderLeft: '4px solid var(--primary-600)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-light)',
      fontFamily: 'Noto Sans Thai, sans-serif'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0, 
            letterSpacing: '-0.02em',
            fontFamily: 'Prompt, sans-serif'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ 
              fontSize: 13, 
              color: 'var(--text-tertiary)', 
              margin: '6px 0 0', 
              fontWeight: 500 
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center' 
          }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
