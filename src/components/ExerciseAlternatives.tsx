import { useState } from 'react';
import { alternativesFor } from '../lib/coverage';
import type { Profile } from '../lib/types';
import { exerciseById } from '../data/exercises';
import SessionCoverage from './SessionCoverage';
export default function ExerciseAlternatives({
  id,
  ids,
  profile,
  onReplace,
  proposal = false,
  focus,
}: {
  id: string;
  ids: string[];
  profile: Profile;
  onReplace: (next: string) => void;
  proposal?: boolean;
  focus?: string;
}) {
  const [choice, setChoice] = useState('');
  const [reason, setReason] = useState('Preference');
  const options = alternativesFor(id, profile, ids);
  const selected = options.find((o) => o.exercise.id === choice);
  return (
    <details
      className="exercise-alternatives"
      onToggle={(e) => {
        if (!e.currentTarget.open) setChoice('');
      }}
    >
      <summary>Alternatives for {exerciseById(id).name}</summary>
      <label className="field">
        Reason for changing
        <select
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setChoice('');
          }}
        >
          {['Preference', 'Equipment unavailable', 'Too difficult', 'Pain'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      {reason === 'Pain' ? (
        <p className="notice">
          Stop the painful movement. An alternative is not automatically safe for the cause of pain.
          Seek appropriate professional advice; you can remove this exercise from the draft.
        </p>
      ) : (
        <>
          <p className="footnote">
            Same-emphasis choices appear first. Equipment, exclusions and experience are respected.
            For difficulty, review the setup and choose a controllable load; these options are not a
            personalized difficulty assessment.
          </p>
          {options.map((o) => (
            <button
              type="button"
              className="replacement"
              key={o.exercise.id}
              aria-pressed={choice === o.exercise.id}
              onClick={() => setChoice(o.exercise.id)}
            >
              <span>
                <strong>{o.exercise.name}</strong>
                <small>
                  {o.exercise.equipment} · {o.reason}
                </small>
              </span>
            </button>
          ))}
          {!options.length && (
            <p>
              No compatible alternatives remain outside this session. Review your equipment or
              remove this exercise; Forma will not add duplicates.
            </p>
          )}
          {selected && (
            <div aria-live="polite">
              <p>
                <strong>Preview: {selected.exercise.name}</strong>
              </p>
              <p>{selected.exercise.setup}</p>
              <SessionCoverage ids={ids.map((x) => (x === id ? choice : x))} focus={focus} />
              <button type="button" className="primary" onClick={() => onReplace(choice)}>
                Use {selected.exercise.name}
              </button>
              <p className="footnote">
                {proposal
                  ? 'Replaces this exercise in the suggestion preview. Apply the suggestions to your day, then Save weekly plan.'
                  : 'Replaces only this exercise in your draft. Save weekly plan to keep the change.'}
              </p>
            </div>
          )}
        </>
      )}
    </details>
  );
}
