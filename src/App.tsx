import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  ChevronRight,
  Dumbbell,
  House,
  Leaf,
  MessageCircle,
  Settings as SettingsIcon,
  TrendingUp,
  WifiOff,
  Zap,
} from 'lucide-react';
import { Provider } from './lib/Provider';
import { useApp } from './lib/context';
import Home from './components/Home';
import Settings, { ProfileForm } from './components/Settings';
import { Modal } from './components/UI';
import { today } from './lib/engine';
import './App.css';
import { useFitnessTools } from './lib/webmcp';
const Workout = lazy(() => import('./components/Workout'));
const Nutrition = lazy(() => import('./components/Nutrition'));
const Progress = lazy(() => import('./components/Progress'));
const Trainer = lazy(() => import('./components/Trainer'));
const Library = lazy(() => import('./components/ExerciseGuide'));
const nav = [
  { name: 'Home', icon: House },
  { name: 'Workout', icon: Dumbbell },
  { name: 'Nutrition', icon: Leaf },
  { name: 'Progress', icon: TrendingUp },
  { name: 'Trainer', icon: MessageCircle },
] as const;
function Shell() {
  useFitnessTools();
  const { state, setState, page, navigate, userId, loading, sync, notify } = useApp();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [checkin, setCheckin] = useState(false);
  const [profile, setProfile] = useState(false);
  const [recovery, setRecovery] = useState({
    sleep: state.profile.sleep,
    fatigue: 2,
    soreness: 2,
    motivation: 4,
    stress: 2,
  });
  const initials = state.profile.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
  useEffect(() => {
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);
  useEffect(() => {
    if (!state.reminder) return;
    const timer = setInterval(
      () => {
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification('A little check-in from Forma', {
            body: 'How are you feeling? Log your meals, movement, or a recovery check-in.',
          });
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, [state.reminder]);
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('Home');
          }}
        >
          <span className="brand-mark">
            <Activity size={25} />
          </span>
          forma<span className="brand-dot">.</span>
        </a>
        <div className="sidebar-caption">YOUR EVERYDAY ADVANTAGE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={page === name ? 'nav-item active' : 'nav-item'}
              onClick={() => navigate(name)}
              aria-current={page === name ? 'page' : undefined}
            >
              <Icon size={20} />
              {name}
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-separator" />
        <button
          className={`nav-item ${page === 'Library' ? 'active' : ''}`}
          onClick={() => navigate('Library')}
        >
          <BookOpen size={20} />
          Exercise library
        </button>
        <button
          className={`nav-item ${page === 'Settings' ? 'active' : ''}`}
          onClick={() => navigate('Settings')}
        >
          <SettingsIcon size={20} />
          Settings
        </button>
        <div className="sidebar-bottom">
          <div className="coach-mini">
            <Zap size={22} />
            <h3>
              Small steps.
              <br />
              Stronger you.
            </h3>
            <p>Your next chapter starts with today’s session.</p>
          </div>
          <button className="profile-mini" onClick={() => navigate('Settings')}>
            <span className="avatar">{initials}</span>
            <span>
              <strong>{state.profile.name}</strong>
              <small>Personal training plan</small>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              <span className="desktop-brand">My workspace</span>
              <span className="mobile-brand">forma.</span>
            </span>
            <ChevronRight size={14} />
            <strong>{page === 'Home' ? 'Overview' : page}</strong>
          </div>
          <div>
            <span className="demo-badge">
              <span />
              {userId ? 'Personal workspace' : 'Demo workspace'}
            </span>
            <button
              className="icon-button"
              aria-label="Recovery check-in"
              title="Recovery check-in"
              onClick={() => setCheckin(true)}
            >
              <Bell size={19} />
            </button>
            <button
              className="avatar small"
              aria-label="Open profile and settings"
              onClick={() => navigate('Settings')}
            >
              {initials}
            </button>
          </div>
        </header>
        {offline && (
          <div className="status-banner">
            <WifiOff size={15} />
            You’re offline.{' '}
            {userId
              ? 'Cloud syncing resumes when you reconnect. Export changes before closing.'
              : 'Demo changes are saved on this device.'}
          </div>
        )}
        {sync.startsWith('Not synced') ||
        sync.startsWith('Cloud unavailable') ||
        sync.startsWith('Device storage') ? (
          <div className="status-banner error" role="alert">
            {sync}
            <button className="text-button" onClick={() => navigate('Settings')}>
              Open settings
            </button>
          </div>
        ) : null}
        <main>
          {!state.profile.onboarded && !loading && (
            <div className="onboarding-banner">
              <div>
                <strong>Let’s make this yours.</strong>
                <p>A few details help build your personal training plan.</p>
              </div>
              <button className="primary" onClick={() => setProfile(true)}>
                Set up profile
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-state" role="status">
              <span className="brand-mark">
                <Activity size={25} />
              </span>
              <p>Getting your workspace ready…</p>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="loading-state" role="status">
                  Getting things ready…
                </div>
              }
            >
              {page === 'Home' ? (
                <Home />
              ) : page === 'Workout' ? (
                <Workout />
              ) : page === 'Nutrition' ? (
                <Nutrition />
              ) : page === 'Progress' ? (
                <Progress />
              ) : page === 'Trainer' ? (
                <Trainer />
              ) : page === 'Library' ? (
                <Library />
              ) : (
                <Settings />
              )}
            </Suspense>
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {nav.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={page === name ? 'active' : ''}
            aria-current={page === name ? 'page' : undefined}
            onClick={() => navigate(name)}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {profile && <ProfileForm onClose={() => setProfile(false)} />}{' '}
      {checkin && (
        <Modal title="How are you feeling today?" onClose={() => setCheckin(false)}>
          <p className="muted">A quick check-in helps you choose the right effort for today.</p>
          <label className="field">
            Sleep last night (hours)
            <input
              type="number"
              min="0"
              max="14"
              step="0.5"
              value={recovery.sleep}
              onChange={(e) =>
                setRecovery({
                  ...recovery,
                  sleep: Math.min(14, Math.max(0, Number(e.target.value))),
                })
              }
            />
          </label>
          {(['fatigue', 'soreness', 'motivation', 'stress'] as const).map((k) => (
            <label className="field" key={k}>
              {k[0].toUpperCase() + k.slice(1)} · {recovery[k]} / 5
              <input
                type="range"
                min="1"
                max="5"
                value={recovery[k]}
                onChange={(e) => setRecovery({ ...recovery, [k]: Number(e.target.value) })}
              />
              <span className="range-labels">
                <span>Low</span>
                <span>High</span>
              </span>
            </label>
          ))}
          <button
            className="primary full"
            onClick={() => {
              setState((s) => ({
                ...s,
                recovery: [
                  ...s.recovery.filter((r) => r.date !== today()),
                  { ...recovery, date: today() },
                ],
              }));
              setCheckin(false);
              notify('Recovery check-in saved. Your next session will consider your energy.');
            }}
          >
            Save check-in
          </button>
          <p className="footnote">Recovery scores guide effort, not medical diagnoses.</p>
        </Modal>
      )}
    </div>
  );
}
export default function App() {
  return (
    <Provider>
      <Shell />
    </Provider>
  );
}
