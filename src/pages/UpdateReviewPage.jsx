import { useEffect, useState } from 'react';
import { useRouter, useToast } from '../App.jsx';
import { apiFormRequest, apiRequest } from '../api/client.js';
import { mapRanking } from '../api/mappers.js';
import { RATING_FIELDS } from '../data/mock.js';
import { BackLink, Btn, EmptyState, FormGroup, Label, LoadingDots, MediaThumb } from '../components/ui.jsx';

const DEFAULT_FORM = {
  quietness: 3,
  restroom: 3,
  wifi: 3,
  outlets: 3,
  crowdness: 3,
  seating: 3,
};

export default function UpdateReviewPage({ rankingId, spotId, spotName }) {
  const { back, navigate } = useRouter();
  const showToast = useToast();
  const [ranking, setRanking] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newMedia, setNewMedia] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    async function loadReview() {
      if (!spotId || !rankingId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await apiRequest(`/spots/${encodeURIComponent(spotId)}/rankings`);
        if (!active) return;

        const found = (data.rankings || []).map(mapRanking).find(item => item.id === rankingId);
        if (!found) {
          setRanking(null);
          return;
        }

        setRanking(found);
        setForm({
          quietness: found.quietness,
          restroom: found.restroom,
          wifi: found.wifi,
          outlets: found.outlets,
          crowdness: found.crowdness,
          seating: found.seating,
        });
        setExistingMedia(found.media || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load review.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReview();

    return () => {
      active = false;
    };
  }, [rankingId, spotId]);

  function handleFiles(files) {
    setNewMedia(current => [...current, ...Array.from(files)].slice(0, 8));
  }

  function removeExistingMedia(index) {
    setExistingMedia(current => current.filter((_, i) => i !== index));
  }

  function removeNewMedia(index) {
    setNewMedia(current => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body = new FormData();
      body.set('quietness', String(form.quietness));
      body.set('restroom', String(form.restroom));
      body.set('wifi', String(form.wifi));
      body.set('outlets', String(form.outlets));
      body.set('crowdness', String(form.crowdness));
      body.set('seating', String(form.seating));
      body.set('media', JSON.stringify(existingMedia));

      newMedia.forEach(file => {
        body.append('mediaFiles', file);
      });

      const data = await apiFormRequest(`/rankings/${encodeURIComponent(rankingId)}`, {
        method: 'PATCH',
        formData: body,
      });

      showToast('Review updated!');
      navigate('spotDetail', { spotId: data.ranking.spotId, spotName: data.ranking.spotName });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update review.';
      setError(message);
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" style={containerStyle}>
        <BackLink onClick={back} />
        <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
          <LoadingDots />
        </div>
      </main>
    );
  }

  if (error || !ranking) {
    return (
      <main id="main-content" style={containerStyle}>
        <BackLink onClick={back} />
        <EmptyState icon="?" title="Review not found" subtitle={error || 'Unable to find your review for this spot.'} />
      </main>
    );
  }

  return (
    <main id="main-content" style={containerStyle}>
      <BackLink onClick={back} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
          color:'var(--clr-ink)', lineHeight:1.1 }}>
          Update Review
        </h1>
        <p style={{ fontSize:13, color:'var(--clr-ink-4)', marginTop:4 }}>
          {ranking.spotName || spotName}
        </p>
      </div>

      <div style={formCardStyle}>
        <form onSubmit={handleSubmit} noValidate>
          <FormSection title="Ratings">
            <div style={ratingsGridStyle}>
              {RATING_FIELDS.map(({ key, label }) => (
                <SliderField key={key} id={`update-slider-${key}`} label={label}
                  value={form[key]} onChange={value => set(key, value)} />
              ))}
            </div>
          </FormSection>

          <FormSection title="Photos & Videos">
            {existingMedia.length > 0 && (
              <FormGroup>
                <Label>Current media</Label>
                <div style={mediaGridStyle}>
                  {existingMedia.map((item, index) => (
                    <div key={`${item.url || item.emoji}-${index}`} style={mediaItemStyle}>
                      <MediaThumb item={item} />
                      <button type="button" onClick={() => removeExistingMedia(index)}
                        aria-label="Remove current media" style={removeButtonStyle}>
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </FormGroup>
            )}

            <label htmlFor="update-media-upload"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              style={{
                ...uploadZoneStyle,
                borderColor: dragOver ? 'var(--clr-primary)' : 'var(--clr-paper-3)',
                background: dragOver ? 'var(--clr-primary-dim)' : 'transparent',
              }}>
              <span style={{ fontSize:'2rem' }} aria-hidden="true">📎</span>
              <span style={{ fontSize:13, color:'var(--clr-ink-3)' }}>
                Tap or drag to add replacement media
              </span>
              <input id="update-media-upload" type="file" multiple accept="image/*,video/*"
                className="sr-only" style={{ position:'absolute', opacity:0, width:1, height:1 }}
                aria-label="Upload replacement photos or videos"
                onChange={e => handleFiles(e.target.files)}
              />
            </label>

            {newMedia.length > 0 && (
              <div style={mediaGridStyle} aria-label="New media previews">
                {newMedia.map((file, index) => (
                  <div key={`${file.name}-${index}`} style={mediaItemStyle}>
                    <div style={newMediaThumbStyle}>{file.type?.startsWith('video/') ? '🎥' : '🖼️'}</div>
                    <button type="button" onClick={() => removeNewMedia(index)}
                      aria-label={`Remove ${file.name}`} style={removeButtonStyle}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end',
            paddingTop:20, borderTop:'1px solid var(--clr-paper-2)', flexWrap:'wrap' }}>
            {error && (
              <p role="alert" style={{ flexBasis:'100%', color:'var(--clr-danger)', fontSize:13 }}>
                {error}
              </p>
            )}
            <Btn variant="ghost" onClick={back}>Cancel</Btn>
            <Btn variant="primary" size="lg" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Review'}
            </Btn>
          </div>
        </form>
      </div>
    </main>
  );
}

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
        style={{ flex:1, accentColor:'var(--clr-primary)', cursor:'pointer', height:4 }}
      />
      <span style={{ width:16, textAlign:'right', fontSize:13, fontWeight:700,
        color:'var(--clr-primary)', fontFamily:'var(--font-display)' }}>
        {value}
      </span>
    </div>
  );
}

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

const mediaGridStyle = {
  display:'flex', flexWrap:'wrap', gap:8,
};

const mediaItemStyle = {
  width:72, height:72, position:'relative',
};

const newMediaThumbStyle = {
  width:64, height:64, borderRadius:'var(--r-lg)', background:'var(--clr-paper)',
  border:'1px solid var(--clr-paper-3)', display:'flex', alignItems:'center',
  justifyContent:'center', fontSize:'1.5rem',
};

const removeButtonStyle = {
  position:'absolute', top:2, right:2, width:18, height:18,
  borderRadius:'50%', background:'rgba(15,14,12,.7)', color:'#fff',
  fontSize:10, display:'flex', alignItems:'center', justifyContent:'center',
  border:'none', cursor:'pointer', lineHeight:1,
};
