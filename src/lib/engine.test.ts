import { describe, expect, it } from 'vitest';
import { seedState } from '../data/seed';
import { exerciseById, exercises } from '../data/exercises';
import { coachReply, generatePlan, nutritionTargets, progression, volume } from './engine';
import type { WorkoutLog } from './types';
const profile = seedState().profile;
const workout = (weight = 50, reps = 10, rpe = 8, date = '2026-09-01'): WorkoutLog => ({
  id: date,
  date,
  name: 'Test',
  duration: 40,
  notes: '',
  exercises: [
    {
      exerciseId: 'bench',
      notes: '',
      sets: Array.from({ length: 3 }, () => ({ weight, reps, rpe, done: true })),
    },
  ],
});
describe('personalized planning', () => {
  it('uses only available equipment and respects excluded movements', () => {
    const p = { ...profile, equipment: [], excluded: ['pushup'], days: [1, 3, 5] };
    const plan = generatePlan(p, []);
    expect(plan.exercises.length).toBeGreaterThan(0);
    for (const e of plan.exercises) {
      expect(exerciseById(e.exerciseId).equipment).toBe('Bodyweight');
      expect(e.exerciseId).not.toBe('pushup');
    }
  });
  it('trims a short session without increasing work', () => {
    const long = generatePlan(profile, [], { duration: 60 });
    const short = generatePlan(profile, [], { duration: 20 });
    expect(short.exercises.length).toBeLessThan(long.exercises.length);
    expect(short.exercises.every((e) => e.sets <= 3)).toBe(true);
  });
  it('reduces volume and effort for an easier session', () => {
    const easy = generatePlan(profile, [], { lighter: true });
    expect(easy.exercises.every((e) => e.sets <= 2 && e.rpe === 6)).toBe(true);
  });
  it('does not introduce weighted recommendations without history', () =>
    expect(generatePlan(profile, []).exercises.every((e) => e.weight === 0)).toBe(true));
  it('adapts rep ranges for strength', () =>
    expect(
      generatePlan({ ...profile, goal: 'Strength' }, [])
        .exercises.filter((e) => !exerciseById(e.exerciseId).unit)
        .every((e) => e.reps === 6),
    ).toBe(true));
  it('reduces beginner sets', () =>
    expect(
      generatePlan({ ...profile, level: 'Beginner' }, []).exercises.every((e) => e.sets <= 2),
    ).toBe(true));
  it('has no duplicate exercises', () => {
    const p = generatePlan(profile, []);
    expect(new Set(p.exercises.map((e) => e.exerciseId)).size).toBe(p.exercises.length);
  });
  it('uses duration targets for cardio', () => {
    const p = generatePlan({ ...profile, goal: 'Cardio improvement' }, []);
    expect(exerciseById(p.exercises[0].exerciseId).unit).toBe('minutes');
  });
});
describe('conservative progression', () => {
  it('requires two successful sessions before increasing', () => {
    expect(progression('bench', [workout()], 10).weight).toBe(50);
    expect(progression('bench', [workout(), workout(50, 10, 8, '2026-09-04')], 10).weight).toBe(51);
  });
  it('reduces load after very high effort or missed reps', () => {
    expect(progression('bench', [workout(50, 10, 10)], 10).weight).toBe(47.5);
    expect(progression('bench', [workout(50, 6, 8)], 10).weight).toBe(47.5);
  });
  it('ignores unfinished sets in volume', () => {
    const w = workout();
    w.exercises[0].sets[0].done = false;
    expect(volume(w)).toBe(1000);
  });
  it('does not count unfinished sessions as successful progression', () => {
    const w = workout();
    w.exercises[0].sets[0].done = false;
    expect(progression('bench', [w, w], 10).weight).toBe(50);
  });
});
describe('nutrition and safety', () => {
  it('keeps goal adjustments moderate', () => {
    const neutral = nutritionTargets(profile);
    expect(nutritionTargets({ ...profile, goal: 'Fat loss' }).calories).toBe(
      neutral.maintenance - 250,
    );
    expect(nutritionTargets({ ...profile, goal: 'Muscle gain' }).calories).toBe(
      neutral.maintenance + 200,
    );
  });
  it('returns finite macro targets for profile boundaries', () => {
    const targets = nutritionTargets({
      ...profile,
      age: 100,
      weight: 30,
      height: 120,
      activity: 1.2,
      goal: 'Weight loss',
    });
    expect(targets.calories).toBeGreaterThanOrEqual(1500);
    expect(targets.carbs).toBeGreaterThanOrEqual(0);
  });
  it('prioritizes urgent symptom escalation over workout advice', () => {
    const answer = coachReply('I have chest pain, should I increase my bench?', seedState());
    expect(answer).toContain('Stop exercising');
    expect(answer).toContain('medical');
    expect(answer).not.toContain('2.5%');
  });
  it('routes pain to professional guidance', () =>
    expect(coachReply('My shoulder hurts', seedState())).toContain('clinician'));
  it('has useful coaching and valid alternatives for every exercise', () => {
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    for (const e of exercises) {
      expect(e.setup.length).toBeGreaterThan(30);
      expect(e.steps.length).toBeGreaterThanOrEqual(3);
      for (const id of e.alternatives) expect(exercises.some((e) => e.id === id)).toBe(true);
    }
  });
});
