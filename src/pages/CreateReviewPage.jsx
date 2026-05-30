// src/pages/CreateReviewPage.jsx
import { useState } from 'react';
import { useRouter } from '../App.jsx';
import { useToast } from '../App.jsx';
import { CATEGORIES, RATING_FIELDS } from '../data/mock.js';
import { BackLink, Btn, FormGroup, Label, TextInput, Textarea } from '../components/ui.jsx';

const DEFAULT_FORM = {
  spotName:  '',
  category:  'Libraries',
  quietness: 3,
  restroom:  3,
  wifi:      3,
  outlets:   3,
  crowdness: 3,
  seating:   3,
  hours:     '',
  notes:     '',
  media:     [],
};

const CAT_EMOJI = {
  Libraries: '📚',
  Cafes:     '☕',
  Outdoors:  '🌿',
  Other:     '📍',
};

export default function CreateReviewPage() {
  const { back, navigate } = useRouter();
  const showToast          = useToast();
  const [form, setForm]    = useState(DEFAULT_FORM);
  const [dragOver, setDragOver] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleFiles(files) {
    // TODO: Upload each file to object storage (S3/R2) via presigned URL
    // TODO: Store returned public URLs in hidden state for form submission
    set('media', [...form.media, ...Array.from(files)]);
  }

  function removeMedia(idx) {
    set('media', form.media.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.spotName.trim()) {
      showToast('Please enter a study spot name.');
      return;
    }
    if (form.media.length === 0) {
      showToast('Please upload at least one photo or video.');
      return;
    }
    // TODO: POST /api/rankings as multipart/form-data
    // TODO: Disable submit button while in-flight; show loading state
    // TODO: On 422 error, display field-level validation errors from backend
    // TODO: On success, navigate to the newly created ranking or back to feed
    showToast('Review submitted! (TODO: connect to backend)');
    navigate('feed');
  }

  return (
    <main id="main-content" style={containerStyle}>
      <BackLink onClick={back} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
          color:'var(--clr-ink)', lineHeight:1.1, letterSpacing:'-0.02em' }}>
          Rate a Study Spot
        </h1>
        <p style={{ fontSize:13, color:'var(--clr-ink-4)', marginTop:4 }}>
          Share your experience with the community
        </p>
      </div>

      <div style={formCardStyle}>
        <form onSubmit={handleSubmit} noValidate>

          {/* ── SECTION 1: Location ── */}
          <FormSection title="Location">
            <FormGroup>
              <Label htmlFor="spot-name" required>Study Spot Name</Label>
              <TextInput
                id="spot-name" name="spotName" value={form.spotName}
                onChange={e => set('spotName', e.target.value)}
                placeholder="e.g. Main Street Library"
                required
                hint="Start typing to search existing spots, or add a new one."
                // TODO: Autocomplete suggestions from GET /api/spots?q=...
              />
            </FormGroup>

            {/* Category Pills */}
            <FormGroup>
              <fieldset style={{ border:'none' }}>
                <legend style={{ fontSize:13, fontWeight:600, color:'var(--clr-ink)',
                  fontFamily:'var(--font-display)', marginBottom:8 }}>
                  Category <span style={{ color:'var(--clr-danger)' }} aria-label="required">*</span>
                </legend>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {CATEGORIES.map(cat => (
                    <label key={cat} style={{ cursor:'pointer' }}>
                      <input type="radio" name="category" value={cat}
                        checked={form.category === cat}
                        onChange={() => set('category', cat)}
                        style={{ position:'absolute', opacity:0, width:0, height:0 }}
                      />
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'7px 14px', borderRadius:'var(--r-full)',
                        fontSize:13, fontWeight:500,
                        border: form.category === cat
                          ? '2px solid var(--clr-primary)'
                          : '2px solid var(--clr-paper-3)',
                        background: form.category === cat
                          ? 'var(--clr-primary-dim)'
                          : 'var(--clr-surface)',
                        color: form.category === cat
                          ? 'var(--clr-primary)'
                          : 'var(--clr-ink-3)',
                        transition:'all 120ms ease', cursor:'pointer',
                        fontFamily:'var(--font-body)',
                      }}>
                        <span aria-hidden="true">{CAT_EMOJI[cat]}</span>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="hours" required>Hours Open</Label>
              <TextInput
                id="hours" name="hours" value={form.hours}
                onChange={e => set('hours', e.target.value)}
                placeholder="e.g. 8am – 10pm, or 24 hours"
                required
              />
            </FormGroup>
          </FormSection>

          {/* ── SECTION 2: Ratings ── */}
          <FormSection title="Ratings *">
            <div style={ratingsGridStyle}>
              {RATING_FIELDS.map(({ key, label }) => (
                <SliderField key={key} id={`slider-${key}`} label={label}
                  value={form[key]} onChange={v => set(key, v)} />
              ))}
            </div>
          </FormSection>

          {/* ── SECTION 3: Media ── */}
          <FormSection title="Photos & Videos *">
            {/* Upload zone */}
            <label htmlFor="media-upload"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              style={{
                ...uploadZoneStyle,
                borderColor: dragOver ? 'var(--clr-primary)' : 'var(--clr-paper-3)',
                background:  dragOver ? 'var(--clr-primary-dim)' : 'transparent',
              }}>
              <span style={{ fontSize:'2rem' }} aria-hidden="true">📎</span>
              <span style={{ fontSize:13, color:'var(--clr-ink-3)' }}>
                Tap or drag to upload photos or videos
              </span>
              <span style={{ fontSize:12, color:'var(--clr-ink-4)' }}>
                JPG, PNG, MP4 · up to 50MB each
              </span>
              {form.media.length > 0 && (
                <span style={{ fontSize:12, color:'var(--clr-primary)', fontWeight:500 }}
                  aria-live="polite">
                  {form.media.length} file{form.media.length !== 1 ? 's' : ''} selected
                </span>
              )}
              <input id="media-upload" type="file" multiple accept="image/*,video/*"
                className="sr-only" style={{ position:'absolute', opacity:0, width:1, height:1 }}
                aria-label="Upload photos or videos"
                onChange={e => handleFiles(e.target.files)}
                // TODO: On change, upload to object storage and store returned URLs
              />
            </label>

            {/* Preview strip */}
            {form.media.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}
                aria-label="Uploaded media previews">
                {form.media.map((f, i) => {
                  const isVideo = f.type?.startsWith('video/');
                  return (
                    <div key={i} role="img" aria-label={f.name}
                      style={{ width:72, height:72, borderRadius:'var(--r-lg)',
                        background:'var(--clr-paper)', border:'1.5px solid var(--clr-paper-3)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'1.4rem', position:'relative', flexShrink:0, overflow:'hidden' }}>
                      <span>{isVideo ? '🎥' : '🖼️'}</span>
                      {/* TODO: Show actual thumbnail via URL.createObjectURL(f) in <img> */}
                      <button type="button" onClick={() => removeMedia(i)}
                        aria-label={`Remove ${f.name}`}
                        style={{ position:'absolute', top:2, right:2, width:18, height:18,
                          borderRadius:'50%', background:'rgba(15,14,12,.7)', color:'#fff',
                          fontSize:10, display:'flex', alignItems:'center', justifyContent:'center',
                          border:'none', cursor:'pointer', lineHeight:1 }}>
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </FormSection>

          {/* ── SECTION 4: Notes ── */}
          <FormSection title="Additional Notes">
            <FormGroup>
              <Label htmlFor="notes">
                Notes
                <span style={{ fontWeight:400, color:'var(--clr-ink-4)', marginLeft:8, fontSize:12 }}>
                  optional
                </span>
              </Label>
              <Textarea id="notes" name="notes" value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Anything else worth knowing — parking, vibe, best times to visit…"
                rows={3}
              />
            </FormGroup>
          </FormSection>

          {/* ── Actions ── */}
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end',
            paddingTop:20, borderTop:'1px solid var(--clr-paper-2)', flexWrap:'wrap' }}>
            <Btn variant="ghost" onClick={back}>Cancel</Btn>
            <Btn variant="primary" size="lg" type="submit">
              Submit Ranking
              {/* TODO: Show loading spinner while POST /api/rankings is in-flight */}
            </Btn>
          </div>

        </form>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────

function FormSection({ title, children }) {
  return (
    <div style={{ paddingBottom: 24, marginBottom: 24,
      borderBottom: '1px solid var(--clr-paper-2)' }}>
      <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-ink-4)',
        textTransform:'uppercase', letterSpacing:'0.08em',
        fontFamily:'var(--font-display)', marginBottom:16 }}>
        {title}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {children}
      </div>
    </div>
  );
}

function SliderField({ id, label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <label htmlFor={id}
        style={{ fontSize:13, color:'var(--clr-ink-3)', width:136, flexShrink:0,
          fontFamily:'var(--font-body)' }}>
        {label}
      </label>
      <input id={id} type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuemin={1} aria-valuemax={5} aria-valuenow={value}
        style={{ flex:1, accentColor:'var(--clr-primary)', cursor:'pointer', height:4 }}
      />
      <span style={{ width:16, textAlign:'right', fontSize:13, fontWeight:700,
        color:'var(--clr-primary)', fontFamily:'var(--font-display)' }}
        aria-live="polite">
        {value}
      </span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────

const containerStyle = {
  maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px var(--px)',
};

const formCardStyle = {
  background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)',
  padding: 24,
};

const ratingsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '14px 32px',
};

const uploadZoneStyle = {
  border: '2px dashed', borderRadius: 'var(--r-xl)',
  padding: '32px 24px', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 8, textAlign: 'center', cursor: 'pointer',
  transition: 'border-color 120ms ease, background 120ms ease',
  position: 'relative',
};
