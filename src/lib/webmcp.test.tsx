// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, act } from '@testing-library/react';
import { Provider } from './Provider';
import { useApp } from './context';
import { useFitnessTools } from './webmcp';
afterEach(() => {
  cleanup();
  delete document.modelContext;
  localStorage.clear();
});
it('exposes read-only overview and validates section navigation', async () => {
  const tools = new Map<
    string,
    Parameters<NonNullable<Document['modelContext']>['registerTool']>[0]
  >();
  document.modelContext = {
    registerTool: (tool) => {
      tools.set(tool.name, tool);
    },
  };
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    writable: true,
  });
  window.scrollTo = vi.fn();
  function Harness() {
    useFitnessTools();
    const { page } = useApp();
    return <div>{page}</div>;
  }
  render(
    <Provider>
      <Harness />
    </Provider>,
  );
  expect(tools.size).toBe(2);
  const overview = tools.get('get_training_overview')!;
  expect(overview.annotations.readOnlyHint).toBe(true);
  expect(overview.execute({})).toMatchObject({ completedWorkouts: 14, sessionActive: false });
  const navigation = tools.get('open_fitness_section')!;
  expect(() => navigation.execute({ section: 'Delete account' })).toThrow('valid Forma section');
  await act(async () => {
    expect(navigation.execute({ section: 'Workout' })).toEqual({ opened: 'Workout' });
  });
  expect(screen.getByText('Workout')).toBeTruthy();
});
