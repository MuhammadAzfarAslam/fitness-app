// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { exercises, exerciseById } from '../data/exercises';
import { movementVisuals } from '../data/movementVisuals';
import MovementDemo from './MovementDemo';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('provides complete, in-bounds visual instructions for every catalog exercise', () => {
  for (const exercise of exercises) {
    const visual = movementVisuals[exercise.id];
    expect(visual, exercise.name).toBeDefined();
    for (const pose of [visual.start, visual.end]) {
      expect(pose).toHaveLength(11);
      for (const [x, y] of pose) {
        expect(x).toBeGreaterThanOrEqual(14);
        expect(x).toBeLessThanOrEqual(346);
        expect(y).toBeGreaterThanOrEqual(14);
        expect(y).toBeLessThanOrEqual(266);
      }
    }
  }
});
it('lets users select stages, play, pause, slow down and reset without autoplay', () => {
  render(<MovementDemo exercise={exerciseById('pullup')} />);
  expect(screen.getByRole('button', { name: 'Play demonstration' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: '02 Pull' }));
  expect(screen.getByRole('img').getAttribute('aria-labelledby')).toBeTruthy();
  expect(screen.getByText('Draw elbows toward your ribs; keep your neck neutral.')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Play demonstration' }));
  act(() => vi.advanceTimersByTime(2400));
  expect(screen.getByRole('button', { name: '03 Lower' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pause demonstration' }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: '03 Lower' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: '1× speed' }));
  fireEvent.click(screen.getByRole('button', { name: 'Restart demonstration' }));
  expect(screen.getByRole('button', { name: '01 Engage' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
  expect(screen.getByRole('button', { name: '0.5× speed' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
});
it('uses still positions when reduced motion is requested', () => {
  const { container } = render(<MovementDemo exercise={exerciseById('pullup')} />);
  fireEvent.click(screen.getByRole('button', { name: '02 Pull' }));
  act(() => vi.advanceTimersByTime(16));
  const heads = container.querySelectorAll('circle[r="14"]');
  expect(heads[1].getAttribute('cy')).toBe('25');
  expect(screen.getByText(/Reduced motion is on/)).toBeDefined();
});
