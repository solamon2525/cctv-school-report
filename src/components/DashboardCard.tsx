import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  gradient?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  primary: {
    bg: 'linear-gradient(135deg, #064E3B 0%, #0D6B54 100%)',
    light: 'rgba(5, 150, 105, 0.1)',
    text: '#10B981',
  },
  success: {
    bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    light: 'rgba(16, 185, 129, 0.1)',
    text: '#10B981',
  },
  warning: {
    bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    light: 'rgba(245, 158, 11, 0.1)',
    text: '#F59E0B',
  },
  error: {
    bg: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)',
    light: 'rgba(225, 29, 72, 0.1)',
    text: '#E11D48',
  },
  info: {
    bg: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
    light: 'rgba(59, 130, 246, 0.1)',
    text: '#3B82F6',
  },
};

export default function DashboardCard({
  title,
  subtitle,
  value,
  icon,
  color = 'primary',
  gradient = false,
  children,
  onClick,
  className,
}: DashboardCardProps) {
  const colorScheme = colorMap[color];

  if (gradient) {
    return (
      <div
        onClick={onClick}
        style={{
          background: colorScheme.bg,
          borderRadius: 'var(--r-xl)',
          padding: '20px 24px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.16)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        }}
        className={className}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </div>
            {subtitle && <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>{subtitle}</div>}
          </div>
          {icon && <div style={{ opacity: 0.8, fontSize: '20px' }}>{icon}</div>}
        </div>
        {value && (
          <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>
            {value}
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--r-xl)',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = colorScheme.text;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
      className={className}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && <div style={{ color: colorScheme.text, fontSize: '20px' }}>{icon}</div>}
      </div>
      {value && (
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>
          {value}
        </div>
      )}
      {children}
    </div>
  );
}
