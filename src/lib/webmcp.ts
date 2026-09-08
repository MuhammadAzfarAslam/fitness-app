import { useEffect, useRef } from 'react';
import { useApp } from './context';
import { generatePlan } from './engine';
import type { Page } from './types';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void>;
    };
  }
}
export function useFitnessTools() {
  const app = useApp();
  const current = useRef(app);
  useEffect(() => {
    current.current = app;
  }, [app]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(
          () => {},
        );
      } catch {
        /* Optional browser capability; never block the app. */
      }
    };
    register({
      name: 'get_training_overview',
      description:
        'Read the signed-in or demo user’s current training plan and completed workout count. Does not change data.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => {
        const { state } = current.current;
        const plan = state.active?.plan ?? generatePlan(state.profile, state.workouts);
        return {
          plan: plan.name,
          duration: plan.duration,
          exercises: plan.exercises.length,
          completedWorkouts: state.workouts.length,
          sessionActive: !!state.active,
        };
      },
    });
    register({
      name: 'open_fitness_section',
      description: 'Open a section of Forma. Navigates only; does not log data or start a workout.',
      inputSchema: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: ['Home', 'Workout', 'Nutrition', 'Progress', 'Trainer', 'Library', 'Settings'],
          },
        },
        required: ['section'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const section = (input as { section?: unknown })?.section;
        if (
          typeof section !== 'string' ||
          !['Home', 'Workout', 'Nutrition', 'Progress', 'Trainer', 'Library', 'Settings'].includes(
            section,
          )
        )
          throw Error('Choose a valid Forma section.');
        current.current.navigate(section as Page);
        return { opened: section };
      },
    });
    return () => controller.abort();
  }, []);
}
