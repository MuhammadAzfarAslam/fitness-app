import { useId, useState } from 'react';
import { ArrowDown, Check, Eye, Hand, Ruler } from 'lucide-react';
import type { Exercise } from '../lib/types';
import { techniques, pressGripIds } from '../data/technique';
import { movementVisuals } from '../data/movementVisuals';
import MovementDemo, { Figure } from './MovementDemo';

function GripDiagram({ neutral }: { neutral: boolean }) {
  return (
    <svg
      viewBox="0 0 360 265"
      role="img"
      aria-label={
        neutral
          ? 'View from above the chest: handles run head to feet, palms face each other'
          : 'View from above the chest: handles run across the body, palms face toward the feet'
      }
    >
      <text x="180" y="18" textAnchor="middle">
        HEAD ↑
      </text>
      <rect x="139" y="33" width="82" height="206" rx="22" fill="#e3e9dc" />
      <circle cx="180" cy="58" r="21" fill="#738278" />
      <path d="M143 104Q180 86 217 104L207 211H153Z" fill="#cce89b" />
      <text x="180" y="196" textAnchor="middle">
        CHEST
      </text>
      {[90, 270].map((x, i) => (
        <g key={x}>
          <path
            d={`M${i === 0 ? 148 : 212} 113L${x} 145`}
            stroke="#738278"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <g transform={`translate(${x} 131) rotate(${neutral ? 90 : 0})`}>
            <path d="M-35 0H35" stroke="#243c32" strokeWidth="9" strokeLinecap="round" />
            <rect x="-40" y="-20" width="15" height="40" rx="5" fill="#243c32" />
            <rect x="25" y="-20" width="15" height="40" rx="5" fill="#243c32" />
            <rect
              x="-13"
              y="-11"
              width="26"
              height="23"
              rx="8"
              fill="#e6b88d"
              stroke="#886447"
              strokeWidth="2"
            />
            <path d="M-8-2H9M-8 4H9M-8 10H8" stroke="#886447" strokeWidth="1.5" />
            <path
              d="M-11-8Q-18 1-5 4"
              fill="none"
              stroke="#886447"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          {neutral ? (
            <path
              d={i === 0 ? 'M112 164h25m-7-6 7 6-7 6' : 'M248 164h-25m7-6-7 6 7 6'}
              fill="none"
              stroke="#567c28"
              strokeWidth="3"
            />
          ) : (
            <path d={`M${x} 164v29m-6-7 6 7 6-7`} fill="none" stroke="#567c28" strokeWidth="3" />
          )}
        </g>
      ))}
      <text x="180" y="255" textAnchor="middle">
        FEET ↓
      </text>
    </svg>
  );
}
function WristDiagram() {
  return (
    <svg
      viewBox="0 0 360 160"
      role="img"
      aria-label="Keep the dumbbell centered over a straight wrist and the elbow. Avoid bending the wrist backward."
    >
      <text x="90" y="18" textAnchor="middle">
        STACKED
      </text>
      <text x="272" y="18" textAnchor="middle">
        AVOID BENDING BACK
      </text>
      <path
        d="M90 129V64M270 129V87L296 65"
        stroke="#738278"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path d="M90 35V140" stroke="#648b35" strokeDasharray="4 4" />
      <path
        d="M55 51H125M55 38V64M125 38V64M270 51H330M270 38V64M330 38V64"
        stroke="#243c32"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="90" cy="64" r="9" fill="#e6b88d" />
      <circle cx="296" cy="65" r="9" fill="#e6b88d" />
      <path d="m74 144 8 7 14-16" fill="none" stroke="#567c28" strokeWidth="3" />
      <path d="m264 137 14 14m0-14-14 14" stroke="#ab654e" strokeWidth="3" />
    </svg>
  );
}
function PressAngles({ incline, wrists }: { incline: boolean; wrists: boolean }) {
  return (
    <div className="technique-diagrams">
      {incline && (
        <figure>
          <svg
            viewBox="0 0 360 180"
            role="img"
            aria-label="Low incline bench: the backrest is about 15 to 30 degrees above horizontal. The illustrated angle is 30 degrees."
          >
            <path
              d="M35 146H325M65 53L225 145H289M95 71V146M278 145V166"
              fill="none"
              stroke="#738278"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M130 145H225M158 145A67 67 0 0 1 167 111"
              fill="none"
              stroke="#648b35"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <text x="112" y="127">
              30° shown
            </text>
            <text x="220" y="50" textAnchor="middle">
              15–30°
            </text>
            <text x="220" y="71" textAnchor="middle">
              above horizontal
            </text>
          </svg>
          <figcaption>Bench side view · this app’s low incline variation</figcaption>
        </figure>
      )}
      <figure>
        <svg
          viewBox="0 0 360 225"
          role="img"
          aria-label="View from above: start with upper arms about 30 to 60 degrees away from the ribs, around 45 degrees shown. Avoid forcing elbows straight sideways into a T."
        >
          <circle cx="180" cy="29" r="17" fill="#738278" />
          <path d="M145 67H215L207 200H153Z" fill="#cce89b" />
          <path
            d="M145 72L99 118M215 72L261 118"
            stroke="#243c32"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path d="M145 72V150M215 72V150" stroke="#648b35" strokeDasharray="4 3" />
          <path
            d="M145 110A38 38 0 0 1 118 99M215 110A38 38 0 0 0 242 99"
            stroke="#648b35"
            fill="none"
            strokeWidth="2"
          />
          <text x="72" y="163">
            30–60°
          </text>
          <text x="245" y="163">
            30–60°
          </text>
          <text x="180" y="219" textAnchor="middle">
            Angle from ribs · 45° illustrated
          </text>
        </svg>
        <figcaption>
          Upper-arm position from above · a starting range, not a rigid target
        </figcaption>
      </figure>
      <figure hidden={!wrists}>
        <WristDiagram />
        <figcaption>Front view · wrist above elbow, handle over the palm</figcaption>
      </figure>
    </div>
  );
}
function ContactDiagram({
  exercise,
  alignment = false,
}: {
  exercise: Exercise;
  alignment?: boolean;
}) {
  const pose = movementVisuals[exercise.id].start;
  const feet = ['Legs', 'Cardio'].includes(exercise.muscle);
  const points = alignment ? [1, 2, 7, 9] : feet ? [8, 10] : [4, 6];
  return (
    <figure className="technique-contact">
      <svg
        viewBox="0 0 360 280"
        role="img"
        aria-label={`${exercise.name}: ${alignment ? 'highlighted shoulder, hip and knee landmarks' : 'highlighted hand or foot contact points'}. ${alignment ? techniques[exercise.id].alignment : techniques[exercise.id].grip}`}
      >
        <path d="M30 262H330" stroke="#d6dfd0" />
        <Figure pose={pose} />
        {points.map((i) => (
          <circle
            key={i}
            cx={pose[i][0]}
            cy={pose[i][1]}
            r="15"
            fill="none"
            stroke="#527aaa"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        ))}
      </svg>
      <figcaption>
        {movementVisuals[exercise.id].view} · blue rings mark{' '}
        {alignment ? 'alignment landmarks' : feet ? 'foot contacts' : 'hand positions'}
      </figcaption>
    </figure>
  );
}

