import { useState } from 'react';
import { Modal } from './UI';
import { useApp } from '../lib/context';
import { today } from '../lib/engine';
import { readiness } from '../lib/review';
import type { Recovery } from '../lib/types';
export default function ReadinessCheck({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart?: (easy: boolean) => void;
}) {
  const { state, setState, notify } = useApp();
  const [r, setR] = useState<Recovery>(() => ({
    ...(state.recovery.find((x) => x.date === today()) ?? {
      date: today(),
      sleep: state.profile.sleep,
      fatigue: 2,
      soreness: 2,
      stress: 2,
      motivation: 3,
    }),
    pain: undefined,
  }));
  const [error, setError] = useState('');
  const result = readiness(r);
  function save(easy?: boolean) {
    if (!r.pain) {
      setError('Please answer the pain and symptoms question.');
      return;
    }
    if (!Number.isFinite(r.sleep) || r.sleep < 0 || r.sleep > 14) {
      setError('Enter sleep between 0 and 14 hours.');
      return;
    }
    setState((s) => ({
      ...s,
      recovery: [...s.recovery.filter((x) => x.date !== today()), { ...r, date: today() }],
    }));
    notify('Readiness check saved.');
    if (easy !== undefined && result.level !== 'stop') onStart?.(easy);
    onClose();
  }
  return (
    <Modal title="Before you train" onClose={onClose}>
      <p>A quick check helps you choose today’s effort. Muscle soreness and pain are different.</p>
      <label className="field">
        Sleep last night (hours)
        <input
          type="number"
          min="0"
          max="14"
          step="0.5"
          value={Number.isNaN(r.sleep) ? '' : r.sleep}
          onChange={(e) =>
            setR({ ...r, sleep: e.target.value === '' ? NaN : Number(e.target.value) })
          }
        />
      </label>
      {(['fatigue', 'soreness', 'stress', 'motivation'] as const).map((k) => (
        <label className="field" key={k}>
          {k} · {r[k]} / 5
          <input
            type="range"
            min="1"
            max="5"
            value={r[k]}
            onChange={(e) => setR({ ...r, [k]: Number(e.target.value) })}
          />
          <span className="footnote">
            1 = low · 5 = high{k === 'soreness' ? ' muscle soreness' : ''}
          </span>
        </label>
      ))}
      <label className="field">
        Pain or concerning symptoms?
        <select
          value={r.pain ?? ''}
          onChange={(e) => {
            setR({ ...r, pain: e.target.value as Recovery['pain'] });
            setError('');
          }}
        >
          <option value="" disabled>
            Select an answer
          </option>
          <option value="none">None — ordinary muscle soreness only, if any</option>
          <option value="movement">New or worsening pain, or pain with movement</option>
          <option value="urgent">
            Chest pain, severe dizziness, fainting or unusual breathlessness
          </option>
        </select>
      </label>
      <div className="notice" role="status">
        {result.reasons.join(' ')}
        {result.level === 'easy'
          ? ' Consider reduced effort or a rest day. Reduced effort removes one working set per exercise (minimum one), lowers suggested load by 10%, and targets RPE 6.'
          : ''}
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="button-row">
        {onStart && result.level !== 'stop' ? (
          <>
            <button className="primary" onClick={() => save(result.level === 'easy')}>
              {result.level === 'easy' ? 'Start reduced-effort session' : 'Start planned session'}
            </button>
            {result.level === 'easy' && (
              <button className="outline" onClick={() => save(false)}>
                Keep planned effort
              </button>
            )}
            <button className="text-button" onClick={() => save()}>
              Save check-in without starting
            </button>
          </>
        ) : (
          <button className="primary" onClick={() => save()}>
            Save check-in
          </button>
        )}
      </div>
      <p className="footnote">
        These are conservative app rules, not medical clearance. You can close this check to rest
        instead.
      </p>
    </Modal>
  );
}
