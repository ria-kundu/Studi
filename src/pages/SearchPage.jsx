// src/pages/SearchPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useRouter } from '../App.jsx';
import { apiRequest } from '../api/client.js';
import { mapSpot } from '../api/mappers.js';
import { Badge, Stars, Divider, LoadingDots } from '../components/ui.jsx';
import { getCurrentPosition } from '../utils/location.js';

export default function SearchPage() {
  const { navigate } = useRouter();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages]   = useState([
    { role: 'assistant', text: 'Hi! Ask me for study spot recommendations based on your past ratings. Try: "I want somewhere quiet with good wifi near me"' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError('');

    try {
      const data = await apiRequest(`/spots?q=${encodeURIComponent(q)}`);
      setResults((data.spots || []).map(mapSpot));
    } catch (err) {
      setResults([]);
      setSearchError(err instanceof Error ? err.message : 'Unable to search spots.');
    } finally {
      setSearchLoading(false);
    }
  }

function getChatSearchMode(message) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('all places') ||
    normalized.includes('all spots') ||
    normalized.includes('everywhere') ||
    normalized.includes('show all') ||
    normalized.includes('list all')
  ) {
    return {
      searchMode: 'all',
      radiusMeters: undefined,
    };
  }

  if (
    normalized.includes('around campus') ||
    normalized.includes('on campus') ||
    normalized.includes('campus-wide') ||
    normalized.includes('campus wide')
  ) {
    return {
      searchMode: 'campus',
      radiusMeters: 5000,
    };
  }

  return {
    searchMode: 'nearby',
    radiusMeters: 1600,
  };
}

 async function handleChat(e) {
  e.preventDefault();

  const text = chatInput.trim();
  if (!text || chatLoading) return;

  setChatInput('');
  setMessages(prev => [...prev, { role: 'user', text }]);
  setChatLoading(true);
  
  try {
    const location = await getCurrentPosition();

    const history = messages
      .slice(-8)
      .map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

    const searchMode = getChatSearchMode(text);

    const data = await apiRequest('/chat', {
      method: 'POST',
      body: {
        message: text,
        history,
        latitude: location?.latitude,
        longitude: location?.longitude,
        searchMode: searchMode.searchMode,
        radiusMeters: searchMode.radiusMeters,
      },
    });

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: data.reply || 'I could not generate a recommendation.',
      },
    ]);
  } catch (err) {
    console.error(err);

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: err instanceof Error
          ? err.message
          : 'Sorry, I could not connect to the AI assistant right now.',
      },
    ]);
  } finally {
    setChatLoading(false);
  }
}

  // Render **bold** markdown in chat
  function renderChatText(text) {
    return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <strong key={i}>{part}</strong>
        : part
    );
  }

  return (
    <main id="main-content" style={containerStyle}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
          color:'var(--clr-ink)', lineHeight:1.1, letterSpacing:'-0.02em' }}>
          Find a Spot
        </h1>
        <p style={{ fontSize:13, color:'var(--clr-ink-4)', marginTop:4 }}>
          Search by name or ask the AI for recommendations
        </p>
      </div>

      {/* ── Search Bar ── */}
      <section aria-label="Search study spots">
        <form onSubmit={handleSearch} role="search">
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ position:'relative', flex:1 }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                color:'var(--clr-ink-4)', fontSize:14, pointerEvents:'none' }}
                aria-hidden="true">🔍</span>
              <input
                type="search" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search study spots…"
                aria-label="Search for a study spot by name"
                autoComplete="off"
                style={{
                  width:'100%', background:'var(--clr-surface)',
                  border:'1.5px solid var(--clr-paper-3)',
                  borderRadius:'var(--r-lg)', padding:'10px 14px 10px 40px',
                  fontSize:14, color:'var(--clr-ink)', outline:'none',
                  transition:'border-color 120ms ease', fontFamily:'var(--font-body)',
                }}
                onFocus={e => e.target.style.borderColor='var(--clr-primary)'}
                onBlur={e  => e.target.style.borderColor='var(--clr-paper-3)'}
              />
            </div>
            <button type="submit"
              style={{ background:'var(--clr-primary)', color:'#fff', border:'none',
                borderRadius:'var(--r-lg)', padding:'10px 20px', fontSize:13,
                fontFamily:'var(--font-display)', fontWeight:600, cursor:'pointer',
                transition:'background 120ms ease', whiteSpace:'nowrap' }}
              onMouseOver={e => e.currentTarget.style.background='var(--clr-primary-hover)'}
              onMouseOut={e  => e.currentTarget.style.background='var(--clr-primary)'}>
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        <div role="region" aria-live="polite" aria-label="Search results">
          {searchLoading && (
            <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}>
              <LoadingDots />
            </div>
          )}
          {!searchLoading && searchError && (
            <p role="alert" style={{ textAlign:'center', color:'var(--clr-danger)', padding:'24px 0', fontSize:13 }}>
              {searchError}
            </p>
          )}
          {!searchLoading && !searchError && results !== null && (
            results.length === 0 ? (
              <p style={{ textAlign:'center', color:'var(--clr-ink-4)', padding:'32px 0', fontSize:13 }}>
                No spots found for "<em>{query}</em>"
              </p>
            ) : (
              <ul style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}
                aria-label="Study spot results">
                {results.map(spot => (
                  <li key={spot.id}>
                    <button onClick={() => navigate('spotDetail', { spotId: spot.id, spotName: spot.name })}
                      style={resultItemStyle}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14, color:'var(--clr-ink)' }}>
                          {spot.name}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                          <Badge category={spot.category} />
                          <span style={{ fontSize:12, color:'var(--clr-ink-4)' }}>
                            {spot.reviewCount} reviews
                          </span>
                        </div>
                      </div>
                      <Stars score={spot.avgScore} />
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </section>

      <Divider label="or ask the AI" />

      {/* ── Chatbot ── */}
      <section aria-label="AI recommendation chatbot">
        <div style={chatPanelStyle}>
          {/* Header */}
          <div style={chatHeaderStyle}>
            <div style={{ width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--clr-primary), #7c5ff7)',
              color:'#fff', fontSize:11, fontWeight:700, display:'flex',
              alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)' }} aria-hidden="true">
              AI
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--clr-ink)',
              fontFamily:'var(--font-display)' }}>
              StudySpot Assistant
            </span>
            <span style={{ fontSize:12, color:'var(--clr-ink-4)', marginLeft:'auto' }}>
              powered by your ratings
            </span>
            {/* TODO: Show spinner while backend fetches user ranking history for LLM context */}
          </div>

          {/* Messages */}
          <div style={{ height:256, overflowY:'auto', padding:16,
            display:'flex', flexDirection:'column', gap:12, scrollBehavior:'smooth' }}
            role="log" aria-live="polite" aria-label="Chat conversation">
            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'75%', padding:'8px 12px', borderRadius:16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius:  msg.role === 'assistant' ? 4 : 16,
                  fontSize:13, lineHeight:1.55,
                  background: msg.role === 'user' ? 'var(--clr-primary)' : 'var(--clr-paper)',
                  color: msg.role === 'user' ? '#fff' : 'var(--clr-ink)',
                  fontFamily:'var(--font-body)',
                }}>
                  {renderChatText(msg.text)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display:'flex', justifyContent:'flex-start' }}>
                <div style={{ background:'var(--clr-paper)', borderRadius:16,
                  borderBottomLeftRadius:4, padding:'10px 14px' }}>
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleChat}
            style={{ display:'flex', gap:8, padding:'12px 16px',
              borderTop:'1px solid var(--clr-paper-2)' }}
            aria-label="Send a message to the AI assistant">
            <input type="text" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="e.g. Somewhere quiet with outlets…"
              aria-label="Message to AI assistant"
              autoComplete="off"
              style={{ flex:1, background:'var(--clr-paper)', border:'1.5px solid transparent',
                borderRadius:'var(--r-lg)', padding:'8px 12px', fontSize:13,
                color:'var(--clr-ink)', outline:'none', fontFamily:'var(--font-body)',
                transition:'border-color 120ms ease' }}
              onFocus={e => e.target.style.borderColor='var(--clr-primary-dim)'}
              onBlur={e  => e.target.style.borderColor='transparent'}
            />
            <button type="submit" aria-label="Send message"
              style={{ width:38, height:38, borderRadius:'var(--r-lg)',
                background:'var(--clr-primary)', color:'#fff', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:16,
                border:'none', cursor:'pointer', flexShrink:0,
                transition:'background 120ms ease' }}
              onMouseOver={e => e.currentTarget.style.background='var(--clr-primary-hover)'}
              onMouseOut={e  => e.currentTarget.style.background='var(--clr-primary)'}>
              ↑
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

const containerStyle = {
  maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px var(--px)',
};

const resultItemStyle = {
  display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
  padding:'12px 16px', background:'var(--clr-surface)',
  border:'1.5px solid var(--clr-paper-2)', borderRadius:'var(--r-lg)',
  cursor:'pointer', transition:'border-color 120ms ease, background 120ms ease',
  textAlign:'left', width:'100%', boxShadow:'var(--sh-xs)',
  fontFamily:'var(--font-body)',
};

const chatPanelStyle = {
  background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
};

const chatHeaderStyle = {
  display:'flex', alignItems:'center', gap:10,
  padding:'12px 16px', borderBottom:'1px solid var(--clr-paper-2)',
  background:'linear-gradient(135deg, var(--clr-primary-dim), #f3f0ff)',
};
