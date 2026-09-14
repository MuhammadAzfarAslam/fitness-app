import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../lib/context';
import { exercises, exerciseById } from '../data/exercises';
import { generatePlan } from '../lib/engine';
import type { Profile } from '../lib/types';
import { Modal } from './UI';
const week = [1, 2, 3, 4, 5, 6, 0];
const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export default function WeeklyPlanEditor({ onClose }: { onClose: () => void }) {
  const { state, setState, notify } = useApp();
  const [draft, setDraft] = useState<Profile>(() => structuredClone(state.profile));
  const [day, setDay] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const training = draft.days.includes(day);
  const custom = draft.weeklyPlan?.[day];
  const generated = generatePlan({ ...draft, weeklyPlan: undefined }, state.workouts, { day });
  const ids = custom?.exerciseIds ?? generated.exercises.map((e) => e.exerciseId);
  const available = exercises.filter(
    (e) =>
      !draft.excluded.includes(e.id) &&
      (e.equipment === 'Bodyweight' || draft.equipment.includes(e.equipment)) &&
      (draft.level !== 'Beginner' || e.difficulty !== 'Advanced') &&
      (!draft.preferences.toLowerCase().includes('no barbell') || e.equipment !== 'Barbell'),
  );
  const results = available.filter(
    (e) =>
      !ids.includes(e.id) && `${e.name} ${e.muscle}`.toLowerCase().includes(search.toLowerCase()),
  );
  function update(exerciseIds: string[], name = custom?.name ?? `${names[day]} · My workout`) {
    setError('');
    setDraft((p) => ({ ...p, weeklyPlan: { ...p.weeklyPlan, [day]: { name, exerciseIds } } }));
  }
  function move(index: number, offset: number) {
    const next = [...ids];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    update(next);
  }
  function save() {
    if (!draft.days.length) {
      setError('Choose at least one training day.');
      return;
    }
    for (const d of draft.days) {
      if (draft.weeklyPlan?.[d] && !draft.weeklyPlan[d].name.trim()) {
        setError(`${names[d]} needs a session name, such as Leg day.`);
        setDay(d);
        return;
      }
      const plan = generatePlan(draft, state.workouts, { day: d });
      if (!plan.exercises.length) {
        setError(
          `${names[d]} needs at least one available exercise. Choose exercises or mark it as a rest day.`,
        );
        setDay(d);
        return;
      }
    }
    setState((s) => ({
      ...s,
      profile: { ...s.profile, days: draft.days, weeklyPlan: draft.weeklyPlan },
    }));
    notify('Weekly plan updated. Your next sessions will use your choices.');
    onClose();
  }
  return (
    <Modal title="Edit weekly plan" onClose={onClose} wide>
      <p className="muted">
        Choose a day, make it a training or rest day, then select exercises in the order you want to
        perform them. Changes repeat each week.
      </p>
      <div className="weekly-days" role="group" aria-label="Choose day to edit">
        {week.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={day === d}
            onClick={() => {
              setDay(d);
              setSearch('');
              setError('');
            }}
          >
            <strong>{names[d].slice(0, 3)}</strong>
            <small>{draft.days.includes(d) ? 'Training' : 'Rest'}</small>
          </button>
        ))}
      </div>
      <h3 className="form-section">{names[day]}</h3>
      <label className="check-field">
        <input
          type="checkbox"
          checked={training}
          onChange={(e) => {
            setError('');
            setDraft((p) => ({
              ...p,
              days: week.filter((d) => (d === day ? e.target.checked : p.days.includes(d))),
            }));
          }}
        />
        Training day
      </label>
      {training ? (
        <>
          <label className="field">
            Session name
            <input
              maxLength={60}
              placeholder="For example: Leg day"
              value={custom?.name ?? generated.name}
              onChange={(e) => update(ids, e.target.value)}
            />
          </label>
          <p className="footnote">
            {custom
              ? 'Your chosen exercises'
              : 'Forma’s suggested exercises — edit any row to customize this day.'}
          </p>
          <ol className="weekly-exercises">
            {ids.map((id, i) => {
              const e = exerciseById(id);
              return (
                <li key={id}>
                  <div>
                    <strong>
                      {i + 1}. {e.name}
                    </strong>
                    <small>
                      {e.muscle} · {e.equipment}
                      {!available.some((a) => a.id === id)
                        ? ' · Unavailable with current profile'
                        : ''}
                    </small>
                  </div>
                  <div className="weekly-row-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${e.name} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${e.name} down`}
                      disabled={i === ids.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove ${e.name}`}
                      onClick={() => update(ids.filter((x) => x !== id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {!ids.length && (
            <p className="notice">Add at least one exercise below, or switch this to a rest day.</p>
          )}
          <h3 className="form-section">Add exercises</h3>
          <label className="field">
            Search exercises
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search legs, squat, dumbbell…"
            />
          </label>
          <p className="footnote">
            Choices respect your equipment, experience and excluded exercises. Update your profile
            if those have changed.
          </p>
          <div className="weekly-catalog">
            {results.map((e) => (
              <button
                type="button"
                key={e.id}
                onClick={() => update([...ids, e.id])}
                aria-label={`Add ${e.name}`}
              >
                <div>
                  <strong>{e.name}</strong>
                  <small>
                    {e.muscle} · {e.equipment}
                  </small>
                </div>
                <Plus size={18} />
              </button>
            ))}
            {!results.length && (
              <p className="muted">No more matching exercises. Try another search.</p>
            )}
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const next = { ...draft.weeklyPlan };
              delete next[day];
              setDraft((p) => ({ ...p, weeklyPlan: next }));
              setError('');
            }}
          >
            Use Forma’s suggested session for {names[day]}
          </button>
        </>
      ) : (
        <p className="notice">
          No workout is scheduled for {names[day]}. Turn on Training day to choose exercises.
        </p>
      )}
      <p className="footnote">
        Sets, reps and load suggestions still come from Forma. A saved custom list keeps all your
        exercises; session duration is a preference, not a guarantee.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="outline" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={save}>
          Save weekly plan
        </button>
      </div>
    </Modal>
  );
}
