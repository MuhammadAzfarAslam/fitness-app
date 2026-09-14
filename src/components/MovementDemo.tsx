import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { movementVisuals, type Pose } from '../data/movementVisuals';
import type { Exercise } from '../lib/types';

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function Figure({
  pose,
  ghost = false,
  calf = false,
}: {
  pose: Pose;
  ghost?: boolean;
  calf?: boolean;
}) {
  const edges = [
    [1, 2],
    [1, 5],
    [5, 6],
    [2, 9],
    [9, 10],
    [1, 3],
    [3, 4],
    [2, 7],
    [7, 8],
  ];
  return (
    <g opacity={ghost ? 0.12 : 1}>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={pose[a][0]}
          y1={pose[a][1]}
          x2={pose[b][0]}
          y2={pose[b][1]}
          stroke={i === 0 ? '#b8e65b' : i < 5 ? '#738278' : '#243c32'}
          strokeWidth={i === 0 ? 23 : 13}
          strokeLinecap="round"
        />
      ))}
      <line
        x1={pose[0][0]}
        y1={pose[0][1]}
        x2={pose[1][0]}
        y2={pose[1][1]}
        stroke="#243c32"
        strokeWidth="12"
      />
      <circle cx={pose[0][0]} cy={pose[0][1]} r="14" fill="#243c32" />
      {[3, 5, 7, 9].map((i) => (
        <circle key={i} cx={pose[i][0]} cy={pose[i][1]} r="4" fill="#e8efdf" />
      ))}
      {[8, 10].map((i) => (
        <line
          key={i}
          x1={pose[i][0] - 5}
          y1={pose[i][1]}
          x2={pose[i][0] + 12}
          y2={calf ? 247 : pose[i][1]}
          stroke="#243c32"
          strokeWidth="9"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

export default function MovementDemo({ exercise }: { exercise: Exercise }) {
  const visual = movementVisuals[exercise.id];
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(visual.start);
  const previous = useRef(display);
  const titleId = useId();
  const descId = useId();
  const target = phase === 1 ? visual.end : visual.start;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setPhase((p) => (p + 1) % 3), slow ? 4800 : 2400);
    return () => window.clearInterval(timer);
  }, [playing, slow]);
  useEffect(() => {
    if (frozen) return;
    const from = previous.current;
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / (slow ? 1800 : 900));
      const ease = t * t * (3 - 2 * t);
      const next = target.map(([x, y], i) => [
        from[i][0] + (x - from[i][0]) * ease,
        from[i][1] + (y - from[i][1]) * ease,
      ]) as Pose;
      previous.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, slow, frozen]);
  const select = (p: number) => {
    setPlaying(false);
    setFrozen(false);
    setPhase(p);
  };
  const hands = exercise.id === 'db-row' ? [4] : [4, 6];
  return (
    <section className="movement-demo" aria-label={`${exercise.name} visual instructions`}>
      <div className="movement-heading">
        <span className="eyebrow">MOVEMENT STUDIO</span>
        <span>{visual.view}</span>
      </div>
      <div className="movement-stage">
        <span className="movement-stage-label">
          0{phase + 1} / {visual.labels[phase]}
        </span>
        <svg viewBox="0 0 360 280" role="img" aria-labelledby={`${titleId} ${descId}`}>
          <title id={titleId}>
            {exercise.name}: {visual.labels[phase]}
          </title>
          <desc id={descId}>{visual.cues[phase]} Simplified movement illustration.</desc>
          <path d="M30 259H330" stroke="#d6dfd0" strokeWidth="2" />
          <g
            fill="none"
            stroke="#a7b3a3"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {visual.equipment === 'bar' && <path d="M95 258V42H265V258M113 42H247" />}
            {visual.equipment === 'bench' &&
              (exercise.id === 'incline' ? (
                <path d="M112 166L207 207H258M139 185V253M246 207V253" />
              ) : exercise.id === 'db-row' ? (
                <path d="M252 197H311M263 197V253M301 197V253" />
              ) : (
                <path d="M75 207H220M93 207V253M203 207V253" />
              ))}
            {visual.equipment === 'seat' && <path d="M158 105V179H226M167 179V253M218 179V253" />}
            {visual.equipment === 'platform' && (
              <path d="M70 151L142 220H184M139 219V255M282 66L310 100" />
            )}
            {visual.equipment === 'cable' && <path d="M320 255V24H285" />}
            {visual.equipment === 'bike' && (
              <>
                <circle cx="103" cy="220" r="32" />
                <circle cx="269" cy="220" r="32" />
                <path d="M103 220L174 163L207 220H103M174 163H154M207 220L258 134L275 123" />
              </>
            )}
            {visual.equipment === 'steps' && <path d="M130 257H204V219H245V182H290V145H325" />}
          </g>
          {visual.equipment === 'cable' && (
            <line
              x1={exercise.id === 'triceps' || exercise.id === 'crunch' ? 285 : 320}
              y1={exercise.id === 'triceps' || exercise.id === 'crunch' ? 24 : 160}
              x2={display[4][0]}
              y2={display[4][1]}
              stroke="#879782"
              strokeWidth="2"
            />
          )}
          {visual.equipment === 'platform' && (
            <path
              d={`M${display[8][0] - 13} ${display[8][1] - 15}l30 27`}
              stroke="#879782"
              strokeWidth="8"
            />
          )}
          <Figure
            pose={phase === 1 ? visual.start : visual.end}
            ghost
            calf={exercise.id === 'calf'}
          />
          <Figure pose={display} calf={exercise.id === 'calf'} />
          {exercise.equipment === 'Dumbbells' &&
            hands.map((i) => (
              <g
                key={i}
                transform={`translate(${display[i][0]} ${display[i][1]})`}
                stroke="#586448"
                strokeWidth="5"
                strokeLinecap="round"
              >
                <path d="M-12 0H12M-10-7V7M10-7V7" />
              </g>
            ))}
          {(exercise.equipment === 'Barbell' || exercise.id === 'pulldown') && (
            <g stroke="#586448" strokeWidth="5" strokeLinecap="round">
              {exercise.id === 'squat' ? (
                <path d={`M${display[1][0] - 32} ${display[1][1]}h64m-60-9v18m56-18v18`} />
              ) : (
                <path
                  d={`M${display[4][0] - 14} ${display[4][1]}L${display[6][0] + 14} ${display[6][1]}M${display[4][0] - 10} ${display[4][1] - 8}v16M${display[6][0] + 10} ${display[6][1] - 8}v16`}
                />
              )}
            </g>
          )}
          {['legcurl', 'extension'].includes(exercise.id) && (
            <circle cx={display[8][0]} cy={display[8][1] - 8} r="9" fill="#879782" />
          )}
        </svg>
        <div className="movement-legend">
          <span /> Current position <span /> Other position
        </div>
      </div>
      <div className="movement-controls">
        <button
          type="button"
          className="movement-play"
          onClick={() => {
            setFrozen(playing);
            setPlaying(!playing);
          }}
          aria-label={playing ? 'Pause demonstration' : 'Play demonstration'}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />} {playing ? 'Pause' : 'Play demo'}
        </button>
        <button
          type="button"
          className="movement-speed"
          aria-pressed={slow}
          onClick={() => setSlow(!slow)}
        >
          {slow ? '0.5× speed' : '1× speed'}
        </button>
        <button
          type="button"
          className="movement-reset"
          aria-label="Restart demonstration"
          onClick={() => select(0)}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="movement-phases" role="group" aria-label="Movement stages">
        {visual.labels.map((label, i) => (
          <button
            type="button"
            key={i}
            aria-label={`0${i + 1} ${label}`}
            aria-pressed={phase === i}
            onClick={() => select(i)}
          >
            <span>0{i + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="movement-cue" aria-live={playing ? 'off' : 'polite'}>
        <span>COACH’S NOTE</span>
        {visual.cues[phase]}
      </p>
      <p className="movement-disclaimer">
        Simplified positions. Adapt equipment and range using the setup below.
        {reduced ? ' Reduced motion is on; playback shows still positions.' : ''}
      </p>
    </section>
  );
}
