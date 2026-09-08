import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Dumbbell, Leaf, Moon, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../lib/context';
import { coachReply } from '../lib/engine';
import { requestCoach } from '../lib/storage';
export default function Trainer() {
  const { state, setState, userId } = useApp();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.length, busy]);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput('');
    setState((s) => ({ ...s, messages: [...s.messages, { role: 'user', content: text.trim() }] }));
    setBusy(true);
    let reply = '';
    try {
      reply = ai && userId ? await requestCoach(text, state) : coachReply(text, state);
    } catch {
      reply =
        'The connected coach is unavailable right now. Here’s guidance from the built-in coach instead:\n\n' +
        coachReply(text, state);
    }
    setState((s) => ({ ...s, messages: [...s.messages, { role: 'assistant', content: reply }] }));
    setBusy(false);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE GUIDANCE GOES A LONG WAY</div>
          <h1>
            In your corner<span className="lime-dot">.</span>
          </h1>
          <p>Your goals. Your context. A coach to help you connect the dots.</p>
        </div>
        <span className="date-chip">
          <span className="tiny-dot" />{' '}
          {ai && userId ? 'Connected AI coach' : 'Built-in coach · rules-based'}
        </span>
      </div>
      <div className="trainer-layout">
        <section className="card chat-card">
          <div className="chat-header">
            <span className="icon-tile">
              <Zap size={23} />
            </span>
            <div>
              <h2>Forma coach</h2>
              <p>
                {ai && userId
                  ? 'Personalized with your profile and recent training'
                  : 'Practical guidance from your profile and training history'}
              </p>
            </div>
          </div>
          <div className="messages" aria-live="polite">
            {state.messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.role === 'assistant' && (
                  <span className="coach-avatar">
                    <Zap size={16} />
                  </span>
                )}
                <div>
                  {m.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {busy && (
              <div className="message assistant">
                <span className="coach-avatar">
                  <Zap size={16} />
                </span>
                <div className="typing">Thinking about your next step…</div>
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              aria-label="Message your trainer"
              maxLength={2000}
              placeholder="What’s on your mind?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button className="primary" aria-label="Send message" disabled={busy || !input.trim()}>
              <ArrowUp size={21} />
            </button>
          </form>
          <p className="chat-disclaimer">
            Educational fitness guidance. Not a diagnosis or a substitute for professional care.
          </p>
        </section>
        <aside className="trainer-side">
          <section className="card">
            <span className="eyebrow">LET’S TALK ABOUT</span>
            <h3>A stronger next step</h3>
            {[
              { icon: Dumbbell, q: 'Should I increase my bench press weight?' },
              { icon: Moon, q: 'I feel tired. Should I take an easier session?' },
              { icon: Leaf, q: 'Am I getting enough protein?' },
              { icon: Sparkles, q: 'I only have 30 minutes today.' },
            ].map(({ icon: Icon, q }) => (
              <button
                key={q}
                className="prompt-button"
                disabled={busy}
                onClick={() => void send(q)}
              >
                <Icon size={18} />
                {q}
              </button>
            ))}
          </section>
          <section className="card coach-context">
            <h3>Built around you</h3>
            <div>
              <span>YOUR FOCUS</span>
              <strong>{state.profile.goal}</strong>
            </div>
            <div>
              <span>YOUR RHYTHM</span>
              <strong>
                {state.profile.days.length} days / week · {state.profile.duration} minutes
              </strong>
            </div>
            <div>
              <span>YOUR EXPERIENCE</span>
              <strong>{state.workouts.length} logged workouts</strong>
            </div>
            {userId && (
              <label className="check-field">
                <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
                Use connected AI coach
              </label>
            )}
            <p className="footnote">
              {ai
                ? 'Your profile and recent training are sent to the configured AI provider when you ask a question.'
                : 'The built-in coach uses transparent rules. It is not a live AI service.'}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
