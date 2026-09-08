import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  LogOut,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  User,
  X,
} from 'lucide-react';
import { useApp, displayWeight, fromDisplayWeight } from '../lib/context';
import { supabase } from '../lib/storage';
import { exercises } from '../data/exercises';
import { Modal, Meter } from './UI';
import type { Profile } from '../lib/types';
const goals = [
  'General fitness',
  'Cardio improvement',
  'Weight loss',
  'Fat loss',
  'Weight gain',
  'Muscle gain',
  'Hypertrophy',
  'Strength',
  'Power',
  'Endurance',
  'Athletic performance',
  'Body recomposition',
  'Custom',
];
export function ProfileForm({ onClose }: { onClose: () => void }) {
  const { state, setState, notify } = useApp();
  const [p, setP] = useState<Profile>({ ...state.profile });
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP((s) => ({ ...s, [key]: value }));
  const labels = ['About you', 'Your goals', 'Your training', 'Make it yours'];
  function next(e: React.FormEvent) {
    e.preventDefault();
    if (step === 2 && !p.days.length) {
      setError('Choose at least one training day.');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      setError('');
      return;
    }
    setState((s) => ({ ...s, profile: { ...p, onboarded: true } }));
    notify('Profile updated. Your next plan will use these preferences.');
    onClose();
  }
  return (
    <Modal
      title={state.profile.onboarded ? 'Your profile, your way' : 'Let’s build your plan'}
      onClose={onClose}
      wide
    >
      <div className="onboarding-progress">
        <span>STEP {step + 1} OF 4</span>
        <strong>{labels[step]}</strong>
        <Meter value={step + 1} max={4} />
      </div>
      <form onSubmit={next}>
        {step === 0 && (
          <>
            <label className="field">
              What should we call you?
              <input
                required
                maxLength={60}
                value={p.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="given-name"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Age
                <input
                  required
                  type="number"
                  min="18"
                  max="100"
                  value={p.age}
                  onChange={(e) => set('age', Number(e.target.value))}
                />
              </label>
              <label className="field">
                Sex parameter for calorie estimate
                <select value={p.sex} onChange={(e) => set('sex', e.target.value)}>
                  {['Male', 'Female', 'Prefer not to say'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                Height ({state.units === 'lb' ? 'inches' : 'cm'})
                <input
                  required
                  type="number"
                  min={state.units === 'lb' ? 47 : 120}
                  max={state.units === 'lb' ? 91 : 230}
                  step="0.1"
                  value={state.units === 'lb' ? Math.round((p.height / 2.54) * 10) / 10 : p.height}
                  onChange={(e) =>
                    set('height', Number(e.target.value) * (state.units === 'lb' ? 2.54 : 1))
                  }
                />
              </label>
              <label className="field">
                Current weight ({state.units})
                <input
                  required
                  type="number"
                  min={state.units === 'kg' ? 30 : 66}
                  max={state.units === 'kg' ? 350 : 771}
                  step="0.1"
                  value={displayWeight(p.weight, state.units)}
                  onChange={(e) =>
                    set('weight', fromDisplayWeight(Number(e.target.value), state.units))
                  }
                />
              </label>
            </div>
            <p className="footnote">
              Forma’s automated plans and nutrition estimates are intended for adults. Your personal
              information stays private.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <label className="field">
              Your main goal
              <select value={p.goal} onChange={(e) => set('goal', e.target.value)}>
                {goals.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="field">
              In your own words
              <textarea
                maxLength={500}
                value={p.customGoal}
                onChange={(e) => set('customGoal', e.target.value)}
                placeholder="I want to increase my bench strength while losing around 5 kg."
              />
            </label>
            <label className="field">
              Secondary goals
              <input
                maxLength={200}
                value={p.secondaryGoals}
                onChange={(e) => set('secondaryGoals', e.target.value)}
                placeholder="More energy, better endurance…"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Target weight ({state.units})
                <input
                  required
                  type="number"
                  min={state.units === 'kg' ? 30 : 66}
                  max={state.units === 'kg' ? 350 : 771}
                  step="0.1"
                  value={displayWeight(p.targetWeight, state.units)}
                  onChange={(e) =>
                    set('targetWeight', fromDisplayWeight(Number(e.target.value), state.units))
                  }
                />
              </label>
              <label className="field">
                Fitness level
                <select value={p.level} onChange={(e) => set('level', e.target.value)}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Training experience
              <select value={p.experience} onChange={(e) => set('experience', e.target.value)}>
                {[
                  'Just starting',
                  'Less than 6 months',
                  '6–12 months',
                  '1–2 years',
                  '3+ years',
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <label className="field">Preferred training days</label>
            <div className="day-picker">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  type="button"
                  aria-pressed={p.days.includes(d)}
                  className={p.days.includes(d) ? 'selected' : ''}
                  key={d}
                  onClick={() =>
                    set('days', p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d])
                  }
                >
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d]}
                </button>
              ))}
            </div>
            <div className="form-grid">
              <label className="field">
                Time per session
                <select
                  value={p.duration}
                  onChange={(e) => set('duration', Number(e.target.value))}
                >
                  {[20, 30, 40, 50, 60, 75].map((n) => (
                    <option key={n} value={n}>
                      {n} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Exercises per session
                <select
                  value={p.exerciseCount}
                  onChange={(e) => set('exerciseCount', Number(e.target.value))}
                >
                  {[3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} exercises
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Where do you train?
              <select
                value={p.location}
                onChange={(e) => {
                  set('location', e.target.value);
                  if (e.target.value === 'Home')
                    set(
                      'equipment',
                      p.equipment.filter((x) => x === 'Dumbbells' || x === 'Pull-up bar'),
                    );
                }}
              >
                {['Gym', 'Home', 'Both'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">Available equipment</label>
            <div className="chips">
              {['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Pull-up bar'].map((v) => (
                <button
                  type="button"
                  className={`chip ${p.equipment.includes(v) ? 'selected' : ''}`}
                  aria-pressed={p.equipment.includes(v)}
                  key={v}
                  onClick={() =>
                    set(
                      'equipment',
                      p.equipment.includes(v)
                        ? p.equipment.filter((x) => x !== v)
                        : [...p.equipment, v],
                    )
                  }
                >
                  {p.equipment.includes(v) && <Check size={14} />} {v}
                </button>
              ))}
            </div>
            <p className="footnote">
              Bodyweight exercises are always available. Plans use only the equipment you select.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <label className="field">
              Injuries or conditions to keep in mind
              <textarea
                maxLength={400}
                value={p.injuries}
                onChange={(e) => set('injuries', e.target.value)}
                placeholder="Optional. Discuss restrictions with a qualified professional."
              />
            </label>
            <label className="field">
              Movement limitations
              <input
                maxLength={300}
                value={p.limitations}
                onChange={(e) => set('limitations', e.target.value)}
                placeholder="e.g. Limited overhead movement"
              />
            </label>
            <label className="field">
              Exercises to exclude
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !p.excluded.includes(e.target.value))
                    set('excluded', [...p.excluded, e.target.value]);
                }}
              >
                <option value="">Choose an exercise to exclude…</option>
                {exercises
                  .filter((e) => !p.excluded.includes(e.id))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="chips">
              {p.excluded.map((id) => (
                <button
                  type="button"
                  className="chip"
                  key={id}
                  onClick={() =>
                    set(
                      'excluded',
                      p.excluded.filter((x) => x !== id),
                    )
                  }
                >
                  {exercises.find((e) => e.id === id)?.name}
                  <X size={13} />
                </button>
              ))}
            </div>
            <label className="field">
              Exercise preferences
              <input
                maxLength={300}
                value={p.preferences}
                onChange={(e) => set('preferences', e.target.value)}
                placeholder="Favorite exercise names, or ‘no barbell’"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                General activity
                <select
                  value={p.activity}
                  onChange={(e) => set('activity', Number(e.target.value))}
                >
                  <option value={1.2}>Mostly seated</option>
                  <option value={1.375}>Lightly active</option>
                  <option value={1.55}>Moderately active</option>
                  <option value={1.725}>Very active</option>
                </select>
              </label>
              <label className="field">
                Typical sleep (hours)
                <input
                  required
                  type="number"
                  min="1"
                  max="14"
                  step="0.5"
                  value={p.sleep}
                  onChange={(e) => set('sleep', Number(e.target.value))}
                />
              </label>
            </div>
            <p className="footnote">
              Free-text medical restrictions are not automatically interpreted. Explicitly exclude
              movements you have been advised to avoid. The coach can explain your saved goals;
              detailed custom programming still requires a qualified trainer.
            </p>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button
            type="button"
            className="outline"
            onClick={() => (step ? setStep(step - 1) : onClose())}
          >
            {step ? 'Back' : 'Cancel'}
          </button>
          <button className="primary" type="submit">
            {step === 3 ? 'Save my profile' : 'Continue'}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Auth({ onClose }: { onClose: () => void }) {
  const { notify } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'update'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + import.meta.env.BASE_URL,
        });
        if (error) throw error;
        notify('If an account exists, a reset link is on its way.');
        onClose();
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        notify('Password updated.');
        onClose();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
        });
        if (error) throw error;
        notify(
          data.session
            ? 'Account created. Let’s build your profile.'
            : 'Check your email to confirm your account.',
        );
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notify('Welcome back. Loading your account…');
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        mode === 'signup'
          ? 'Your next chapter starts here'
          : mode === 'reset'
            ? 'Reset your password'
            : mode === 'update'
              ? 'Choose a new password'
              : 'Welcome back'
      }
      onClose={onClose}
    >
      {!supabase ? (
        <>
          <div className="notice">
            You’re in demo mode. All tracking features work on this device. Connect Supabase using
            the project’s setup instructions to enable secure accounts and cloud syncing.
          </div>
          <button className="primary full" onClick={onClose}>
            Continue with demo
          </button>
        </>
      ) : (
        <form onSubmit={submit}>
          {mode !== 'update' && (
            <label className="field">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {mode !== 'reset' && (
            <label className="field">
              Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button disabled={busy} className="primary full" type="submit">
            {busy
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : mode === 'update'
                    ? 'Update password'
                    : 'Sign in'}
          </button>
          <div className="button-row">
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError('');
              }}
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setMode('reset');
                setError('');
              }}
            >
              Forgot password?
            </button>
          </div>
          {mode === 'reset' && (
            <button className="text-button" type="button" onClick={() => setMode('update')}>
              Already followed your reset email? Set a new password
            </button>
          )}
          <p className="footnote">
            New accounts start with an empty personal workspace. Demo data is never automatically
            uploaded.
          </p>
        </form>
      )}
    </Modal>
  );
}
export default function Settings() {
  const { state, setState, notify, userId, sync, logout, reset } = useApp();
  const [profile, setProfile] = useState(false);
  const [auth, setAuth] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forma-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Your data export is ready. Keep this personal file private.');
  }
  async function reminders() {
    if (!('Notification' in window)) {
      notify('This browser does not support notifications.');
      return;
    }
    if (state.reminder) {
      setState((s) => ({ ...s, reminder: false }));
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setState((s) => ({ ...s, reminder: true }));
      new Notification('Forma reminders enabled', {
        body: 'Check-in reminders appear while Forma is open. Background scheduling is not connected.',
      });
    } else notify('Notifications are not enabled. You can change this in browser settings.');
  }
  async function deleteData() {
    setBusy(true);
    setError('');
    try {
      if (userId && supabase) {
        const paths = state.photos.filter((p) => !p.path.startsWith('data:')).map((p) => p.path);
        if (paths.length) {
          const { error } = await supabase.storage.from('progress-photos').remove(paths);
          if (error) throw error;
        }
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        await supabase.auth.signOut({ scope: 'local' });
      } else reset();
      setDeleting(false);
      notify(userId ? 'Account and personal data deleted.' : 'Demo data cleared.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deletion failed. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE YOURSELF AT HOME</div>
          <h1>
            Your space, your settings<span className="lime-dot">.</span>
          </h1>
          <p>A training companion that fits the way you live.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="card settings-profile">
          <span className="avatar large">
            {state.profile.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </span>
          <h2>{state.profile.name}</h2>
          <p>{state.profile.goal}</p>
          <span className="demo-badge">{userId ? 'Connected account' : 'Demo workspace'}</span>
          <button className="primary full" onClick={() => setProfile(true)}>
            <User size={16} />
            Edit profile & plan
          </button>
          <p className="footnote">{sync}</p>
        </section>
        <div className="settings-sections">
          <section className="card">
            <h2>
              <SlidersHorizontal size={19} />
              Your preferences
            </h2>
            <label className="setting-row">
              <span>
                <strong>Measurement units</strong>
                <small>Weight and height display</small>
              </span>
              <select
                value={state.units}
                onChange={(e) => setState((s) => ({ ...s, units: e.target.value as 'kg' | 'lb' }))}
              >
                <option value="kg">Metric · kg / cm</option>
                <option value="lb">Imperial · lb / in</option>
              </select>
            </label>
            <label className="setting-row">
              <span>
                <strong>Appearance</strong>
                <small>Find your comfortable light</small>
              </span>
              <select
                value={state.theme}
                onChange={(e) =>
                  setState((s) => ({ ...s, theme: e.target.value as typeof s.theme }))
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">Match device</option>
              </select>
            </label>
            <div className="setting-row">
              <span>
                <strong>Check-in reminders</strong>
                <small>While the app is open · every 60 minutes</small>
              </span>
              <button
                role="switch"
                aria-checked={state.reminder}
                className={`switch ${state.reminder ? 'on' : ''}`}
                onClick={() => void reminders()}
              >
                <span />
              </button>
            </div>
          </section>
          <section className="card">
            <h2>
              <ShieldCheck size={19} />
              Your account & data
            </h2>
            <div className="setting-row">
              <span>
                <strong>{userId ? 'Account connected' : 'Keep your progress with you'}</strong>
                <small>
                  {userId
                    ? 'Your data is private and synced'
                    : 'Sign in to save securely across devices'}
                </small>
              </span>
              <button className="outline" onClick={() => setAuth(true)}>
                {userId ? 'Password help' : 'Sign in'}
              </button>
            </div>
            <div className="setting-row">
              <span>
                <strong>Export your data</strong>
                <small>Download your profile and all activity as JSON</small>
              </span>
              <button className="icon-button" aria-label="Export data" onClick={exportData}>
                <Download size={19} />
              </button>
            </div>
            {userId && (
              <div className="setting-row">
                <span>
                  <strong>Sign out</strong>
                  <small>Return to the separate demo workspace</small>
                </span>
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  onClick={() =>
                    void logout().catch(() => notify('Could not sign out. Please try again.'))
                  }
                >
                  <LogOut size={19} />
                </button>
              </div>
            )}
            <div className="setting-row">
              <span>
                <strong>{userId ? 'Delete account' : 'Clear demo data'}</strong>
                <small>This permanently removes your saved information</small>
              </span>
              <button
                className="text-button danger"
                onClick={() => {
                  setDeleting(true);
                  setConfirm('');
                  setError('');
                }}
              >
                Delete
              </button>
            </div>
          </section>
          <section className="card privacy-note">
            <Moon size={24} />
            <div>
              <h3>A little peace of mind</h3>
              <p>
                Demo data lives in this browser. Account data is protected by per-user access
                policies. Progress photos use private storage. AI requests only happen when you
                choose a connected AI feature.
              </p>
              <p>
                Forma offers educational fitness guidance. Stop activity and seek appropriate care
                for serious pain, severe dizziness, or acute injury.
              </p>
            </div>
          </section>
        </div>
      </div>
      {profile && <ProfileForm onClose={() => setProfile(false)} />}{' '}
      {auth && <Auth onClose={() => setAuth(false)} />}{' '}
      {deleting && (
        <Modal
          title={userId ? 'Delete your account?' : 'Clear demo data?'}
          onClose={() => setDeleting(false)}
        >
          <p>
            This removes your profile, workout history, meals, measurements, and photos. Export
            anything you want to keep first.
          </p>
          <label className="field">
            Type DELETE to confirm
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
            />
          </label>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button
            className="danger-button full"
            disabled={confirm !== 'DELETE' || busy}
            onClick={() => void deleteData()}
          >
            {busy ? 'Deleting…' : 'Permanently delete'}
          </button>
        </Modal>
      )}
    </>
  );
}
