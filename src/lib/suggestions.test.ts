import { expect, it } from 'vitest';
import { seedState } from '../data/seed';
import { exerciseById } from '../data/exercises';
import { suggestExercises } from './suggestions';
it('suggests five distinct leg exercises using profile count', () => {
  const p = { ...seedState().profile, exerciseCount: 5 };
  const s = suggestExercises(p, 'Legs');
  expect(s.exerciseIds).toHaveLength(5);
  expect(new Set(s.exerciseIds).size).toBe(5);
  expect(s.exerciseIds.every((id) => exerciseById(id).muscle === 'Legs')).toBe(true);
  expect(s.exerciseIds).toContain('lunge');
  expect(s.exerciseIds).toContain('calf');
});
it('reports insufficient compatible choices instead of ignoring exclusions or equipment', () => {
  const p = {
    ...seedState().profile,
    exerciseCount: 5,
    equipment: [],
    excluded: ['lunge'],
    level: 'Beginner',
  };
  const s = suggestExercises(p, 'Legs');
  expect(s.exerciseIds).not.toContain('lunge');
  expect(s.exerciseIds.length).toBeLessThan(5);
  expect(s.warning).toContain('Only');
  expect(s.exerciseIds.every((id) => exerciseById(id).equipment === 'Bodyweight')).toBe(true);
});
