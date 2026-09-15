import { useState } from 'react';
import { useApp } from '../lib/context';
import { applyReviewMove, dayNames, reviewText, weeklyReview } from '../lib/review';
export default function WeeklyReview({ onDiscuss }: { onDiscuss?: (text: string) => void }) {
  const { state, setState, navigate, notify } = useApp();
  const r = weeklyReview(state);
  const [error, setError] = useState('');
  return (
    <section className="card weekly-review">
      <div className="eyebrow">YOUR WEEK, REVIEWED</div>
      <h2>Plan & progress review</h2>
      <p className="muted">
        Current schedule + the last seven complete days of logs. Updates as you log training.
      </p>
      <div className="review-stats">
        <span>
          <strong>{r.completedDays}</strong> days with completed sets
        </span>
        <span>
          <strong>{r.avgRpe === null ? '—' : r.avgRpe.toFixed(1)}</strong> average logged effort /
          10
        </span>
      </div>
      <details>
        <summary>Planned weekly sets by primary muscle</summary>
        <p className="footnote">
          {Object.entries(r.sets)
            .map(([m, n]) => `${m}: ${n}`)
            .join(' · ') || 'No strength sets planned.'}{' '}
          Secondary muscles are not counted; these are estimates.
        </p>
      </details>
      <ul className="cue-list">
        {r.findings.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {r.move && (
        <div className="notice">
          <strong>
            Proposed change: {dayNames[r.move.from]} → {dayNames[r.move.to]}
          </strong>
          <p>
            Move the session to this rest day for more spacing. Keep its exercises and leave other
            sessions intact. Your active workout is unchanged.
          </p>
          <button
            className="outline"
            onClick={() => {
              try {
                const profile = applyReviewMove(state, r.move!.from, r.move!.to);
                setState((s) => ({ ...s, profile }));
                setError('');
                notify('Schedule change accepted.');
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Accept schedule change
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="button-row">
        <button className="outline" onClick={() => navigate('Workout')}>
          Edit my weekly plan
        </button>
        <button
          className="primary"
          onClick={() => {
            if (onDiscuss)
              onDiscuss('Explain my weekly review and help me choose a realistic next step.');
            else {
              setState((s) => ({
                ...s,
                messages: [...s.messages, { role: 'assistant', content: reviewText(s) }],
              }));
              navigate('Trainer');
            }
          }}
        >
          Discuss with Forma
        </button>
      </div>
      <p className="footnote">
        Rules-based review. Recovery flags, set counts and timing are prompts for discussion, not
        universal limits.{' '}
        <a
          href="https://acsm.org/resistance-training-guidelines-update-2026/"
          target="_blank"
          rel="noreferrer"
        >
          Training principles ↗
        </a>
      </p>
    </section>
  );
}
