import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  History,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp, displayWeight, fromDisplayWeight } from '../lib/context';
import { generatePlan, today, uid, volume } from '../lib/engine';
import { exercises, exerciseById } from '../data/exercises';
import { Modal, Empty, Meter, SectionTitle } from './UI';
import { ExerciseGuide } from './ExerciseGuide';
import type { ActiveWorkout, Plan, WorkoutLog } from '../lib/types';
export default function Workout() {
  const { state, setState, navigate, notify } = useApp();
  const [guide, setGuide] = useState<string | null>(null);
  const [adjust, setAdjust] = useState(false);
  const [duration, setDuration] = useState(state.profile.duration);
  const [lighter, setLighter] = useState(false);
  const [day, setDay] = useState(new Date().getDay());
  const [history, setHistory] = useState(false);
  const [detail, setDetail] = useState<WorkoutLog | null>(null);
  const [replace, setReplace] = useState<number | null>(null);
  const [reason, setReason] = useState('Equipment unavailable');
  const [finish, setFinish] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [note, setNote] = useState('');
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [timerBase, setTimerBase] = useState(90);
  const [deadline, setDeadline] = useState(0);
  const recovery = state.recovery.at(-1);
  const suggestedEasy =
    !!recovery && recovery.date === today() && (recovery.fatigue >= 4 || recovery.sleep < 6);
  const plan =
    state.active?.plan ??
    generatePlan(state.profile, state.workouts, {
      duration,
      lighter: lighter || suggestedEasy,
      day,
    });
  const active = state.active;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimer(left);
      if (left === 0) {
        setRunning(false);
        notify('Rest complete. Ready for your next set?');
        if (navigator.vibrate) navigator.vibrate(150);
      }
    }, 250);
    return () => clearInterval(t);
  }, [running, deadline, notify]);
  function startTimer(n: number) {
    setTimer(n);
    setTimerBase(n);
    setDeadline(Date.now() + n * 1000);
    setRunning(true);
  }
  function start(p: Plan) {
    if (!p.exercises.length) {
      notify('No matching exercises. Update your equipment or excluded movements.');
      return;
    }
    setState((s) => ({
      ...s,
      active: {
        id: uid(),
        started: new Date().toISOString(),
        plan: p,
        index: 0,
        logs: p.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          notes: '',
          sets: Array.from({ length: e.sets }, () => ({
            weight: e.weight,
            reps: e.reps,
            rpe: e.rpe,
            done: false,
          })),
        })),
      },
    }));
    notify('Session started. Begin with your warm-up.');
  }
  function updateActive(fn: (a: ActiveWorkout) => ActiveWorkout) {
    setState((s) => ({ ...s, active: s.active ? fn(s.active) : null }));
  }
  function setField(index: number, field: 'weight' | 'reps' | 'rpe', value: number) {
    updateActive((a) => ({
      ...a,
      logs: a.logs.map((e, i) =>
        i === a.index
          ? { ...e, sets: e.sets.map((s, j) => (j === index ? { ...s, [field]: value } : s)) }
          : e,
      ),
    }));
  }
  function complete(index: number) {
    if (!active) return;
    const set = active.logs[active.index].sets[index];
    if (
      !Number.isFinite(set.weight) ||
      !Number.isFinite(set.reps) ||
      set.reps <= 0 ||
      set.weight < 0 ||
      set.rpe < 1 ||
      set.rpe > 10
    ) {
      notify('Enter valid weight, reps, and RPE (1–10).');
      return;
    }
    updateActive((a) => ({
      ...a,
      logs: a.logs.map((e, i) =>
        i === a.index
          ? { ...e, sets: e.sets.map((s, j) => (j === index ? { ...s, done: !s.done } : s)) }
          : e,
      ),
    }));
    if (!set.done) startTimer(plan.exercises[active.index].rest);
  }
  function saveWorkout() {
    if (!active) return;
    const logged = active.logs
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length);
    if (!logged.length) {
      notify('Complete at least one set before saving.');
      return;
    }
    const w = {
      id: active.id,
      date: today(),
      name: active.plan.name,
      duration: Math.max(1, Math.round((Date.now() - Date.parse(active.started)) / 60000)),
      exercises: logged,
      notes: note,
    };
    setState((s) => ({ ...s, workouts: [...s.workouts, w], active: null }));
    setFinish(false);
    setRunning(false);
    setTimer(0);
    notify('Workout saved. That’s another step forward!');
  }
  const current = active ? exerciseById(active.logs[active.index].exerciseId) : null;
  const completed = active?.logs.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) ?? 0;
  const total = active?.logs.reduce((n, e) => n + e.sets.length, 0) ?? 0;
  const source = replace !== null ? exerciseById(plan.exercises[replace].exerciseId) : null;
  const alternatives = source
    ? exercises.filter(
        (e) =>
          e.id !== source.id &&
          (e.pattern === source.pattern || source.alternatives.includes(e.id)) &&
          (e.equipment === 'Bodyweight' || state.profile.equipment.includes(e.equipment)) &&
          !state.profile.excluded.includes(e.id) &&
          !plan.exercises.some((p) => p.exerciseId === e.id),
      )
    : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SHOW UP FOR YOURSELF</div>
          <h1>
            {active ? 'Make every rep count' : 'Your training'}
            <span className="lime-dot">.</span>
          </h1>
          <p>
            {active
              ? 'Stay present. Move well. You’re doing the work.'
              : 'A plan that fits your goals, your schedule, and your life.'}
          </p>
        </div>
        <button className="outline" onClick={() => setHistory(true)}>
          <History size={17} />
          History
        </button>
      </div>
      {active && current ? (
        <div className="workout-active">
          <div className="card workout-main">
            <div className="spread">
              <span className="eyebrow">
                EXERCISE {active.index + 1} OF {active.logs.length}
              </span>
              <button className="text-button" onClick={() => setDiscard(true)}>
                <X size={15} />
                Discard
              </button>
            </div>
            <Meter value={completed} max={total} />
            <div className="active-title">
              <span className="icon-tile">
                <Dumbbell size={25} />
              </span>
              <div>
                <h2>{current.name}</h2>
                <p>
                  {current.muscle} · {current.equipment}
                </p>
              </div>
            </div>
            <div className="coach-note">{plan.exercises[active.index].reason}</div>
            <div className="spread action-row">
              <button className="text-button" onClick={() => setGuide(current.id)}>
                Open form guide
                <ArrowRight size={15} />
              </button>
              <button className="text-button" onClick={() => setReplace(active.index)}>
                Replace exercise
              </button>
            </div>
            <div className="set-table">
              <div className="set-header">
                <span>SET</span>
                <span>{state.units.toUpperCase()}</span>
                <span>{current.unit ?? 'REPS'}</span>
                <span>RPE</span>
                <span>DONE</span>
              </div>
              {active.logs[active.index].sets.map((s, i) => (
                <div className={`set-row ${s.done ? 'completed' : ''}`} key={i}>
                  <strong>{String(i + 1).padStart(2, '0')}</strong>
                  <input
                    aria-label={`Set ${i + 1} weight in ${state.units}`}
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                    disabled={s.done || !!current.unit}
                    value={displayWeight(s.weight, state.units)}
                    onChange={(e) =>
                      setField(i, 'weight', fromDisplayWeight(Number(e.target.value), state.units))
                    }
                  />
                  <input
                    aria-label={`Set ${i + 1} ${current.unit ?? 'reps'}`}
                    type="number"
                    min="1"
                    max="999"
                    value={s.reps}
                    disabled={s.done}
                    onChange={(e) => setField(i, 'reps', Number(e.target.value))}
                  />
                  <input
                    aria-label={`Set ${i + 1} RPE`}
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={s.rpe}
                    disabled={s.done}
                    onChange={(e) => setField(i, 'rpe', Number(e.target.value))}
                  />
                  <button
                    className={s.done ? 'set-check done' : 'set-check'}
                    aria-label={`${s.done ? 'Undo' : 'Complete'} set ${i + 1}`}
                    onClick={() => complete(i)}
                  >
                    <Check size={19} />
                  </button>
                </div>
              ))}
            </div>
            <p className="footnote">
              RPE 8 ≈ 2 reps left in reserve. Use 0 {state.units} for bodyweight movements.
            </p>
            <label className="field">
              Exercise notes
              <textarea
                placeholder="How did that feel? Anything to remember?"
                value={active.logs[active.index].notes}
                onChange={(e) =>
                  updateActive((a) => ({
                    ...a,
                    logs: a.logs.map((l, i) =>
                      i === a.index ? { ...l, notes: e.target.value } : l,
                    ),
                  }))
                }
              />
            </label>
            <div className="workout-controls">
              <button
                className="outline"
                disabled={active.index === 0}
                onClick={() => updateActive((a) => ({ ...a, index: a.index - 1 }))}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              {active.index < active.logs.length - 1 ? (
                <button
                  className="primary"
                  onClick={() => updateActive((a) => ({ ...a, index: a.index + 1 }))}
                >
                  Next exercise
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button className="primary" onClick={() => setFinish(true)}>
                  Finish workout
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
          <aside className="card session-side">
            <SectionTitle title="Session overview" />
            <div className="session-count">
              {completed}
              <span> / {total} sets</span>
            </div>
            {active.logs.map((e, i) => (
              <button
                key={`${e.exerciseId}-${i}`}
                className={`session-exercise ${active.index === i ? 'selected' : ''}`}
                onClick={() => updateActive((a) => ({ ...a, index: i }))}
              >
                <span>
                  {e.sets.every((s) => s.done) ? (
                    <Check size={16} />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </span>
                <div>
                  <strong>{exerciseById(e.exerciseId).name}</strong>
                  <small>
                    {e.sets.filter((s) => s.done).length} / {e.sets.length} sets complete
                  </small>
                </div>
              </button>
            ))}
            <button className="outline full" onClick={() => setFinish(true)}>
              Finish session
            </button>
          </aside>
        </div>
      ) : (
        <>
          <div className="schedule-strip">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const date = new Date();
              date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + ((d + 6) % 7));
              const dateStr = date.toLocaleDateString('en-CA');
              const done = state.workouts.some((w) => w.date === dateStr);
              const scheduled = state.profile.days.includes(d);
              return (
                <button
                  key={d}
                  className={`schedule-day ${day === d ? 'selected' : ''}`}
                  onClick={() => setDay(d)}
                >
                  <span>{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d]}</span>
                  <strong>{date.getDate()}</strong>
                  <small>
                    {done
                      ? 'Completed'
                      : scheduled
                        ? dateStr < today()
                          ? 'Missed'
                          : 'Training'
                        : 'Rest day'}
                  </small>
                </button>
              );
            })}
          </div>
          {!state.profile.days.includes(day) && (
            <div className="notice">
              A little recovery goes a long way. This is a planned rest day. Your next training
              session is available below if your schedule changes.
            </div>
          )}
          {(state.profile.injuries || state.profile.limitations) && (
            <div className="notice">
              Your profile includes an injury or movement limitation. This rules-based plan cannot
              assess medical restrictions. Confirm suitable movements with a qualified professional
              and exclude any restricted exercises in your profile.
            </div>
          )}
          <div className="card plan-card">
            <div className="spread">
              <div>
                <span className="eyebrow">YOUR PERSONALIZED SESSION</span>
                <h2>{plan.name}</h2>
                <p className="muted">{plan.subtitle}</p>
              </div>
              <button className="outline" onClick={() => setAdjust(true)}>
                <SlidersHorizontal size={16} />
                Adjust session
              </button>
            </div>
            <div className="plan-meta">
              <span>
                <Clock size={16} />
                {plan.duration} minutes
              </span>
              <span>
                <Dumbbell size={16} />
                {plan.exercises.length} exercises
              </span>
              <span>RPE {plan.lighter ? '6' : '7–8'}</span>
            </div>
            <div className="coach-note">
              <strong>Why this session?</strong>{' '}
              {state.profile.days.length >= 4
                ? 'Upper and lower sessions distribute your work across the week.'
                : 'Full-body sessions cover the main movement patterns with recovery between training days.'}{' '}
              {plan.lighter
                ? 'Your volume is reduced today to support recovery.'
                : `Your ${state.profile.duration}-minute preference and ${state.profile.level.toLowerCase()} experience guide the session size.`}
            </div>
            <details className="warmup">
              <summary>Warm-up · 5–8 minutes</summary>
              <p>
                Begin with easy walking or cycling. Rehearse the day’s movements without load, then
                use 1–3 progressively heavier practice sets before your first loaded exercise.
                Warm-up sets do not count as working sets.
              </p>
            </details>
            <div className="plan-exercises">
              {plan.exercises.map((p, i) => {
                const e = exerciseById(p.exerciseId);
                return (
                  <div className="plan-row" key={p.exerciseId}>
                    <span className="exercise-order">{String(i + 1).padStart(2, '0')}</span>
                    <button className="exercise-name" onClick={() => setGuide(e.id)}>
                      <strong>{e.name}</strong>
                      <span>
                        {e.muscle} · {e.equipment}
                      </span>
                    </button>
                    <span className="set-prescription">
                      {p.sets} × {p.reps}
                      <small>
                        {e.unit ?? 'reps'} · {p.rest}s rest
                      </small>
                    </span>
                    <button
                      className="icon-button"
                      aria-label={`Guide for ${e.name}`}
                      onClick={() => setGuide(e.id)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="plan-bottom">
              <p>Finish with 3–5 minutes of easy movement and comfortable stretching.</p>
              <button className="primary" onClick={() => start(plan)}>
                Start workout
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="split-cards">
            <button className="card link-card" onClick={() => navigate('Library')}>
              <Dumbbell size={24} />
              <div>
                <h3>Build your confidence</h3>
                <p>Explore the exercise library and form guides.</p>
              </div>
              <ArrowRight size={20} />
            </button>
            <button className="card link-card" onClick={() => navigate('Settings')}>
              <SlidersHorizontal size={24} />
              <div>
                <h3>Your plan, your way</h3>
                <p>Update training days, equipment, and preferences.</p>
              </div>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}
      {(timer > 0 || running) && (
        <div className="timer-bar" role="timer" aria-label="Rest timer">
          <Clock size={21} />
          <div>
            <small>REST & RESET</small>
            <strong>
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </strong>
          </div>
          <button
            aria-label={running ? 'Pause timer' : 'Resume timer'}
            className="icon-button"
            onClick={() => {
              if (!running) setDeadline(Date.now() + timer * 1000);
              setRunning(!running);
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="Reset rest timer"
            onClick={() => startTimer(timerBase)}
          >
            <RotateCcw size={17} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setTimer((t) => t + 30);
              setDeadline((d) => (running ? d + 30000 : Date.now() + (timer + 30) * 1000));
            }}
          >
            +30s
          </button>
          <button
            className="text-button"
            onClick={() => {
              setTimer(0);
              setRunning(false);
            }}
          >
            Skip
          </button>
        </div>
      )}
      {active && !timer && !running && (
        <button
          className="rest-trigger outline"
          onClick={() => startTimer(plan.exercises[active.index].rest)}
        >
          <Clock size={16} />
          Start rest timer
        </button>
      )}
      {guide && <ExerciseGuide id={guide} onClose={() => setGuide(null)} />}{' '}
      {adjust && (
        <Modal title="Make today work for you" onClose={() => setAdjust(false)}>
          <label className="field">
            Time available
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[20, 30, 40, 50, 60, 75].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={lighter}
              onChange={(e) => setLighter(e.target.checked)}
            />
            I’d like an easier session
          </label>
          <p className="muted">
            We’ll preserve the main movements and trim accessory work. Warm-up and rest still
            matter.
          </p>
          <button
            className="primary full"
            onClick={() => {
              setAdjust(false);
              notify('Session adjusted to fit your day.');
            }}
          >
            Update session
          </button>
        </Modal>
      )}
      {replace !== null && (
        <Modal title="Find another movement" onClose={() => setReplace(null)}>
          <label className="field">
            Why are you replacing this?
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {[
                'Equipment unavailable',
                'Gym too crowded',
                'Too difficult',
                'I dislike this exercise',
                'Pain',
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {reason === 'Pain' ? (
            <div className="notice">
              Stop the painful movement. Seek professional advice before selecting a replacement.
              You can skip this exercise and complete only comfortable movements.
            </div>
          ) : alternatives.length ? (
            alternatives.map((e) => (
              <button
                className="replacement"
                key={e.id}
                onClick={() => {
                  if (active) {
                    updateActive((a) => ({
                      ...a,
                      plan: {
                        ...a.plan,
                        exercises: a.plan.exercises.map((p, i) =>
                          i === replace
                            ? {
                                ...p,
                                exerciseId: e.id,
                                weight: 0,
                                reason: 'New movement: choose a comfortable starting load.',
                              }
                            : p,
                        ),
                      },
                      logs: a.logs.map((l, i) =>
                        i === replace
                          ? {
                              exerciseId: e.id,
                              notes: `Replaced: ${reason}`,
                              sets: l.sets.map((s) => ({ ...s, weight: 0, done: false })),
                            }
                          : l,
                      ),
                    }));
                    setReplace(null);
                    notify('Exercise replaced. Choose a comfortable load.');
                  }
                }}
              >
                <Dumbbell size={20} />
                <span>
                  <strong>{e.name}</strong>
                  <small>
                    {e.equipment} · {e.muscle}
                  </small>
                </span>
                <Plus size={18} />
              </button>
            ))
          ) : (
            <Empty
              title="No matching alternatives"
              description="Update your available equipment or skip this exercise."
            />
          )}
          <p className="footnote">
            Replacing an exercise resets its unsaved sets. Logged workout history remains intact.
          </p>
        </Modal>
      )}
      {finish && (
        <Modal title="Another session in the books" onClose={() => setFinish(false)}>
          <div className="finish-summary">
            <span className="icon-tile">
              <Check size={30} />
            </span>
            <h3>{completed} sets completed</h3>
            <p>
              {completed < total
                ? 'Only completed sets will be saved. Unfinished sets will be left out.'
                : 'You showed up and did the work. Take a moment to appreciate it.'}
            </p>
          </div>
          <label className="field">
            Session notes
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Energy, wins, or something to adjust next time…"
            />
          </label>
          <button className="primary full" disabled={!completed} onClick={saveWorkout}>
            Save workout
            <Check size={18} />
          </button>
        </Modal>
      )}
      {discard && (
        <Modal title="Discard this session?" onClose={() => setDiscard(false)}>
          <p>
            All sets in this active session will be removed. Previously saved workouts will stay in
            your history.
          </p>
          <div className="button-row">
            <button className="outline" onClick={() => setDiscard(false)}>
              Keep training
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setState((s) => ({ ...s, active: null }));
                setDiscard(false);
                setRunning(false);
                setTimer(0);
              }}
            >
              Discard session
            </button>
          </div>
        </Modal>
      )}
      {history && (
        <Modal title="Your workout history" wide onClose={() => setHistory(false)}>
          {state.workouts.length ? (
            [...state.workouts].reverse().map((w) => (
              <button key={w.id} className="history-row" onClick={() => setDetail(w)}>
                <span className="icon-tile pale">
                  <Dumbbell size={20} />
                </span>
                <span>
                  <strong>{w.name}</strong>
                  <small>
                    {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {w.duration} min · {displayWeight(volume(w), state.units).toLocaleString()}{' '}
                    {state.units} volume
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))
          ) : (
            <Empty
              title="Your story starts here"
              description="Complete a workout and it will appear in your history."
            />
          )}
        </Modal>
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <p className="muted">
            {detail.date} · {detail.duration} minutes
          </p>
          {detail.exercises.map((e) => (
            <div className="history-detail" key={e.exerciseId}>
              <h3>{exerciseById(e.exerciseId).name}</h3>
              {e.sets.map((s, i) => (
                <p key={i}>
                  Set {i + 1}: {displayWeight(s.weight, state.units)} {state.units} × {s.reps}{' '}
                  {exerciseById(e.exerciseId).unit ?? 'reps'} · RPE {s.rpe}
                </p>
              ))}
              {e.notes && <p className="muted">{e.notes}</p>}
            </div>
          ))}
          {detail.notes && <div className="coach-note">{detail.notes}</div>}
        </Modal>
      )}
    </>
  );
}
