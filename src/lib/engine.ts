import { exercises, exerciseById } from '../data/exercises';
import type { AppState, Plan, PlanExercise, Profile, WorkoutLog } from './types';
export const today = () => new Date().toLocaleDateString('en-CA');
export const dateBefore = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('en-CA');
};
export const uid = () => crypto.randomUUID();
export const volume = (w: WorkoutLog) =>
  w.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.done).reduce((a, s) => a + s.weight * s.reps, 0),
    0,
  );
export const estimatedMax = (weight: number, reps: number) =>
  reps === 1 ? weight : weight * (1 + Math.min(reps, 12) / 30);
export function progression(id: string, history: WorkoutLog[], reps: number) {
  const recent = [...history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((w) => w.exercises.filter((e) => e.exerciseId === id))
    .filter((e) => e.sets.some((s) => s.done))
    .slice(0, 2);
  const last = recent[0]?.sets.filter((s) => s.done);
  const load = last?.length ? Math.max(...last.map((s) => s.weight)) : 0;
  if (!last?.length)
    return {
      weight: 0,
      reason: 'Find a comfortable starting load with 2–3 good reps left in reserve.',
    };
  if (last.some((s) => s.rpe >= 9.5 || s.reps < reps - 2))
    return {
      weight: Math.round(load * 0.95 * 2) / 2,
      reason:
        'A slightly lighter load after your last challenging session. Prioritize controlled reps.',
    };
  if (
    recent.length === 2 &&
    recent.every(
      (e) => e.sets.length >= 2 && e.sets.every((s) => s.done && s.reps >= reps && s.rpe <= 8),
    )
  )
    return {
      weight: Math.floor((load * 1.025 + Number.EPSILON * load) * 2) / 2,
      reason:
        'You reached your rep target in two sessions. Try a small 2.5% increase if your available weights allow it.',
    };
  return {
    weight: load,
    reason: 'Keep your last load and build consistent reps before increasing weight.',
  };
}
export function generatePlan(
  profile: Profile,
  history: WorkoutLog[],
  options: { duration?: number; lighter?: boolean; day?: number } = {},
): Plan {
  const duration = options.duration ?? profile.duration;
  const lighter = !!options.lighter;
  const day = options.day ?? new Date().getDay();
  const split = profile.days.length >= 4;
  const index = Math.max(0, profile.days.indexOf(day));
  const cardio = /cardio|endurance/i.test(profile.goal);
  const lower = split && index % 2 === 1;
  const name = cardio
    ? 'Build your engine'
    : split
      ? lower
        ? 'Lower body · Build'
        : 'Upper body · Build'
      : 'Full body · Foundation';
  const strength = /strength|power/i.test(profile.goal);
  const reps = strength ? 6 : /endurance/i.test(profile.goal) ? 15 : 10;
  const patterns = cardio
    ? ['Cardio', 'Core', 'Hinge']
    : lower
      ? ['Squat', 'Hinge', 'Squat', 'Calf', 'Core']
      : split
        ? ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Core']
        : ['Squat', 'Push', 'Pull', 'Hinge', 'Core', 'Cardio'];
  const allowed = exercises.filter(
    (e) =>
      (e.equipment === 'Bodyweight' || profile.equipment.includes(e.equipment)) &&
      !profile.excluded.includes(e.id) &&
      (profile.level !== 'Beginner' || e.difficulty !== 'Advanced') &&
      (!profile.preferences.toLowerCase().includes('no barbell') || e.equipment !== 'Barbell'),
  );
  const selected: PlanExercise[] = [];
  const max = Math.min(
    profile.exerciseCount,
    Math.max(2, Math.floor((duration - 5) / 6)),
    patterns.length,
  );
  for (const pattern of patterns) {
    if (selected.length >= max) break;
    const candidates = allowed.filter(
      (e) => e.pattern === pattern && !selected.some((s) => s.exerciseId === e.id),
    );
    const e = candidates.sort((a, b) => {
      const prefer = (x: typeof a) =>
        profile.preferences.toLowerCase().includes(x.name.toLowerCase()) ? -2 : 0;
      return prefer(a) - prefer(b);
    })[0];
    if (!e) continue;
    const target =
      e.unit === 'minutes' ? Math.max(8, duration - 15) : e.unit === 'seconds' ? 30 : reps;
    const p = progression(e.id, history, target);
    selected.push({
      exerciseId: e.id,
      sets: e.unit ? 1 : lighter || profile.level === 'Beginner' || profile.age >= 65 ? 2 : 3,
      reps: target,
      rest: strength ? 150 : 90,
      weight: lighter ? Math.round(p.weight * 0.9 * 2) / 2 : p.weight,
      rpe: lighter ? 6 : 8,
      reason: p.reason,
    });
  }
  return {
    name: lighter ? name + ' · Easy' : name,
    subtitle: `${profile.goal} · ${profile.level.toLowerCase()} · ${profile.location.toLowerCase()}`,
    exercises: selected,
    duration,
    lighter,
  };
}
export function nutritionTargets(p: Profile) {
  const bmr =
    10 * p.weight +
    6.25 * p.height -
    5 * p.age +
    (p.sex === 'Male' ? 5 : p.sex === 'Female' ? -161 : -78);
  const maintenance = Math.round(bmr * p.activity);
  const adjustment = /loss/i.test(p.goal) ? -250 : /gain|hypertrophy/i.test(p.goal) ? 200 : 0;
  const calories = Math.max(1500, maintenance + adjustment);
  const protein = Math.round(p.weight * 1.6);
  const fat = Math.round((calories * 0.28) / 9);
  return {
    bmr: Math.round(bmr),
    maintenance,
    calories,
    protein,
    fat,
    carbs: Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)),
    bmi: p.weight / (p.height / 100) ** 2,
  };
}
export function coachReply(question: string, state: AppState): string {
  const q = question.toLowerCase();
  const p = state.profile;
  if (/chest pain|severe dizziness|faint|acute injury|can't breathe|cannot breathe/.test(q))
    return 'Stop exercising now. Chest pain, severe dizziness, fainting, or difficulty breathing need urgent medical evaluation. Contact your local emergency service if symptoms are severe or ongoing. I cannot diagnose these symptoms.';
  if (/pain|injur|hurt/.test(q))
    return 'Stop any movement that causes pain. Do not train through it or test heavier loads. A qualified clinician can assess your symptoms and help you choose appropriate movements. You can exclude the exercise in your profile so it stays out of future plans.';
  if (/30|short|time/.test(q))
    return 'Use “Adjust session” in Workout and select 30 minutes. Your plan keeps the main movement patterns and reduces accessory work. Keep your warm-up and normal rest periods; do not rush difficult sets.';
  if (/fatigue|tired|sleep|recover|sore/.test(q))
    return `You reported ${state.recovery.at(-1)?.sleep ?? p.sleep} hours of sleep. If you feel unusually fatigued, choose an easier session: reduce working sets and use a comfortable load around RPE 6. A rest day is also a valid choice. Persistent or unusual symptoms deserve professional assessment.`;
  if (/protein|calori|diet|nutrition/.test(q)) {
    const target = nutritionTargets(p);
    const food = state.meals.filter((m) => m.date === today());
    const protein = food.reduce((s, m) => s + m.protein * m.quantity, 0);
    return `Your estimated daily starting point is ${target.calories.toLocaleString()} kcal and ${target.protein} g protein, based on your profile and ${p.goal.toLowerCase()} goal. You have logged ${Math.round(protein)} g protein today. Spread protein across meals and review your weight trend over several weeks before adjusting. These are estimates, not a medical prescription.`;
  }
  if (/increase|progress|bench|strong|weight/.test(q)) {
    const e =
      exercises.find((e) => q.includes(e.name.toLowerCase().split(' ').at(-1)!)) ??
      exerciseById('bench');
    const r = progression(e.id, state.workouts, 10);
    return `${e.name}: ${r.reason}${r.weight ? ` Your suggested next load is ${r.weight} kg.` : ''} Only increase if your technique stays controlled and the movement is pain-free. Use your set logs and RPE to guide the next session.`;
  }
  if (/alternative|replace|equipment|leg press/.test(q))
    return 'Open the exercise in Workout and choose “Replace exercise”. Alternatives are filtered to your available equipment and similar movement patterns. For leg press, a goblet squat or bodyweight squat can work if it is comfortable. Pain is a reason to stop and seek individual guidance, not simply swap blindly.';
  if (/form|technique|how/.test(q))
    return 'Open the Exercise Library and select a movement for setup, step-by-step technique, breathing, common mistakes, and alternatives. Start with a load you can control. Your stance and range of motion should fit your anatomy and stay pain-free.';
  const plan = generatePlan(p, state.workouts);
  return `${p.name.split(' ')[0]}, your next session is ${plan.name}: ${plan.exercises.length} exercises in about ${plan.duration} minutes, supporting your ${p.goal.toLowerCase()} goal. Start with 5 minutes of easy movement and light practice sets. Aim to finish working sets with 2–3 reps left. ${p.customGoal ? `Your personal focus: ${p.customGoal}.` : ''} I can help with progression, substitutions, recovery, or nutrition.`;
}
