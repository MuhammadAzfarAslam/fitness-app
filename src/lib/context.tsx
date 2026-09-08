import { useContext } from 'react';
import { Context } from './context-value';
export function useApp() {
  const value = useContext(Context);
  if (!value) throw Error('App provider is missing');
  return value;
}
export const displayWeight = (kg: number, units: 'kg' | 'lb') =>
  Math.round(kg * (units === 'lb' ? 2.2046226218 : 1) * 10) / 10;
export const fromDisplayWeight = (n: number, units: 'kg' | 'lb') =>
  units === 'lb' ? n / 2.2046226218 : n;
