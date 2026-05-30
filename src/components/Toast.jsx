// src/components/Toast.jsx
export default function Toast({ message }) {
  return (
    <div role="status" style={{
      background: 'var(--clr-ink)', color: '#fff',
      padding: '10px 20px', borderRadius: 'var(--r-full)',
      fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
      pointerEvents: 'auto', boxShadow: 'var(--sh-lg)',
      animation: 'toastIn 250ms ease both, toastOut 250ms ease 2.5s both',
      fontFamily: 'var(--font-body)',
    }}>
      {message}
    </div>
  );
}
