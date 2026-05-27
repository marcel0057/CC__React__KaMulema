// =========================================================
// components/ui/index.tsx — Composants UI réutilisables
// Tous basés sur les CSS tokens de theme.css
// =========================================================

import React from 'react';

// ===== BOUTON =====
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'yellow' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Btn({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  children,
  style,
  ...rest
}: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontWeight: 500,
    borderRadius: 'var(--agro-radius-md)',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity var(--agro-transition), background var(--agro-transition)',
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'inherit',
    lineHeight: 1.4,
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--agro-green-dark)',  color: '#fff' },
    secondary: { background: 'var(--agro-green-light)', color: '#fff' },
    outline:   { background: 'transparent', border: '1px solid var(--agro-green-dark)', color: 'var(--agro-green-dark)' },
    yellow:    { background: 'var(--agro-yellow)', color: 'var(--agro-text-on-yellow)', fontWeight: 600 },
    ghost:     { background: 'transparent', color: 'var(--agro-text-secondary)' },
  };

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ===== BADGE =====
interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'brown' | 'info';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Badge({ variant = 'success', icon, children }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: 'var(--agro-success-bg)', color: 'var(--agro-success-text)' },
    warning: { background: 'var(--agro-warning-bg)', color: 'var(--agro-warning-text)' },
    danger:  { background: 'var(--agro-danger-bg)',  color: 'var(--agro-danger-text)' },
    brown:   { background: 'var(--agro-brown-soft)', color: 'var(--agro-brown)' },
    info:    { background: 'var(--agro-info-bg)',    color: 'var(--agro-info-text)' },
  };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 'var(--agro-radius-full)',
      fontSize: 11, fontWeight: 500, lineHeight: 1.4,
      ...styles[variant],
    }}>
      {icon}
      {children}
    </span>
  );
}

// ===== CARD =====
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number | string;
}

export function Card({ children, style, padding = '18px' }: CardProps) {
  return (
    <div style={{
      background: 'var(--agro-bg-card)',
      border: '0.5px solid var(--agro-border)',
      borderRadius: 'var(--agro-radius-lg)',
      padding,
      boxShadow: 'var(--agro-shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ===== STAT CARD =====
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'yellow' | 'brown' | 'default';
}

export function StatCard({ label, value, sub, color = 'default' }: StatCardProps) {
  const valueColors: Record<string, string> = {
    green:   'var(--agro-green-dark)',
    yellow:  'var(--agro-warning-text)',
    brown:   'var(--agro-brown)',
    default: 'var(--agro-text-primary)',
  };

  return (
    <div style={{
      background: 'var(--agro-bg-surface)',
      borderRadius: 'var(--agro-radius-md)',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--agro-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: valueColors[color] }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--agro-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ===== AVATAR =====
interface AvatarProps {
  initiales: string;
  photoUrl?: string;
  disponible?: boolean;
  size?: number;
}

export function Avatar({ initiales, photoUrl, disponible = true, size = 48 }: AvatarProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: disponible ? 'var(--agro-green-dark)' : 'var(--agro-text-muted)',
      backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: size * 0.3,
      fontWeight: 500,
    }}>
      {!photoUrl && initiales}
    </div>
  );
}

// ===== ÉTOILES =====
interface EtoilesProps {
  note: number;
  count?: number;
  size?: number;
}

export function Etoiles({ note, count, size = 14 }: EtoilesProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          fontSize: size,
          color: i <= Math.round(note) ? 'var(--agro-yellow)' : 'var(--agro-border-strong)',
        }}>★</span>
      ))}
      {count !== undefined && (
        <span style={{ fontSize: size - 2, color: 'var(--agro-text-muted)', marginLeft: 4 }}>
          {note.toFixed(1)} ({count} avis)
        </span>
      )}
    </div>
  );
}

// ===== INPUT =====
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, color: 'var(--agro-text-secondary)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 'var(--agro-radius-md)',
        border: '0.5px solid var(--agro-border-strong)',
        background: 'var(--agro-bg-input)',
        color: 'var(--agro-text-primary)',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color var(--agro-transition)',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--agro-green-light)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--agro-border-strong)'; }}
      {...rest} />
    </div>
  );
}

// ===== SELECT =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, style, ...rest }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, color: 'var(--agro-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}
      <select style={{
        padding: '6px 10px',
        borderRadius: 'var(--agro-radius-md)',
        border: '0.5px solid var(--agro-border-strong)',
        background: 'var(--agro-bg-input)',
        color: 'var(--agro-text-primary)',
        fontSize: 13,
        fontFamily: 'inherit',
        minWidth: 130,
        ...style,
      }} {...rest}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ===== BANNIÈRE (géolocalisation, info, warning) =====
interface BannerProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export function Banner({ variant = 'success', icon, children, action }: BannerProps) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: 'var(--agro-success-bg)', color: 'var(--agro-success-text)' },
    warning: { background: 'var(--agro-warning-bg)', color: 'var(--agro-warning-text)' },
    danger:  { background: 'var(--agro-danger-bg)',  color: 'var(--agro-danger-text)' },
    info:    { background: 'var(--agro-info-bg)',    color: 'var(--agro-info-text)' },
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 'var(--agro-radius-md)',
      fontSize: 13, fontWeight: 500,
      ...styles[variant],
    }}>
      {icon && <i className={`ti ti-${icon}`} style={{ fontSize: 14 }} aria-hidden="true" />}
      <span>{children}</span>
      {action && (
        <button onClick={action.onClick} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          textDecoration: 'underline', cursor: 'pointer', fontSize: 13,
          fontWeight: 600, color: 'inherit', padding: 0, fontFamily: 'inherit',
        }}>{action.label}</button>
      )}
    </div>
  );
}

// ===== ACCENT STRIP =====
interface AccentStripProps {
  title: string;
  text: string;
  color?: 'yellow' | 'green' | 'brown';
}

export function AccentStrip({ title, text, color = 'yellow' }: AccentStripProps) {
  const borderColors: Record<string, string> = {
    yellow: 'var(--agro-accent-yellow)',
    green:  'var(--agro-accent-green)',
    brown:  'var(--agro-accent-brown)',
  };
  return (
    <div style={{ borderLeft: `3px solid ${borderColors[color]}`, paddingLeft: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--agro-text-muted)', marginTop: 2 }}>{text}</div>
    </div>
  );
}

// ===== DIVIDER =====
export function Divider({ margin = '16px 0' }: { margin?: string }) {
  return <div style={{ height: '0.5px', background: 'var(--agro-border)', margin }} />;
}
