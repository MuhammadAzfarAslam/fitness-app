import { createClient } from '@supabase/supabase-js';
import type { AppState } from './types';
import { seedState } from '../data/seed';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
const demoKey = 'forma.demo.v1';
export function loadDemo(): AppState {
  try {
    const raw = localStorage.getItem(demoKey);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.version === 1 && data.profile && Array.isArray(data.workouts)) return data;
    }
  } catch {
    /* A new demo remains available if storage is unavailable. */
  }
  return seedState();
}
export function saveDemo(state: AppState) {
  localStorage.setItem(demoKey, JSON.stringify(state));
}
export async function loadCloud(userId: string): Promise<AppState> {
  if (!supabase) throw Error('Cloud is not configured.');
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.data ?? seedState(true);
}
export async function saveCloud(userId: string, state: AppState) {
  if (!supabase) throw Error('Cloud is not configured.');
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function requestCoach(message: string, state: AppState) {
  if (!supabase) throw Error('AI coaching is not connected.');
  const { data, error } = await supabase.functions.invoke('coach', {
    body: {
      message,
      profile: state.profile,
      workouts: state.workouts.slice(-5),
      recovery: state.recovery.slice(-3),
    },
  });
  if (error) throw error;
  if (!data?.reply) throw Error('The coach returned an empty response.');
  return data.reply as string;
}
export async function analyzeFood(image: string) {
  if (!supabase)
    throw Error(
      'Photo estimation requires a connected AI service. Enter nutrition manually below.',
    );
  const { data, error } = await supabase.functions.invoke('food-analysis', { body: { image } });
  if (error) throw error;
  return data;
}
