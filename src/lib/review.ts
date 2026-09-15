import { generatePlan, today } from './engine';
import { exerciseById } from '../data/exercises';
import type { AppState, Plan, Profile, Recovery } from './types';
export const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export function readiness(r?: Recovery) {
  if (!r) return { level: 'unknown', reasons: ['No current readiness check.'] };
  if (!r.pain)
    return {
      level: 'unknown',
      reasons: ['Answer the pain and symptoms question before choosing your effort.'],
    };
  if (r.pain === 'urgent')
    return {
      level: 'stop',
      reasons: [
        'Stop exercising. Chest pain, severe dizziness, fainting or unusual breathlessness need urgent medical evaluation. Contact local emergency services for severe or ongoing symptoms.',
      ],
    };
  if (r.pain === 'movement')
    return {
      level: 'stop',
      reasons: [
        'Do not train through new or worsening pain. Pause the session and seek appropriate professional assessment before choosing painful movements.',
      ],
    };
  const reasons = [];
  if (r.sleep < 6) reasons.push(`You reported ${r.sleep} hours of sleep.`);
  if (r.fatigue >= 4) reasons.push('Fatigue is high.');
  if (r.soreness >= 4) reasons.push('Muscle soreness is high.');
  if (r.stress >= 4) reasons.push('Stress is high.');
  return {
    level: reasons.length ? 'easy' : 'usual',
    reasons: reasons.length
      ? reasons
      : ['No high-fatigue flags in this check-in. This is not medical clearance.'],
  };
}
export function easierPlan(plan: Plan): Plan {
  return {
    ...plan,
    name: plan.name + ' · Reduced effort',
    lighter: true,
    exercises: plan.exercises.map((e) => ({
      ...e,
      sets: Math.max(1, e.sets - 1),
      weight: Math.round(e.weight * 0.9 * 2) / 2,
      rpe: 6,
    })),
  };
}
export function weeklyReview(state: AppState, date = today()) {
  const days = [...new Set(state.profile.days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const plans = days.map((day) => ({
    day,
    plan: generatePlan(state.profile, state.workouts, { day }),
  }));
  const groups = (plan: Plan) =>
    new Set(plan.exercises.map((e) => exerciseById(e.exerciseId).muscle));
  const sets: Record<string, number> = {};
  for (const { plan } of plans)
    for (const e of plan.exercises) {
      const m = exerciseById(e.exerciseId).muscle;
      if (m !== 'Cardio') sets[m] = (sets[m] ?? 0) + e.sets;
    }
  const end = new Date(date + 'T12:00:00');
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const recent = state.workouts.filter((w) => w.date >= startDate && w.date < date);
  const completedDays = new Set(
    recent.filter((w) => w.exercises.some((e) => e.sets.some((s) => s.done))).map((w) => w.date),
  ).size;
  const loggedSets = recent.flatMap((w) =>
    w.exercises.flatMap((e) => e.sets.filter((s) => s.done)),
  );
  const avgRpe = loggedSets.length
    ? loggedSets.reduce((n, s) => n + s.rpe, 0) / loggedSets.length
    : null;
  const findings: string[] = [];
  let move: { from: number; to: number } | undefined;
  for (const current of plans) {
    const next = plans.find((p) => p.day === (current.day + 1) % 7);
    if (!next) continue;
    const shared = [...groups(current.plan)].filter(
      (g) => g !== 'Core' && g !== 'Cardio' && groups(next.plan).has(g),
    );
    if (shared.length) {
      findings.push(
        `${dayNames[current.day]} and ${dayNames[next.day]} both emphasize ${shared.join(', ')} on consecutive days. Consider more recovery spacing if effort or soreness is high.`,
      );
      if (!move) {
        const target = [1, 2, 3, 4, 5, 6, 0].find(
          (d) =>
            !days.includes(d) &&
            plans.every((p) => {
              if (p.day === next.day) return true;
              const adjacent = (p.day + 1) % 7 === d || (d + 1) % 7 === p.day;
              return (
                !adjacent ||
                ![...groups(next.plan)].some(
                  (g) => g !== 'Core' && g !== 'Cardio' && groups(p.plan).has(g),
                )
              );
            }),
        );
        if (target !== undefined) move = { from: next.day, to: target };
      }
    }
  }
  if (!/cardio|endurance/i.test(state.profile.goal)) {
    const missing = ['Legs', 'Chest', 'Back'].filter((g) => !sets[g]);
    if (missing.length)
      findings.push(
        `Your current week has no primary ${missing.join(', ')} exercises. Review whole-body balance unless this is an intentional specialist plan.`,
      );
  }
  for (const [group, count] of Object.entries(sets))
    if (count > 18)
      findings.push(
        `${group}: ${count} planned primary-muscle sets this week. This app flags more than 18 for review, not as a universal limit. Reduce volume if recovery or performance is deteriorating.`,
      );
  for (const { day, plan } of plans) {
    const minutes = Math.round(
      8 +
        plan.exercises.reduce(
          (n, e) =>
            n +
            e.sets *
              (exerciseById(e.exerciseId).unit === 'minutes'
                ? e.reps
                : exerciseById(e.exerciseId).unit === 'seconds'
                  ? e.reps / 60
                  : 0.75) +
            (Math.max(0, e.sets - 1) * e.rest) / 60 +
            1,
          0,
        ),
    );
    if (minutes > state.profile.duration + 10)
      findings.push(
        `${dayNames[day]} may take about ${minutes} minutes including rests and warm-up, versus your ${state.profile.duration}-minute preference. Timing is approximate.`,
      );
  }
  if (recent.length < 2)
    findings.push(
      'Fewer than two logged sessions in the last seven complete days. There is not enough recent evidence to recommend increasing training.',
    );
  else {
    findings.push(
      `${completedDays} days with completed sets in the last seven complete days, compared with ${days.length} training days in your current schedule. Schedule changes and unlogged training can affect this comparison.`,
    );
    if (avgRpe !== null && avgRpe >= 9)
      findings.push(
        `Your ${loggedSets.length} completed sets averaged RPE ${avgRpe.toFixed(1)}. Consider an easier session before adding load.`,
      );
  }
  const measurements = state.measurements
    .filter((m) => m.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (measurements.length >= 2) {
    const a = measurements.at(-2)!,
      b = measurements.at(-1)!;
    findings.push(
      `Last two weight entries: ${a.weight} to ${b.weight} kg (${a.date} to ${b.date}). Two readings cannot distinguish muscle, fat or water changes; no diet adjustment is made from this alone.`,
    );
  }
  if (state.profile.injuries || state.profile.limitations)
    findings.unshift(
      'Your profile lists an injury or limitation. This review cannot assess it; confirm suitable exercise choices with a qualified professional.',
    );
  const check = state.recovery.find((r) => r.date === date);
  if (check) findings.unshift(...readiness(check).reasons);
  if (!findings.length)
    findings.push(
      'No flags from these basic checks. This does not certify the plan or predict results.',
    );
  return { date, startDate, completedDays, avgRpe, sets, findings, move };
}
export function applyReviewMove(state: AppState, from: number, to: number): Profile {
  const offered = weeklyReview(state).move;
  if (!offered || offered.from !== from || offered.to !== to)
    throw Error('The plan has changed. Review the updated suggestion before applying it.');
  const weeklyPlan = { ...state.profile.weeklyPlan };
  for (const day of state.profile.days) {
    const p = generatePlan(state.profile, state.workouts, { day });
    weeklyPlan[day] = {
      ...weeklyPlan[day],
      name: p.name,
      exerciseIds: p.exercises.map((e) => e.exerciseId),
    };
  }
  weeklyPlan[to] = weeklyPlan[from];
  delete weeklyPlan[from];
  return {
    ...state.profile,
    days: state.profile.days
      .map((d) => (d === from ? to : d))
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)),
    weeklyPlan,
  };
}
export function reviewText(state: AppState) {
  const r = weeklyReview(state);
  return `Weekly review (${r.startDate} to ${r.date}, today excluded from log totals):\n${r.findings.map((f) => '• ' + f).join('\n')}\n${r.move ? `Suggested option: move ${dayNames[r.move.from]} to ${dayNames[r.move.to]}. Review and accept it in the Weekly review card.` : 'Review exercise choices in Workout → Edit weekly plan.'}\nThese are transparent rules-based checks, not a diagnosis or guaranteed outcome.`;
}
