// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ signUp: vi.fn(), resetPasswordForEmail: vi.fn() }));
vi.mock('../lib/storage', () => ({ supabase: { auth } }));
vi.mock('../lib/context', () => ({ useApp: () => ({ notify: vi.fn() }) }));
import { Auth } from './Settings';
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('sends signup confirmation to production, not the local page origin', async () => {
  render(<Auth onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'sample-test-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await waitFor(() =>
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: 'https://muhammadazfaraslam.github.io/fitness-app/' },
      }),
    ),
  );
});
it('uses the same production destination for password recovery', async () => {
  render(<Auth onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
  await waitFor(() =>
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'https://muhammadazfaraslam.github.io/fitness-app/',
    }),
  );
});