export default function ExerciseTechnique({ exercise }: { exercise: Exercise }) {
  const [view, setView] = useState('Grip & setup');
  const [neutral, setNeutral] = useState(['db-press', 'skull'].includes(exercise.id));
  const detail = techniques[exercise.id];
  const uid = useId();
  const isPress = pressGripIds.includes(exercise.id);
  const chestPress = ['incline', 'db-press', 'db-bench', 'bench', 'pushup'].includes(exercise.id);
  const variants = ['incline', 'db-bench', 'ohp'].includes(exercise.id);
  const views = ['Grip & setup', 'Angles', 'Movement', 'Self-check'];
  return (
    <section className="technique-studio" aria-label={`${exercise.name} technique studio`}>
      <div className="technique-intro">
        <span className="eyebrow">LEARN EVERY DETAIL</span>
        <h3>Know the setup. Own the rep.</h3>
        <p>Explore hand position, body alignment and the full movement.</p>
      </div>
      <div className="technique-tabs" role="tablist" aria-label="Technique views">
        {views.map((v, i) => (
          <button
            key={v}
            id={`${uid}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={view === v}
            aria-controls={`${uid}-panel`}
            tabIndex={view === v ? 0 : -1}
            onClick={() => setView(v)}
            onKeyDown={(event) => {
              let n = i;
              if (event.key === 'ArrowRight') n = (i + 1) % 4;
              else if (event.key === 'ArrowLeft') n = (i + 3) % 4;
              else if (event.key === 'Home') n = 0;
              else if (event.key === 'End') n = 3;
              else return;
              event.preventDefault();
              setView(views[n]);
              document.getElementById(`${uid}-tab-${n}`)?.focus();
            }}
          >
            {
              [
                <Hand key="grip" size={15} />,
                <Ruler key="angles" size={15} />,
                <Eye key="movement" size={15} />,
                <Check key="check" size={15} />,
              ][i]
            }
            {v}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${views.indexOf(view)}`}
        tabIndex={0}
        className="technique-panel"
      >
        {view === 'Grip & setup' && (
          <>
            <h4>{isPress ? 'Which way do my palms face?' : 'Hands, feet & contact points'}</h4>
            <p>{detail.grip}</p>
            {isPress ? (
              <>
                {variants && (
                  <div className="grip-options" role="group" aria-label="Compare grip variations">
                    <button type="button" aria-pressed={!neutral} onClick={() => setNeutral(false)}>
                      Palms toward {exercise.id === 'ohp' ? 'front' : 'feet'}
                      <small>Default grip</small>
                    </button>
                    <button type="button" aria-pressed={neutral} onClick={() => setNeutral(true)}>
                      Palms facing each other<small>Neutral variation</small>
                    </button>
                  </div>
                )}
                <figure className="grip-figure">
                  <GripDiagram neutral={neutral} />
                  <figcaption>
                    {exercise.id === 'ohp'
                      ? 'Grip orientation reference only; shoulder press is performed seated upright.'
                      : 'Looking down at your chest from above.'}{' '}
                    Arrows show palm direction. This is a grip close-up; use Angles for arm
                    position.
                  </figcaption>
                </figure>
                <div className="technique-answer">
                  <strong>
                    {neutral
                      ? 'Handles run head-to-feet · palms face inward'
                      : 'Handles run across the body · palms face toward feet'}
                  </strong>
                  <p>
                    “Horizontal” or “vertical” depends on the camera. Use your palm direction as the
                    reference. Keep thumbs wrapped and wrists straight.
                  </p>
                </div>
              </>
            ) : (
              <ContactDiagram exercise={exercise} />
            )}
            <p className="technique-next">
              <ArrowDown size={15} /> Open Angles for joint position and equipment setup.
            </p>
          </>
        )}
        {view === 'Angles' && (
          <>
            <h4>Line up before you lift</h4>
            <p>{detail.alignment}</p>
            {chestPress ? (
              <PressAngles incline={exercise.id === 'incline'} wrists={exercise.id !== 'pushup'} />
            ) : (
              <ContactDiagram exercise={exercise} alignment />
            )}
            <div className="technique-answer">
              <strong>Where should I stop?</strong>
              <p>{detail.range}</p>
            </div>
            <p className="footnote">
              Angles are starting guides. Use a comfortable, controlled range; do not force your
              body to match a drawing.
            </p>
          </>
        )}
        {view === 'Movement' && (
          <>
            <MovementDemo exercise={exercise} />
            <div className="technique-answer">
              <strong>Range & direction</strong>
              <p>{detail.range}</p>
            </div>
            <h4>Breathing & control</h4>
            <ul className="cue-list">
              {exercise.cues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="footnote">
              The animation shows positions, not a prescribed rep speed. Palm orientation is
              explained in Grip & setup.
            </p>
            <h4>Finish the set safely</h4>
            <p>{detail.finish}</p>
          </>
        )}
        {view === 'Self-check' && (
          <>
            <h4>Before adding more weight</h4>
            <p>
              Try the movement unloaded or with a light load first. These are your own observations,
              not an automatic form assessment.
            </p>
            <div className="technique-checks">
              {[detail.grip, detail.alignment, detail.range].map((item, i) => (
                <label key={item}>
                  <input type="checkbox" />
                  <span>
                    <strong>
                      {
                        [
                          'My grip and contact points match',
                          'My setup stays stable',
                          'I can control the full rep',
                        ][i]
                      }
                    </strong>
                    {item}
                  </span>
                </label>
              ))}
            </div>
            <div className="technique-answer">
              <strong>If the movement breaks down</strong>
              <p>{exercise.mistakes}</p>
              <p>Reduce load or range and try again. Stop if the movement hurts.</p>
            </div>
            <h4>How to finish</h4>
            <p>{detail.finish}</p>
          </>
        )}
      </div>
      {exercise.id === 'incline' && (
        <p className="technique-source">
          Grip and wrist reference:{' '}
          <a
            href="https://www.acefitness.org/resources/everyone/exercise-library/25/incline-chest-press/"
            target="_blank"
            rel="noreferrer"
          >
            ACE exercise guide ↗
          </a>
          . Their bench-angle variation differs from this app’s low incline version.
        </p>
      )}
    </section>
  );
}
