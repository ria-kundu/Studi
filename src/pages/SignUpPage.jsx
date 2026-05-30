import { useState } from 'react';
import { useAuth, useRouter } from '../App.jsx';
import { Btn, FormGroup, Label, TextInput } from '../components/ui.jsx';

export default function SignUpPage() {
  const { signup } = useAuth();
  const { tabNavigate } = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Enter your name, email, and password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" style={containerStyle}>
      <section style={cardStyle} aria-labelledby="signup-title">
        <div style={{ marginBottom:24 }}>
          <button onClick={() => tabNavigate('login')} aria-label="StudySpot home"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'none',
              border:'none', cursor:'pointer', padding:0, marginBottom:18 }}>
            <span style={{ fontSize:'1.35rem', lineHeight:1 }} aria-hidden="true">📍</span>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, color:'var(--clr-ink)' }}>
              Study<span style={{ color:'var(--clr-primary)' }}>Spot</span>
            </span>
          </button>
          <h1 id="signup-title" style={titleStyle}>Sign up</h1>
          <p style={subtitleStyle}>Create an account to share your study spot rankings.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FormGroup>
            <Label htmlFor="signup-name" required>Name</Label>
            <TextInput
              id="signup-name"
              name="name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Maya Chen"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="signup-email" required>Email</Label>
            <TextInput
              id="signup-email"
              name="email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="signup-password" required>Password</Label>
            <TextInput
              id="signup-password"
              name="password"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </FormGroup>

          {error && (
            <p role="alert" style={errorStyle}>{error}</p>
          )}

          <Btn type="submit" size="lg" disabled={loading} style={{ width:'100%' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </Btn>
        </form>

        <p style={{ fontSize:13, color:'var(--clr-ink-3)', marginTop:18, textAlign:'center' }}>
          Already have an account?{' '}
          <button type="button" onClick={() => tabNavigate('login')}
            style={{ color:'var(--clr-primary)', fontWeight:600, background:'none', border:'none',
              cursor:'pointer', fontFamily:'var(--font-body)' }}>
            Log in
          </button>
        </p>
      </section>
    </main>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px var(--px)',
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--clr-surface)',
  borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)',
  boxShadow: 'var(--sh-sm)',
  padding: 24,
};

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: 30,
  color: 'var(--clr-ink)',
  lineHeight: 1.1,
};

const subtitleStyle = {
  fontSize: 13,
  color: 'var(--clr-ink-4)',
  marginTop: 4,
};

const errorStyle = {
  background: '#fff2f0',
  color: 'var(--clr-danger)',
  border: '1px solid #ffd1cc',
  borderRadius: 'var(--r-lg)',
  padding: '10px 12px',
  fontSize: 13,
};
