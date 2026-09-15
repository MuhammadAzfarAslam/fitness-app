import { compatibleExercise, roleGroups } from './coverage';
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
      compatibleExercise(e, profile) &&
      (focus === 'Full body'
        ? e.muscle !== 'Cardio'
        : focus === 'Upper body'
          ? ['Chest', 'Back', 'Shoulders', 'Arms'].includes(e.muscle)
          : e.muscle === focus),
  );
  const ranked = [...candidates].sort((a, b) => {
    const score = (e: typeof a) =>
      (profile.preferences.toLowerCase().includes(e.name.toLowerCase()) ? -10 : 0) +
      (!e.compound ? 2 : 0) +
      (/strength|power/i.test(profile.goal) && e.equipment === 'Barbell' ? -2 : 0);
    return score(a) - score(b);
  });
  const count = Math.max(1, Math.min(12, Math.floor(profile.exerciseCount) || 5));
  const chosen: typeof exercises = [];
  // Larger mixed sessions prioritize movement families, then show regional gaps explicitly.
  const groups =
    focus === 'Full body'
      ? [
          roleGroups.Legs['Quads / knee dominant'],
          roleGroups.Chest['General / middle chest'],
          roleGroups.Back['Horizontal pull / upper back'],
          roleGroups.Legs.Hamstrings,
          roleGroups.Core['Trunk stability'],
          roleGroups.Back['Vertical pull / lats'],
          roleGroups.Shoulders['Side delts'],
        ]
      : focus === 'Upper body'
        ? [
            roleGroups.Chest['General / middle chest'],
            roleGroups.Back['Horizontal pull / upper back'],
            roleGroups.Back['Vertical pull / lats'],
            roleGroups.Shoulders['Side delts'],
            roleGroups.Chest['Upper chest emphasis'],
            roleGroups.Arms['Biceps / elbow flexion'],
            roleGroups.Arms['Triceps / elbow extension'],
          ]
        : Object.values(roleGroups[focus] ?? {});
  for (const ids of groups) {
    if (chosen.length >= count) break;
    if (chosen.some((e) => ids.includes(e.id))) continue;
    const e = ranked.find((e) => ids.includes(e.id) && !chosen.includes(e));
    if (e) chosen.push(e);
  }
  for (const e of ranked) {
    if (chosen.length >= count) break;
    if (!chosen.includes(e)) chosen.push(e);
  }
  const warnings = [];
  if (chosen.length < count)
    warnings.push(
      `Only ${chosen.length} matching exercises are available with your current profile. Forma will not add duplicates or unrelated exercises to reach ${count}.`,
    );
  if (focus === 'Chest' && count >= 5)
    warnings.push(
      'Five chest exercises overlap substantially. Consider fewer movements or rotating alternatives; more exercises do not automatically mean better results.',
    );
  if (count * 6 + 5 > profile.duration)
    warnings.push(
      'This selection may exceed your preferred session time. Review sets and rest periods.',
    );
  return {
    exerciseIds: chosen.map((e) => e.id),
    requested: count,
    explanation: `${focus} focus · ${profile.goal} · ${profile.level} · ${count} requested exercises. Forma prioritizes complementary roles before adding additional choices, respecting your equipment, exclusions and preferences. Coverage shows emphasis, not isolated muscles or a guarantee of results.`,
    warning: warnings.join(' '),
  };
}
