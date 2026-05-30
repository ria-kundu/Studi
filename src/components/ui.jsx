// src/components/ui.jsx
// ─────────────────────────────────────────────────────────────
// Small, reusable primitive components used across all pages.
// ─────────────────────────────────────────────────────────────
import { CATEGORY_STYLE } from '../data/mock.js';

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ user, size = 'md' }) {
  const dim = { sm: 28, md: 36, lg: 56, xl: 72 }[size];
  const fs  = { sm: 11, md: 13, lg: 20, xl: 26 }[size];
  return (
    <div
      aria-hidden="true"
      style={{
        width: dim, height: dim, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2a5cff, #7c5ff7)',
        color: '#fff', fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: fs,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, letterSpacing: '-0.02em',
      }}
    >
      {user?.initials ?? '?'}
    </div>
  );
}

// ── Category Badge ────────────────────────────────────────────
export function Badge({ category }) {
  const s = CATEGORY_STYLE[category] || CATEGORY_STYLE.Other;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--r-full)',
      fontSize: 12, fontWeight: 600, lineHeight: 1,
      background: s.bg, color: s.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {category}
    </span>
  );
}

// ── Star Rating Display ───────────────────────────────────────
export function Stars({ score }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
         aria-label={`${score} out of 5 stars`}>
      <div style={{ display: 'flex' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{
            fontSize: 13, lineHeight: 1,
            color: i <= Math.floor(score)
              ? 'var(--clr-star)'
              : (i - score < 1 && i > Math.floor(score))
                ? 'var(--clr-star)'
                : 'var(--clr-paper-3)',
            opacity: (i - score < 1 && i > Math.floor(score)) ? 0.5 : 1,
          }} aria-hidden="true">★</span>
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-ink)' }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ── Dot Score (5-dot attribute display) ──────────────────────
export function DotScore({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}
         role="img" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i < value ? 'var(--clr-primary)' : 'var(--clr-paper-3)',
          transition: 'background 120ms ease',
        }} aria-hidden="true" />
      ))}
    </div>
  );
}

// ── Score Grid ────────────────────────────────────────────────
export function ScoreGrid({ ranking }) {
  const fields = [
    { key: 'quietness', label: 'Quiet'   },
    { key: 'wifi',      label: 'Wifi'    },
    { key: 'outlets',   label: 'Outlets' },
    { key: 'restroom',  label: 'Restroom'},
    { key: 'crowdness', label: 'Crowded' },
    { key: 'seating',   label: 'Seating' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px 16px', background: 'var(--clr-paper)',
      borderRadius: 'var(--r-lg)', padding: '12px 14px',
    }} aria-label="Attribute scores">
      {fields.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-ink-4)',
            textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
          <DotScore value={ranking[key]} />
        </div>
      ))}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, style, ariaLabel }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer',
    border: '2px solid transparent', borderRadius: 'var(--r-lg)',
    transition: 'all 120ms ease', whiteSpace: 'nowrap', lineHeight: 1,
    fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13,
    padding: size === 'sm' ? '5px 12px' : size === 'lg' ? '13px 28px' : '8px 18px',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const variants = {
    primary: { background: 'var(--clr-primary)', color: '#fff', borderColor: 'var(--clr-primary)' },
    outline:  { background: 'transparent', color: 'var(--clr-primary)', borderColor: 'var(--clr-primary)' },
    ghost:    { background: 'transparent', color: 'var(--clr-ink-3)', borderColor: 'transparent' },
    danger:   { background: 'transparent', color: 'var(--clr-danger)', borderColor: 'transparent' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ── Back Link ─────────────────────────────────────────────────
export function BackLink({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Go back" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 13, color: 'var(--clr-ink-3)', background: 'none',
      border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0,
      fontFamily: 'var(--font-body)', fontWeight: 500,
    }}>
      ← Back
    </button>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 32px', textAlign: 'center', gap: 12,
    }}>
      <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{icon}</span>
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--clr-ink)' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--clr-ink-4)' }}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────
export function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 600, color: 'var(--clr-ink-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 14, fontFamily: 'var(--font-display)',
    }}>
      {children}
    </h2>
  );
}

// ── Card shell ────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <article style={{
      background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
      border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </article>
  );
}

// ── Form primitives ───────────────────────────────────────────
export function FormGroup({ children, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>{children}</div>;
}

export function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-ink)', fontFamily: 'var(--font-display)' }}>
      {children}
      {required && <span style={{ color: 'var(--clr-danger)', marginLeft: 2 }} aria-label="required">*</span>}
    </label>
  );
}

export function TextInput({ id, name, value, onChange, placeholder, required, hint, type = 'text', style }) {
  return (
    <>
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{
          width: '100%', background: 'var(--clr-surface)',
          border: '1.5px solid var(--clr-paper-3)',
          borderRadius: 'var(--r-lg)', padding: '10px 14px',
          fontSize: 14, color: 'var(--clr-ink)', outline: 'none',
          transition: 'border-color 120ms ease',
          ...style,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
        onBlur={e  => e.target.style.borderColor = 'var(--clr-paper-3)'}
      />
      {hint && <span id={`${id}-hint`} style={{ fontSize: 12, color: 'var(--clr-ink-4)' }}>{hint}</span>}
    </>
  );
}

export function Textarea({ id, name, value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      id={id} name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={rows}
      style={{
        width: '100%', background: 'var(--clr-surface)',
        border: '1.5px solid var(--clr-paper-3)',
        borderRadius: 'var(--r-lg)', padding: '10px 14px',
        fontSize: 14, color: 'var(--clr-ink)', outline: 'none',
        resize: 'vertical', minHeight: 80, lineHeight: 1.55,
        transition: 'border-color 120ms ease', fontFamily: 'var(--font-body)',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
      onBlur={e  => e.target.style.borderColor = 'var(--clr-paper-3)'}
    />
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12,
      margin: '24px 0', color: 'var(--clr-ink-4)',
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--clr-paper-3)' }} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--clr-paper-3)' }} />
    </div>
  );
}

// ── Loading Dots ──────────────────────────────────────────────
export function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} aria-label="Loading">
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--clr-ink-4)',
          animation: 'dotBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

// ── Media Thumbnail ───────────────────────────────────────────
export function MediaThumb({ item }) {
  return (
    <div role="img" aria-label={item.type === 'video' ? 'Video thumbnail' : 'Photo thumbnail'}
      style={{
        width: 64, height: 64, borderRadius: 'var(--r-lg)',
        background: 'var(--clr-paper)', border: '1px solid var(--clr-paper-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
      <span>{item.emoji}</span>
      {item.type === 'video' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(15,14,12,.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, paddingLeft: 2,
          }}>▶</div>
        </div>
      )}
      {/* TODO: Replace <span> with <img src={item.url} alt="..." /> or <video> */}
    </div>
  );
}
