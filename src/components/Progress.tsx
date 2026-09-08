import { useState } from 'react';
import { Camera, Plus, Target, TrendingUp, Trophy, X } from 'lucide-react';
import { useApp, displayWeight, fromDisplayWeight } from '../lib/context';
import { dateBefore, estimatedMax, today, uid, volume } from '../lib/engine';
import { exerciseById } from '../data/exercises';
import { supabase } from '../lib/storage';
import { Empty, Modal, SectionTitle } from './UI';
import type { Measurement, Photo } from '../lib/types';
function Chart({ values, labels, unit }: { values: number[]; labels: string[]; unit: string }) {
  if (!values.length)
    return (
      <Empty
        title="Your trend starts with one check-in"
        description="Log your measurements to see your progress over time."
      />
    );
  const min = Math.min(...values) - 1,
    max = Math.max(...values) + 1;
  const x = (i: number) => 50 + i * (610 / Math.max(1, values.length - 1));
  const y = (v: number) => 180 - ((v - min) / (max - min)) * 150;
  const path = values.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ');
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Progress chart: ${values.map((v, i) => `${labels[i]}: ${v} ${unit}`).join(', ')}`}
    >
      <svg viewBox="0 0 700 230">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b6d77c" stopOpacity=".3" />
            <stop offset="100%" stopColor="#b6d77c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="50"
              x2="665"
              y1={30 + i * 50}
              y2={30 + i * 50}
              stroke="var(--line)"
              strokeDasharray="3 4"
            />
            <text x="3" y={34 + i * 50} fill="var(--muted)" fontSize="11">
              {(max - ((max - min) * i) / 3).toFixed(1)}
            </text>
          </g>
        ))}
        <path d={`${path} L ${x(values.length - 1)} 185 L 50 185 Z`} fill="url(#chartFill)" />
        <path d={path} fill="none" stroke="#8cae54" strokeWidth="3" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r="4"
            fill="var(--surface)"
            stroke="#8cae54"
            strokeWidth="2"
          >
            <title>
              {labels[i]}: {v} {unit}
            </title>
          </circle>
        ))}
        {labels.map(
          (l, i) =>
            (i === 0 || i === labels.length - 1 || i === Math.floor(labels.length / 2)) && (
              <text key={i} x={x(i)} y="218" textAnchor="middle" fill="var(--muted)" fontSize="11">
                {l}
              </text>
            ),
        )}
      </svg>
    </div>
  );
}
export default function Progress() {
  const { state, setState, notify, userId } = useApp();
  const [range, setRange] = useState(90);
  const [log, setLog] = useState<Measurement | null>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewPhoto, setViewPhoto] = useState<{ url: string; caption: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState<Photo | null>(null);
  const [metric, setMetric] = useState<'weight' | 'waist' | 'chest' | 'arms' | 'thighs' | 'hips'>(
    'weight',
  );
  const points = state.measurements
    .filter((m) => m.date >= dateBefore(range) && m[metric] !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date));
  const records = new Map<string, { weight: number; max: number; reps: number }>();
  state.workouts.forEach((w) =>
    w.exercises.forEach((e) =>
      e.sets
        .filter((s) => s.done && s.weight > 0)
        .forEach((s) => {
          const old = records.get(e.exerciseId) ?? { weight: 0, max: 0, reps: 0 };
          records.set(e.exerciseId, {
            weight: Math.max(old.weight, s.weight),
            max: Math.max(old.max, estimatedMax(s.weight, s.reps)),
            reps:
              s.weight >= old.weight
                ? Math.max(s.reps, s.weight === old.weight ? old.reps : 0)
                : old.reps,
          });
        }),
    ),
  );
  const maxVolume = Math.max(0, ...state.workouts.map(volume));
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!log) return;
    setState((s) => {
      const measurements = [...s.measurements.filter((m) => m.date !== log.date), log].sort(
        (a, b) => a.date.localeCompare(b.date),
      );
      return { ...s, measurements, profile: { ...s.profile, weight: measurements.at(-1)!.weight } };
    });
    setLog(null);
    notify('Check-in saved. Progress is more than a number.');
  }
  async function savePhoto() {
    if (!photoFile) return;
    setBusy(true);
    setError('');
    try {
      if (!photoFile.type.startsWith('image/') || photoFile.size > 5 * 1024 * 1024)
        throw Error('Choose an image smaller than 5 MB.');
      const id = uid();
      let path = '';
      if (userId && supabase) {
        path = `${userId}/${id}`;
        const { error } = await supabase.storage
          .from('progress-photos')
          .upload(path, photoFile, { contentType: photoFile.type });
        if (error) throw error;
      } else {
        if (photoFile.size > 800000)
          throw Error(
            'Demo photos must be smaller than 800 KB to fit device storage. Connect an account for larger photos.',
          );
        path = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
      }
      setState((s) => ({ ...s, photos: [...s.photos, { id, date: today(), path, caption }] }));
      setPhotoModal(false);
      setPhotoFile(null);
      setCaption('');
      notify('Progress photo saved privately.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function openPhoto(p: Photo) {
    if (p.path.startsWith('data:')) {
      setViewPhoto({ url: p.path, caption: p.caption });
      return;
    }
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from('progress-photos')
      .createSignedUrl(p.path, 300);
    if (error) {
      notify('Could not load this photo. Please try again.');
      return;
    }
    setViewPhoto({ url: data.signedUrl, caption: p.caption });
  }
  async function deletePhoto() {
    if (!removePhoto) return;
    setBusy(true);
    if (!removePhoto.path.startsWith('data:') && supabase) {
      const { error } = await supabase.storage.from('progress-photos').remove([removePhoto.path]);
      if (error) {
        notify('Could not delete photo. Try again.');
        setBusy(false);
        return;
      }
    }
    setState((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== removePhoto.id) }));
    setRemovePhoto(null);
    setBusy(false);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">LOOK HOW FAR YOU’VE COME</div>
          <h1>
            Every bit counts<span className="lime-dot">.</span>
          </h1>
          <p>See the bigger picture, beyond any single day.</p>
        </div>
        <button
          className="primary"
          onClick={() => setLog({ id: uid(), date: today(), weight: state.profile.weight })}
        >
          <Plus size={17} />
          Log check-in
        </button>
      </div>
      <div className="progress-stats">
        <section className="card">
          <span className="stat-label">
            Current weight
            <TrendingUp size={18} />
          </span>
          <div className="stat-value">
            {displayWeight(state.profile.weight, state.units)}
            <span>{state.units}</span>
          </div>
          <span className="muted">
            Target: {displayWeight(state.profile.targetWeight, state.units)} {state.units}
          </span>
        </section>
        <section className="card">
          <span className="stat-label">
            Sessions in the bank
            <DumbbellIcon />
          </span>
          <div className="stat-value">
            {state.workouts.length}
            <span>workouts</span>
          </div>
          <span className="muted">Every one is a step forward</span>
        </section>
        <section className="card">
          <span className="stat-label">
            Highest session volume
            <Trophy size={18} />
          </span>
          <div className="stat-value">
            {Math.round(displayWeight(maxVolume, state.units)).toLocaleString()}
            <span>{state.units}</span>
          </div>
          <span className="muted">Weight × reps across all sets</span>
        </section>
      </div>
      <section className="card chart-card">
        <div className="section-title">
          <h2>Your journey, in perspective</h2>
          <div className="segmented">
            {[30, 90, 365].map((n) => (
              <button key={n} className={range === n ? 'selected' : ''} onClick={() => setRange(n)}>
                {n === 365 ? '1Y' : `${n}D`}
              </button>
            ))}
          </div>
        </div>
        <select
          aria-label="Measurement to chart"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
        >
          {['weight', 'waist', 'chest', 'arms', 'thighs', 'hips'].map((m) => (
            <option value={m} key={m}>
              {m[0].toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <Chart
          values={points.map((p) =>
            metric === 'weight' ? displayWeight(p.weight, state.units) : p[metric]!,
          )}
          labels={points.map((p) =>
            new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          )}
          unit={metric === 'weight' ? state.units : 'cm'}
        />
        <p className="footnote">
          Daily fluctuations are normal. Look for trends over several weeks, alongside strength,
          energy, and how you feel.
        </p>
      </section>
      <SectionTitle title="Your strongest moments" />
      <div className="records-grid">
        {records.size ? (
          [...records.entries()]
            .sort((a, b) => b[1].max - a[1].max)
            .slice(0, 6)
            .map(([id, r]) => (
              <div className="card record-card" key={id}>
                <span className="icon-tile trophy">
                  <Trophy size={23} />
                </span>
                <div>
                  <span className="eyebrow">PERSONAL BEST</span>
                  <h3>{exerciseById(id).name}</h3>
                  <strong>
                    {displayWeight(r.weight, state.units)}{' '}
                    <small>
                      {state.units} × {r.reps} reps
                    </small>
                  </strong>
                  <p>
                    Estimated 1RM: {displayWeight(r.max, state.units)} {state.units}
                  </p>
                </div>
              </div>
            ))
        ) : (
          <div className="card">
            <Empty
              title="Your first record is waiting"
              description="Log a weighted set to start tracking your strength."
            />
          </div>
        )}
      </div>
      <div className="section-title">
        <h2>Progress photos</h2>
        <button
          className="text-button"
          onClick={() => {
            setPhotoModal(true);
            setError('');
          }}
        >
          <Camera size={16} />
          Add photo
        </button>
      </div>
      <div className="card photo-section">
        {state.photos.length ? (
          <div className="photo-grid">
            {state.photos.map((p) => (
              <div className="photo-tile" key={p.id}>
                <button onClick={() => void openPhoto(p)}>
                  <Camera size={28} />
                  <strong>{p.caption || 'Progress check-in'}</strong>
                  <small>{p.date}</small>
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete progress photo"
                  onClick={() => setRemovePhoto(p)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="A different way to see your progress"
            description="Optional photos stay on this device in demo mode, or in private storage when you connect an account."
            action="Add a progress photo"
            onClick={() => {
              setPhotoModal(true);
              setError('');
            }}
          />
        )}
      </div>
      <details className="card measurements-history">
        <summary>Measurement history · {state.measurements.length} check-ins</summary>
        {[...state.measurements].reverse().map((m) => (
          <div className="measurement-row" key={m.id}>
            <span>{m.date}</span>
            <strong>
              {displayWeight(m.weight, state.units)} {state.units}
            </strong>
            <button className="text-button" onClick={() => setLog(m)}>
              Edit
            </button>
          </div>
        ))}
      </details>
      {log && (
        <Modal title="Check in with yourself" onClose={() => setLog(null)}>
          <form onSubmit={save}>
            <label className="field">
              Date
              <input
                required
                type="date"
                max={today()}
                value={log.date}
                onChange={(e) => setLog({ ...log, date: e.target.value })}
              />
            </label>
            <label className="field">
              Weight ({state.units})
              <input
                required
                type="number"
                step="0.1"
                min={state.units === 'kg' ? 30 : 66}
                max={state.units === 'kg' ? 350 : 771}
                value={displayWeight(log.weight, state.units)}
                onChange={(e) =>
                  setLog({ ...log, weight: fromDisplayWeight(Number(e.target.value), state.units) })
                }
              />
            </label>
            <h3 className="form-section">Body measurements · optional</h3>
            <div className="form-grid">
              {(['waist', 'chest', 'arms', 'thighs', 'hips'] as const).map((k) => (
                <label className="field" key={k}>
                  {k[0].toUpperCase() + k.slice(1)} (cm)
                  <input
                    type="number"
                    min="1"
                    max="300"
                    step="0.1"
                    value={log[k] ?? ''}
                    onChange={(e) =>
                      setLog({ ...log, [k]: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="footnote">
              One check-in per date. Saving again updates that day’s measurements.
            </p>
            <button className="primary full" type="submit">
              Save check-in
              <CheckIcon />
            </button>
          </form>
        </Modal>
      )}
      {photoModal && (
        <Modal title="Capture your progress" onClose={() => setPhotoModal(false)}>
          <label className="field">
            Choose a photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="field">
            Caption (optional)
            <input
              maxLength={100}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Week 4 · feeling stronger"
            />
          </label>
          <p className="footnote">
            {userId
              ? 'Stored in a private bucket. Viewing links expire after five minutes.'
              : 'Demo photos are saved only in this browser. Use a photo under 800 KB.'}
          </p>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button
            className="primary full"
            disabled={!photoFile || busy}
            onClick={() => void savePhoto()}
          >
            {busy ? 'Saving…' : 'Save photo'}
          </button>
        </Modal>
      )}
      {viewPhoto && (
        <Modal title="Your progress" onClose={() => setViewPhoto(null)}>
          <img
            className="progress-photo"
            src={viewPhoto.url}
            alt={viewPhoto.caption || 'Private progress photo'}
          />
          <p>{viewPhoto.caption}</p>
        </Modal>
      )}
      {removePhoto && (
        <Modal title="Delete this photo?" onClose={() => setRemovePhoto(null)}>
          <p>This permanently removes the photo from your progress record and private storage.</p>
          <div className="button-row">
            <button className="outline" onClick={() => setRemovePhoto(null)}>
              Keep photo
            </button>
            <button className="danger-button" disabled={busy} onClick={() => void deletePhoto()}>
              Delete photo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function DumbbellIcon() {
  return <Target size={18} />;
}
function CheckIcon() {
  return <Plus size={17} />;
}
