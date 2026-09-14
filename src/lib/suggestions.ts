import { exercises } from '../data/exercises';
import type { Profile } from './types';
export const trainingFocuses = [
  'Legs',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Upper body',
  'Full body',
  'Cardio',
] as const;
export type TrainingFocus = (typeof trainingFocuses)[number];
export function suggestExercises(profile: Profile, focus: TrainingFocus) {
  const candidates = exercises.filter(
    (e) =>
      (focus === 'Full body' || focus === 'Upper body'
        ? focus === 'Full body' || ['Chest', 'Back', 'Shoulders', 'Arms'].includes(e.muscle)
        : e.muscle === (focus === 'Cardio' ? 'Cardio' : focus)) &&
      !profile.excluded.includes(e.id) &&
      (e.equipment === 'Bodyweight' || profile.equipment.includes(e.equipment)) &&
      (profile.level !== 'Beginner' || e.difficulty !== 'Advanced') &&
      (!profile.preferences.toLowerCase().includes('no barbell') || e.equipment !== 'Barbell'),
  );
  const slots =
    focus === 'Legs'
      ? ['Squat', 'Hinge', 'single-leg', 'Calf', 'isolation']
      : focus === 'Upper body'
        ? ['Push', 'Pull', 'Push', 'Pull', 'isolation']
        : focus === 'Full body'
          ? ['Squat', 'Push', 'Pull', 'Hinge', 'Core']
          : [];
  const chosen: typeof exercises = [];
  const ranked = [...candidates].sort((a, b) => {
    const score = (e: typeof a) =>
      (profile.preferences.toLowerCase().includes(e.name.toLowerCase()) ? -10 : 0) +
      (!e.compound ? 2 : 0) +
      (/strength|power/i.test(profile.goal) && e.equipment === 'Barbell' ? -2 : 0);
    return score(a) - score(b);
  });
  const count = Math.max(1, Math.min(12, Math.floor(profile.exerciseCount) || 5));
  for (const slot of slots) {
    if (chosen.length >= count) break;
    const e = ranked.find(
      (e) =>
        !chosen.includes(e) &&
        (slot === 'single-leg'
          ? e.id === 'lunge'
          : slot === 'isolation'
            ? !e.compound
            : e.pattern === slot),
    );
    if (e) chosen.push(e);
  }
  for (const e of ranked) {
    if (chosen.length >= count) break;
    if (!chosen.includes(e)) chosen.push(e);
  }
  return {
    exerciseIds: chosen.map((e) => e.id),
    requested: count,
    explanation: `${focus} focus · ${profile.goal} · ${profile.level} · ${count} requested exercises. Choices respect your equipment, exclusions and preferences.`,
    warning:
      chosen.length < count
        ? `Only ${chosen.length} matching exercises are available with your current profile. Forma will not add duplicates or unrelated exercises to reach ${count}.`
        : count * 6 + 5 > profile.duration
          ? 'This many exercises may take longer than your preferred session time. Allow more time or remove an exercise.'
          : '',
  };
}
