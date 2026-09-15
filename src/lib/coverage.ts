import { exercises, exerciseById } from '../data/exercises';
import type { Exercise, Profile } from './types';

// Programming roles describe emphasis, not isolated anatomy or guaranteed growth.
export const roleGroups: Record<string, Record<string, string[]>> = {
  Chest: {
    'Upper chest emphasis': ['incline', 'incline-barbell'],
    'General / middle chest': [
      'bench',
      'db-bench',
      'machine-press',
      'db-press',
      'pushup',
      'incline-pushup',
      'knee-pushup',
    ],
    'Lower-angle emphasis': ['high-low-fly', 'decline-db'],
    'Fly / arm adduction': ['fly', 'pec-deck', 'db-fly', 'high-low-fly'],
  },
  Legs: {
    'Quads / knee dominant': ['squat', 'goblet', 'body-squat', 'legpress', 'lunge', 'extension'],
    Hamstrings: ['rdl', 'db-rdl', 'legcurl'],
    'Glutes / hip extension': ['rdl', 'db-rdl', 'bridge', 'lunge', 'squat', 'goblet', 'legpress'],
    Calves: ['calf'],
    'Single-leg control': ['lunge'],
  },
  Back: {
    'Vertical pull / lats': ['pullup', 'pulldown'],
    'Horizontal pull / upper back': ['row', 'db-row', 'cable-row'],
  },
  Shoulders: {
    'Front / overhead press': ['ohp', 'bar-ohp'],
    'Side delts': ['lateral'],
    'Rear delts': ['rear-fly'],
  },
  Arms: {
    'Biceps / elbow flexion': ['curl', 'bar-curl'],
    'Triceps / elbow extension': ['triceps', 'skull'],
  },
  Cardio: { 'Aerobic activity': ['walking', 'running', 'cycling', 'rowing', 'stair-climber'] },
  Core: {
    'Trunk stability': ['plank', 'deadbug'],
    'Controlled trunk flexion': ['hanging', 'crunch'],
  },
};
export function exerciseRoles(id: string) {
  const e = exerciseById(id);
  return Object.entries(roleGroups[e.muscle] ?? {})
    .filter(([, ids]) => ids.includes(id))
    .map(([label]) => label);
}
export function compatibleExercise(e: Exercise, p: Profile) {
  return (
    !p.excluded.includes(e.id) &&
    (e.equipment === 'Bodyweight' || p.equipment.includes(e.equipment)) &&
    (p.level.toLowerCase() !== 'beginner' || e.difficulty !== 'Advanced') &&
    (!p.preferences.toLowerCase().includes('no barbell') || e.equipment !== 'Barbell')
  );
}
export function sessionCoverage(ids: string[], focus?: string) {
  const muscles =
    focus === 'Upper body'
      ? ['Chest', 'Back', 'Shoulders', 'Arms']
      : focus === 'Full body'
        ? ['Chest', 'Back', 'Legs', 'Core']
        : focus
          ? [focus]
          : [...new Set(ids.map((id) => exerciseById(id).muscle))];
  return muscles.flatMap((muscle) =>
    Object.entries(roleGroups[muscle] ?? {}).map(([label, matches]) => ({
      muscle,
      label,
      covered: ids.some((id) => matches.includes(id)),
    })),
  );
}
export function alternativesFor(id: string, p: Profile, selected: string[]) {
  const source = exerciseById(id);
  const roles = exerciseRoles(id);
  return exercises
    .filter(
      (e) =>
        e.id !== id &&
        e.muscle === source.muscle &&
        e.unit === source.unit &&
        !selected.includes(e.id) &&
        compatibleExercise(e, p),
    )
    .map((exercise) => {
      const nextRoles = exerciseRoles(exercise.id);
      const sameEmphasis = roles.length > 0 && roles.every((r) => nextRoles.includes(r));
      return {
        exercise,
        sameEmphasis,
        reason: sameEmphasis
          ? `Keeps ${roles.join(' + ').toLowerCase()}.`
          : `Different emphasis: ${nextRoles.join(' + ') || exercise.pattern}. Review the coverage after swapping.`,
      };
    })
    .sort(
      (a, b) =>
        Number(b.sameEmphasis) - Number(a.sameEmphasis) ||
        Number(b.exercise.pattern === source.pattern) -
          Number(a.exercise.pattern === source.pattern),
    );
}
