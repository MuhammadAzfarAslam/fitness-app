import { expect, it } from 'vitest';
import { seedState } from '../data/seed';
import { applyReviewMove, easierPlan, readiness, weeklyReview } from './review';
import { generatePlan, today } from './engine';
it('distinguishes readiness from pain and emergency symptoms', () => {
  const r = {
    date: today(),
    sleep: 8,
    fatigue: 2,
    soreness: 2,
    stress: 2,
    motivation: 3,
    pain: 'none' as const,
  };
  expect(readiness(r).level).toBe('usual');
  expect(readiness({ ...r, sleep: 4 }).level).toBe('easy');
  expect(readiness({ ...r, pain: 'movement' }).level).toBe('stop');
  expect(readiness({ ...r, pain: 'urgent' }).level).toBe('stop');
  expect(readiness().level).toBe('unknown');
});
it('offers recovery spacing across Sunday and Monday without mutating the plan', () => {
  const s = seedState();
  s.profile.days = [0, 1];
  s.profile.weeklyPlan = {
    0: { name: 'Leg A', exerciseIds: ['body-squat', 'bridge'] },
    1: { name: 'Leg B', exerciseIds: ['lunge', 'calf'] },
  };
  const before = JSON.stringify(s);
  const r = weeklyReview(s);
  expect(r.findings.some((f) => f.includes('Sunday and Monday'))).toBe(true);
  expect(r.move).toBeDefined();
  expect(JSON.stringify(s)).toBe(before);
  const next = applyReviewMove(s, r.move!.from, r.move!.to);
  expect(next.days).not.toContain(r.move!.from);
  expect(next.weeklyPlan?.[r.move!.to].exerciseIds).toEqual(['lunge', 'calf']);
  expect(() => applyReviewMove(s, 0, 1)).toThrow();
});
it('only counts completed sets from the previous seven complete days', () => {
  const s = seedState();
  s.workouts = [
    {
      id: 'a',
      date: '2026-09-14',
      name: 'Session',
      duration: 30,
      notes: '',
      exercises: [
        {
          exerciseId: 'squat',
          notes: '',
          sets: [
            { weight: 20, reps: 10, rpe: 9, done: true },
            { weight: 20, reps: 10, rpe: 3, done: false },
          ],
        },
      ],
    },
    { id: 'b', date: '2026-09-15', name: 'Today', duration: 30, notes: '', exercises: [] },
  ];
  const r = weeklyReview(s, '2026-09-15');
  expect(r.completedDays).toBe(1);
  expect(r.avgRpe).toBe(9);
  expect(r.findings.some((f) => f.includes('not enough recent evidence'))).toBe(true);
});
it('reduces effort without deleting exercises or changing the source plan', () => {
  const s = seedState();
  const p = generatePlan(s.profile, [], { day: 1 });
  const before = JSON.stringify(p);
  const easy = easierPlan(p);
  expect(easy.exercises.length).toBe(p.exercises.length);
  expect(easy.exercises.every((e) => e.sets >= 1 && e.rpe === 6)).toBe(true);
  expect(JSON.stringify(p)).toBe(before);
});
