import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppState, Page } from './types';
type ContextValue = {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  page: Page;
  navigate: (p: Page) => void;
  notify: (s: string) => void;
  userId: string | null;
  sync: string;
  loading: boolean;
  logout: () => Promise<void>;
  reset: () => void;
};
export const Context = createContext<ContextValue | null>(null);
