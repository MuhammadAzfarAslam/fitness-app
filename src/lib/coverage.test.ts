import { describe, expect, it } from 'vitest';
import { exercises } from '../data/exercises';
import { seedState } from '../data/seed';
import { alternativesFor, roleGroups, sessionCoverage } from './coverage';
import { suggestExercises, trainingFocuses } from './suggestions';
const profile = {
  ...seedState().profile,
  equipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Pull-up bar'],
  exerciseCount: 5,
};
describe('coverage and replacements', () => {
  it('uses catalog IDs for every programming role', () => {
    for (const roles of Object.values(roleGroups))
      for (const ids of Object.values(roles))
        for (const id of ids) expect(exercises.some((e) => e.id === id)).toBe(true);
  });
  it.each(['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Cardio'] as const)(
    'prioritizes complementary roles for %s',
    (focus) => {
      const ids = suggestExercises(profile, focus).exerciseIds;
      expect(sessionCoverage(ids, focus).every((c) => c.covered)).toBe(true);
    },
  );
  it.each(trainingFocuses)('never invents equipment or duplicates for %s', (focus) => {
    const p = { ...profile, equipment: [], excluded: ['pushup', 'lunge'] };
    const ids = suggestExercises(p, focus).exerciseIds;
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => exercises.find((e) => e.id === id)?.equipment === 'Bodyweight')).toBe(
      true,
    );
    expect(ids).not.toContain('pushup');
    expect(ids).not.toContain('lunge');
  });
  it('reports limited-count and equipment gaps without claiming full coverage', () => {
    const ids = suggestExercises(
      { ...profile, equipment: [], exerciseCount: 1 },
      'Chest',
    ).exerciseIds;
    const coverage = sessionCoverage(ids, 'Chest');
    expect(coverage.some((c) => !c.covered)).toBe(true);
    expect(coverage.find((c) => c.label === 'Upper chest emphasis')?.covered).toBe(false);
  });
  it('ranks upper-chest alternatives first and avoids excluded or selected exercises', () => {
    const options = alternativesFor('incline', profile, ['incline', 'bench']);
    expect(options[0].exercise.id).toBe('incline-barbell');
    expect(options[0].sameEmphasis).toBe(true);
    expect(options.some((o) => o.exercise.id === 'bench')).toBe(false);
    expect(
      alternativesFor(
        'incline',
        { ...profile, excluded: ['incline-barbell'], preferences: 'no barbell' },
        ['incline'],
      ).every((o) => o.exercise.equipment !== 'Barbell'),
    ).toBe(true);
  });
  it('keeps replacements in the same muscle and repetition unit', () => {
    for (const e of exercises)
      for (const o of alternativesFor(e.id, profile, [e.id])) {
        expect(o.exercise.muscle).toBe(e.muscle);
        expect(o.exercise.unit).toBe(e.unit);
      }
  });
  it('shows a lost role after choosing a different-emphasis alternative', () => {
    const before = ['incline', 'bench', 'high-low-fly'];
    expect(sessionCoverage(before, 'Chest').every((c) => c.covered)).toBe(true);
    const after = before.map((id) => (id === 'incline' ? 'pushup' : id));
    expect(
      sessionCoverage(after, 'Chest').find((c) => c.label === 'Upper chest emphasis')?.covered,
    ).toBe(false);
  });
});

it('retains absent muscle warnings for a saved full-body focus', () => {
  const coverage = sessionCoverage(['squat', 'bench', 'plank'], 'Full body');
  expect(coverage.filter((c) => c.muscle === 'Back')).toHaveLength(2);
  expect(coverage.filter((c) => c.muscle === 'Back').every((c) => !c.covered)).toBe(true);
});
