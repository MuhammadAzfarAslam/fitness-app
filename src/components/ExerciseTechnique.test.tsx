// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ExerciseTechnique from './ExerciseTechnique';
import { exercises, exerciseById } from '../data/exercises';
import { techniques } from '../data/technique';
afterEach(cleanup);
it('gives every exercise specific grip, alignment, range and exit guidance', () => {
  for (const exercise of exercises) {
    expect(techniques[exercise.id], exercise.name).toBeDefined();
    for (const value of Object.values(techniques[exercise.id]))
      expect(value.length).toBeGreaterThan(30);
  }
});
it('explains incline grip direction and lets users compare the neutral variation', () => {
  render(<ExerciseTechnique exercise={exerciseById('incline')} />);
  expect(screen.getByRole('tab', { name: 'Grip & setup' }).getAttribute('aria-selected')).toBe(
    'true',
  );
  expect(screen.getByRole('img', { name: /handles run across the body/ })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /Palms facing each other/ }));
  expect(screen.getByRole('img', { name: /handles run head to feet/ })).toBeDefined();
  expect(screen.getByText('Handles run head-to-feet · palms face inward')).toBeDefined();
});
it('supports keyboard navigation to annotated angles and self-checks', () => {
  render(<ExerciseTechnique exercise={exerciseById('incline')} />);
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Grip & setup' }), { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: 'Angles' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByRole('img', { name: /Low incline bench/ })).toBeDefined();
  expect(screen.getByRole('img', { name: /Keep the dumbbell centered/ })).toBeDefined();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Angles' }), { key: 'End' });
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
  expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText(/not an automatic form assessment/)).toBeDefined();
});
