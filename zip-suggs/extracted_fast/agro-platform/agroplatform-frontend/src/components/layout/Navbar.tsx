// =========================================================
// components/layout/Navbar.tsx
// =========================================================

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  userInitiales?: string;
}

const NAV_ITEMS = [
  { key: 'agronomes', label: 'Agronomes',  icon: 'ti-users' },
  { key: 'rdv',       label: 'Mes RDV',    icon: 'ti-calendar' },
  { key: 'messages',  label: 'Messages',   icon: 'ti-message' },
  { key: 'suivi',     label: 'Mes suivis', icon: 'ti-plant' },
  { key: 'conseil',   label: 'Conseil IA', icon: 'ti-bulb' },
];

export function Navbar({ activeRoute = 'agronomes', onNavigate, userInitiales = 'MA' }: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav style={{
      background: 'var(--agro-bg-nav)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--agro-shadow-nav)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--agro-radius-md)',
          background: 'var(--agro-yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-plant-2" style={{ fontSize: 17, color: 'var(--agro-green-dark)' }} aria-hidden="true" />
        </div>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>AgroPlatform</span>
      </div>

      {/* Liens */}
      <div style={{ display: 'flex', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeRoute === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--agro-radius-md)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--agro-yellow)' : 'rgba(255,255,255,0.65)',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background var(--agro-transition), color var(--agro-transition)',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Actions droite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{
            width: 34, height: 34, borderRadius: 'var(--agro-radius-md)',
            background: 'rgba(255,255,255,0.10)', border: 'none',
            color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background var(--agro-transition)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
        >
          <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 16 }} aria-hidden="true" />
        </button>

        {/* Notifications */}
        <button style={{
          width: 34, height: 34, borderRadius: 'var(--agro-radius-md)',
          background: 'rgba(255,255,255,0.10)', border: 'none',
          color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <i className="ti ti-bell" style={{ fontSize: 16 }} aria-hidden="true" />
          {/* Point de notification */}
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--agro-yellow)',
            border: '1.5px solid var(--agro-green-dark)',
          }} />
        </button>

        {/* Avatar utilisateur */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--agro-yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: 'var(--agro-green-dark)',
          cursor: 'pointer',
        }}>
          {userInitiales}
        </div>
      </div>
    </nav>
  );
}
