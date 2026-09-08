import type { AppState } from '../lib/types';
import { dateBefore, today } from '../lib/engine';
export function seedState(empty = false): AppState {
  const profile = {
    name: empty ? 'Your name' : 'Alex Morgan',
    age: 28,
    sex: 'Male',
    height: 178,
    weight: 78.4,
    targetWeight: 75,
    goal: 'Body recomposition',
    customGoal: 'Build strength and feel more confident, one session at a time',
    secondaryGoals: 'Improve consistency',
    level: 'Intermediate',
    experience: '1–2 years',
    days: [1, 2, 4, 6],
    duration: 50,
    exerciseCount: 6,
    location: 'Gym',
    equipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Pull-up bar'],
    injuries: '',
    limitations: '',
    excluded: [],
    preferences: '',
    activity: 1.55,
    sleep: 7.5,
    onboarded: !empty,
  };
  return {
    version: 1,
    profile,
    workouts: empty
      ? []
      : Array.from({ length: 14 }, (_, i) => ({
          id: `seed-${i}`,
          date: dateBefore((14 - i) * 2),
          name: i % 2 ? 'Upper body · Build' : 'Lower body · Build',
          duration: 42 + (i % 9),
          notes: i === 13 ? 'Felt strong. Kept the last reps controlled.' : '',
          exercises: (i % 2
            ? ['bench', 'pulldown', 'incline', 'cable-row', 'lateral']
            : ['squat', 'rdl', 'lunge', 'calf', 'plank']
          ).map((exerciseId, j) => ({
            exerciseId,
            notes: '',
            sets: Array.from({ length: 3 }, () => ({
              weight:
                exerciseId === 'plank' ? 0 : j === 0 ? 50 + Math.floor(i / 3) * 2.5 : 20 + j * 5,
              reps: exerciseId === 'plank' ? 30 : 10,
              rpe: 7.5,
              done: true,
            })),
          })),
        })),
    meals: empty
      ? []
      : [
          {
            id: 'm1',
            date: today(),
            category: 'Breakfast',
            name: 'Greek yogurt & berry bowl',
            portion: '1 bowl · yogurt, oats, berries',
            quantity: 1,
            calories: 420,
            protein: 32,
            carbs: 52,
            fat: 9,
          },
          {
            id: 'm2',
            date: today(),
            category: 'Lunch',
            name: 'Grilled chicken nourish bowl',
            portion: '1 bowl · chicken, rice, avocado',
            quantity: 1,
            calories: 645,
            protein: 48,
            carbs: 65,
            fat: 21,
          },
          {
            id: 'm3',
            date: today(),
            category: 'Snacks',
            name: 'Banana & protein shake',
            portion: '1 banana + 1 scoop whey',
            quantity: 1,
            calories: 225,
            protein: 26,
            carbs: 29,
            fat: 2,
          },
        ],
    measurements: empty
      ? []
      : Array.from({ length: 9 }, (_, i) => ({
          id: `w${i}`,
          date: dateBefore((8 - i) * 7),
          weight: Number((81.2 - i * 0.35 + (i % 3 === 0 ? 0.1 : 0)).toFixed(1)),
          waist: 85 - i * 0.4,
        })),
    recovery: [],
    photos: [],
    messages: [
      {
        role: 'assistant',
        content:
          'Hey! I’m your Forma coach. Let’s make your next session a good one. Ask me about your training, recovery, or nutrition.',
      },
    ],
    active: null,
    water: { date: today(), glasses: 3 },
    theme: 'light',
    units: 'kg',
    reminder: false,
  };
}
