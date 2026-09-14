// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../lib/Provider';
import Workout from './Workout';
import Nutrition from './Nutrition';
import Progress from './Progress';
import Library from './ExerciseGuide';
import { ProfileForm } from './Settings';
import { seedState } from '../data/seed';
const matchMedia = () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'matchMedia', { value: matchMedia, writable: true });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
    writable: true,
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
    writable: true,
  });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function saved() {
  return JSON.parse(localStorage.getItem('forma.demo.v1')!);
}
describe('core demo journeys', () => {
  it('starts a session, logs a set, and persists workout history', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <Workout />
      </Provider>,
    );
    await user.click(screen.getByRole('button', { name: /Start workout/i }));
    const weight = screen.getByRole('spinbutton', { name: 'Set 1 weight in kg' });
    await user.clear(weight);
    await user.type(weight, '25');
    await user.click(screen.getByRole('button', { name: 'Complete set 1' }));
    expect(saved().active.logs[0].sets[0].done).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Finish session' }));
    await user.click(screen.getByRole('button', { name: 'Save workout' }));
    await waitFor(() => expect(saved().workouts.length).toBe(15));
    expect(saved().active).toBeNull();
    expect(saved().workouts.at(-1).exercises[0].sets[0].weight).toBe(25);
  });
  it('resumes saved active session after remount', async () => {
    const user = userEvent.setup();
    const first = render(
      <Provider>
        <Workout />
      </Provider>,
    );
    await user.click(screen.getByRole('button', { name: /Start workout/i }));
    await user.click(screen.getByRole('button', { name: 'Complete set 1' }));
    first.unmount();
    render(
      <Provider>
        <Workout />
      </Provider>,
    );
    expect(screen.getByRole('button', { name: 'Undo set 1' })).toBeTruthy();
  });
  it('adds a meal with quantity and retains its nutrition values', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <Nutrition />
      </Provider>,
    );
    await user.click(screen.getByRole('button', { name: 'Log a meal' }));
    await user.type(screen.getByLabelText('Food or meal name'), 'Test oatmeal');
    const cal = screen.getByLabelText('Calories per portion');
    await user.clear(cal);
    await user.type(cal, '300');
    const qty = screen.getByLabelText('Quantity');
    await user.clear(qty);
    await user.type(qty, '2');
    await user.click(screen.getByRole('button', { name: 'Save meal' }));
    expect(screen.getByText('Test oatmeal')).toBeTruthy();
    expect(saved().meals.at(-1).quantity).toBe(2);
    expect(saved().meals.at(-1).calories).toBe(300);
  });
  it('logs a measurement and updates the current profile weight', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <Progress />
      </Provider>,
    );
    await user.click(screen.getByRole('button', { name: 'Log check-in' }));
    const weight = screen.getByLabelText('Weight (kg)');
    await user.clear(weight);
    await user.type(weight, '77.5');
    await user.click(screen.getByRole('button', { name: 'Save check-in' }));
    expect(saved().profile.weight).toBe(77.5);
    expect(saved().measurements.at(-1).weight).toBe(77.5);
  });
  it('filters exercise guides and opens real coaching content', async () => {
    const user = userEvent.setup();
    render(<Library />);
    await user.type(screen.getByRole('textbox', { name: 'Search exercises' }), 'bench');
    await user.click(screen.getByRole('button', { name: /Barbell bench press/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Set yourself up')).toBeTruthy();
    expect(within(dialog).getByText(/Use safety arms or a capable spotter/)).toBeTruthy();
  });
  it('completes the four-step profile form and saves preferences', async () => {
    const user = userEvent.setup();
    const initial = seedState();
    initial.profile.name = 'New Athlete';
    localStorage.setItem('forma.demo.v1', JSON.stringify(initial));
    const onClose = vi.fn();
    render(
      <Provider>
        <ProfileForm onClose={onClose} />
      </Provider>,
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.selectOptions(screen.getByLabelText('Your main goal'), 'Strength');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.selectOptions(screen.getByLabelText('Where do you train?'), 'Home');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.selectOptions(screen.getByLabelText('Exercises to exclude'), 'pushup');
    await user.click(screen.getByRole('button', { name: 'Save my profile' }));
    expect(saved().profile.goal).toBe('Strength');
    expect(saved().profile.location).toBe('Home');
    expect(saved().profile.excluded).toContain('pushup');
    expect(onClose).toHaveBeenCalled();
  });
});

it('saves a Monday leg plan, restores it after reload, and leaves cancellation unchanged', async () => {
  const user = userEvent.setup();
  const view = render(
    <Provider>
      <Workout />
    </Provider>,
  );
  await user.click(screen.getByRole('button', { name: 'Edit weekly plan' }));
  for (const button of screen.getAllByRole('button', { name: /^Remove / }))
    await user.click(button);
  await user.clear(screen.getByLabelText('Session name'));
  await user.type(screen.getByLabelText('Session name'), 'Leg day');
  await user.click(screen.getByRole('button', { name: 'Add Bodyweight squat' }));
  await user.click(screen.getByRole('button', { name: 'Add Glute bridge' }));
  await user.click(screen.getByRole('button', { name: 'Move Glute bridge up' }));
  await user.click(screen.getByRole('button', { name: 'Save weekly plan' }));
  await waitFor(() =>
    expect(saved().profile.weeklyPlan[1].exerciseIds).toEqual(['bridge', 'body-squat']),
  );
  view.unmount();
  render(
    <Provider>
      <Workout />
    </Provider>,
  );
  await user.click(screen.getByRole('button', { name: /^MON/ }));
  expect(screen.getByRole('heading', { name: 'Leg day' })).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Edit weekly plan' }));
  await user.clear(screen.getByLabelText('Session name'));
  await user.click(screen.getByRole('button', { name: 'Save weekly plan' }));
  expect(screen.getByRole('alert').textContent).toContain('needs a session name');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(saved().profile.weeklyPlan[1].name).toBe('Leg day');
});

it('previews Forma leg suggestions and applies them only when requested', async () => {
  const initial = seedState();
  initial.profile.exerciseCount = 5;
  localStorage.setItem('forma.demo.v1', JSON.stringify(initial));
  const user = userEvent.setup();
  render(
    <Provider>
      <Workout />
    </Provider>,
  );
  await user.click(screen.getByRole('button', { name: 'Edit weekly plan' }));
  await user.selectOptions(screen.getByLabelText('Training focus'), 'Legs');
  await user.click(screen.getByRole('button', { name: 'Suggest exercises' }));
  expect(saved().profile.weeklyPlan).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Use suggestions for Monday' }));
  expect((screen.getByLabelText('Session name') as HTMLInputElement).value).toBe('Legs day');
  expect(saved().profile.weeklyPlan).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Save weekly plan' }));
  await waitFor(() => expect(saved().profile.weeklyPlan[1].exerciseIds).toHaveLength(5));
});
