import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Page } from './types';
import { Context } from './context-value';
import { loadCloud, loadDemo, saveCloud, saveDemo, supabase } from './storage';
import { seedState } from '../data/seed';
export function Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadDemo);
  const [page, setPage] = useState<Page>('Home');
  const [toast, setToast] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sync, setSync] = useState('Saved on this device');
  const [loading, setLoading] = useState(!!supabase);
  const [ready, setReady] = useState(!supabase);
  const userRef = useRef<string | null>(null);
  const initialized = useRef(false);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (initialized.current && id === userRef.current) return;
      initialized.current = true;
      const gen = ++generation.current;
      userRef.current = id;
      setUserId(id);
      setReady(false);
      setLoading(true);
      if (id) {
        setTimeout(() => {
          loadCloud(id)
            .then((data) => {
              if (generation.current === gen) {
                setState(data);
                setReady(true);
                setSync('Synced to your account');
              }
            })
            .catch((err) => {
              if (generation.current === gen) {
                setState(seedState(true));
                setSync(
                  `Cloud unavailable: ${err.message}. Sign out and retry to protect existing data.`,
                );
              }
            })
            .finally(() => {
              if (generation.current === gen) setLoading(false);
            });
        }, 0);
      } else {
        setState(loadDemo());
        setReady(true);
        setLoading(false);
        setSync('Saved on this device');
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  // Persistence is an external system; sync status follows the result of each write.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      try {
        saveDemo(state);
        queueMicrotask(() => setSync('Saved on this device'));
      } catch {
        queueMicrotask(() => setSync('Device storage is full or unavailable. Export your data.'));
      }
      return;
    }
    queueMicrotask(() => setSync('Saving…'));
    const gen = generation.current;
    const timer = setTimeout(() => {
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          if (generation.current !== gen) return;
          await saveCloud(userId, state);
          if (generation.current === gen) setSync('Synced to your account');
        })
        .catch((err) => {
          if (generation.current === gen)
            setSync(
              `Not synced: ${err.message}. Your changes remain in this session; export to keep a backup.`,
            );
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [state, userId, ready, retry]);
  useEffect(() => {
    const online = () => setRetry((r) => r + 1);
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        state.theme === 'system' ? (media.matches ? 'dark' : 'light') : state.theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [state.theme]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <Context.Provider
      value={{
        state,
        setState,
        page,
        navigate,
        notify: setToast,
        userId,
        sync,
        loading,
        logout: async () => {
          if (userId && ready) {
            await queue.current;
            await saveCloud(userId, state);
          }
          if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          }
        },
        reset: () => setState(seedState(true)),
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
