import {
  ArrowRight,
  ArrowUpRight,
  Dumbbell,
  Flame,
  Leaf,
  Plus,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useApp, displayWeight } from '../lib/context';
import { generatePlan, nutritionTargets, today } from '../lib/engine';
import { Ring, Meter, SectionTitle } from './UI';
export default function Home() {
  const { state, navigate } = useApp();
  const plan = state.active?.plan ?? generatePlan(state.profile, state.workouts);
  const target = nutritionTargets(state.profile);
  const meals = state.meals.filter((m) => m.date === today());
  const sum = (k: 'calories' | 'protein' | 'carbs' | 'fat') =>
    meals.reduce((a, m) => a + m[k] * m.quantity, 0);
  const calories = sum('calories'),
    protein = sum('protein'),
    carbs = sum('carbs'),
    fat = sum('fat');
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const date = d.toLocaleDateString('en-CA');
    return {
      date,
      label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
      day: d.getDate(),
      done: state.workouts.some((w) => w.date === date),
      planned: state.profile.days.includes(d.getDay()),
    };
  });
  const weekCount = state.workouts.filter(
    (w) => w.date >= week[0].date && w.date <= week[6].date,
  ).length;
  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const end = new Date(monday);
    end.setDate(end.getDate() - i * 7 + 6);
    const start = new Date(monday);
    start.setDate(start.getDate() - i * 7);
    if (
      state.workouts.some(
        (w) =>
          w.date >= start.toLocaleDateString('en-CA') && w.date <= end.toLocaleDateString('en-CA'),
      )
    )
      streak++;
    else if (i > 0) break;
  }
  const last = state.measurements.at(-1);
  const previous = state.measurements.at(-2);
  const weightChange =
    last && previous
      ? `${displayWeight(last.weight - previous.weight, state.units) > 0 ? '+' : ''}${displayWeight(last.weight - previous.weight, state.units)} ${state.units} since last check-in`
      : 'Your next check-in starts here';
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">LET’S MAKE TODAY COUNT</div>
          <h1>
            You’ve got this, {state.profile.name.split(' ')[0]}
            <span className="lime-dot">.</span>
          </h1>
          <p>A little stronger. A little healthier. One day at a time.</p>
        </div>
        <div className="date-chip">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="today-card">
          <div className="hero-top">
            <span className="pill">
              <span />
              YOUR NEXT SESSION
            </span>
            <span className="hero-number">
              {String(weekCount + 1).padStart(2, '0')} /{' '}
              {String(state.profile.days.length).padStart(2, '0')}
            </span>
          </div>
          <h2>
            {plan.name.split(' · ')[0]}
            <br />
            <span>Stronger by design.</span>
          </h2>
          <p>
            A balanced session built around your goals.
            <br />
            Show up. We’ll take it from here.
          </p>
          <div className="hero-details">
            <span>
              <Dumbbell size={16} />
              {plan.exercises.length} exercises
            </span>
            <span>◷ {plan.duration} min</span>
            <span>↗ {state.profile.level}</span>
          </div>
          <button className="primary" onClick={() => navigate('Workout')}>
            {state.active ? 'Resume workout' : 'Start workout'}
            <ArrowRight size={19} />
          </button>
          <div className="hero-orbit" aria-hidden="true">
            <div />
            <div />
            <span>
              <Dumbbell size={65} strokeWidth={1.2} />
            </span>
          </div>
        </section>
        <section className="card weekly-card">
          <SectionTitle title="Your week" action="View plan" onClick={() => navigate('Workout')} />
          <div className="weekly-summary">
            <div>
              <strong>
                {weekCount}
                <span>/ {state.profile.days.length}</span>
              </strong>
              <p>workouts completed</p>
            </div>
            <span className="icon-tile pale">
              <Flame size={24} />
            </span>
          </div>
          <div className="week-days">
            {week.map((d) => (
              <div key={d.date}>
                <span>{d.label}</span>
                <button
                  aria-label={d.date}
                  className={`day ${d.done ? 'done' : d.date === today() ? 'today' : d.planned ? 'planned' : ''}`}
                  onClick={() => navigate('Workout')}
                >
                  {d.done ? '✓' : d.date === today() ? <Dumbbell size={16} /> : d.day}
                </button>
              </div>
            ))}
          </div>
          <div className="mini-callout">
            <span className="tiny-dot" />
            Consistency is your superpower. Keep going.
          </div>
        </section>
      </div>
      <div className="stats-grid">
        {[
          {
            label: 'Current weight',
            value: String(displayWeight(state.profile.weight, state.units)),
            unit: state.units,
            icon: TrendingUp,
            sub: weightChange,
            color: 'green',
          },
          {
            label: 'Daily calories',
            value: calories.toLocaleString(),
            unit: `/ ${target.calories.toLocaleString()}`,
            icon: Flame,
            sub: 'Fuel your progress',
            color: 'orange',
          },
          {
            label: 'Protein intake',
            value: String(protein),
            unit: `/ ${target.protein} g`,
            icon: Leaf,
            sub: 'Building blocks for a stronger you',
            color: 'purple',
          },
          {
            label: 'Training streak',
            value: String(streak),
            unit: 'weeks',
            icon: Zap,
            sub: 'Your momentum is building',
            color: 'green',
          },
        ].map((s) => (
          <section className="card stat-card" key={s.label}>
            <div className="stat-label">
              {s.label}
              <s.icon size={19} />
            </div>
            <div className="stat-value">
              {s.value}
              <span>{s.unit}</span>
            </div>
            <div className={`stat-sub ${s.color}`}>{s.sub}</div>
          </section>
        ))}
      </div>
      <div className="lower-grid">
        <section className="card">
          <SectionTitle
            title="Fuel your day"
            action="Nutrition"
            onClick={() => navigate('Nutrition')}
          />
          <div className="nutrition-overview">
            <Ring value={calories} max={target.calories}>
              <Flame size={20} />
              <strong>{calories.toLocaleString()}</strong>
              <small>kcal consumed</small>
            </Ring>
            <div className="macro-list">
              {[
                ['Protein', protein, target.protein, 'var(--purple)'],
                ['Carbs', carbs, target.carbs, 'var(--orange)'],
                ['Fat', fat, target.fat, 'var(--green)'],
              ].map(([n, v, m, c]) => (
                <div key={n}>
                  <div className="macro-label">
                    <span>{n}</span>
                    <strong>
                      {v}
                      <small> / {m} g</small>
                    </strong>
                  </div>
                  <Meter value={Number(v)} max={Number(m)} color={String(c)} />
                </div>
              ))}
            </div>
          </div>
          <button className="outline full" onClick={() => navigate('Nutrition')}>
            <Plus size={17} />
            Log a meal
          </button>
        </section>
        <section className="card coach-card">
          <div className="coach-title">
            <span className="icon-tile">
              <Zap size={24} />
            </span>
            <div>
              <h2>A coach in your corner</h2>
              <span className="subtle">PERSONALIZED. ALWAYS WITH YOU.</span>
            </div>
          </div>
          <p>
            “You’re building a great rhythm. Focus on controlled reps today — quality is what makes
            you stronger.”
          </p>
          <button className="outline" onClick={() => navigate('Trainer')}>
            Let’s talk training
            <ArrowUpRight size={17} />
          </button>
          <span className="coach-label">
            <span className="tiny-dot" />
            Forma coach
          </span>
        </section>
      </div>
      <section className="achievement">
        <span className="icon-tile">
          <Target size={22} />
        </span>
        <div>
          <strong>Progress worth showing up for</strong>
          <p>
            {state.workouts.length
              ? `You’ve logged ${state.workouts.length} sessions. Every completed workout is an investment in you.`
              : 'Your first session is the start of something good. Let’s build from here.'}
          </p>
        </div>
        <button className="text-button" onClick={() => navigate('Progress')}>
          See your progress
          <ArrowRight size={17} />
        </button>
      </section>
      <footer>
        BUILT AROUND YOU. ONE REP AT A TIME.<span>FORMA © {new Date().getFullYear()}</span>
      </footer>
    </>
  );
}
