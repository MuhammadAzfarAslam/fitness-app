import { useRef, useState } from 'react';
import { Camera, Droplets, Flame, Leaf, Plus, Trash2, Utensils } from 'lucide-react';
import { useApp } from '../lib/context';
import { nutritionTargets, today, uid } from '../lib/engine';
import { analyzeFood } from '../lib/storage';
import { Empty, Meter, Modal, Ring, SectionTitle } from './UI';
import type { Meal } from '../lib/types';
const blankMeal = (): Meal => ({
  id: uid(),
  date: today(),
  category: 'Breakfast',
  name: '',
  portion: '1 serving',
  quantity: 1,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});
export default function Nutrition() {
  const { state, setState, notify, userId } = useApp();
  const [date, setDate] = useState(today());
  const [meal, setMeal] = useState<Meal | null>(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remove, setRemove] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = nutritionTargets(state.profile);
  const meals = state.meals.filter((m) => m.date === date);
  const total = (key: 'calories' | 'protein' | 'carbs' | 'fat') =>
    meals.reduce((n, m) => n + m[key] * m.quantity, 0);
  const calories = total('calories');
  const glasses = state.water.date === today() ? state.water.glasses : 0;
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!meal) return;
    if (!meal.name.trim()) {
      setError('Give your meal a name.');
      return;
    }
    setState((s) => ({
      ...s,
      meals: [...s.meals.filter((m) => m.id !== meal.id), { ...meal, name: meal.name.trim() }],
    }));
    setMeal(null);
    setPhoto('');
    setError('');
    notify('Meal saved. A little more insight into your day.');
  }
  async function readPhoto(file: File) {
    setError('');
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.onerror = () => setError('Could not read this image. Try another file.');
    reader.readAsDataURL(file);
  }
  async function estimate() {
    if (!userId) {
      setError(
        'Photo estimation needs a connected account and AI service. You can still enter the food and nutrition values below.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await analyzeFood(photo);
      if (
        !result ||
        typeof result.name !== 'string' ||
        !['calories', 'protein', 'carbs', 'fat'].every(
          (k) => Number.isFinite(result[k]) && result[k] >= 0,
        )
      )
        throw Error('The estimate could not be read. Please enter nutrition manually.');
      setMeal((m) =>
        m
          ? {
              ...m,
              name: result.name,
              portion: result.portion || 'Estimated serving',
              calories: result.calories,
              protein: result.protein,
              carbs: result.carbs,
              fat: result.fat,
            }
          : m,
      );
      if (result.uncertainty) setError(`Estimate note: ${result.uncertainty}`);
      notify('Estimate ready. Check the food and portion before saving.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed. Enter nutrition manually.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FUEL THE WAY YOU FEEL</div>
          <h1>
            Good food. Better days<span className="lime-dot">.</span>
          </h1>
          <p>Simple tracking, useful insights. No perfection required.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setMeal({ ...blankMeal(), date });
            setPhotoMode(false);
            setError('');
          }}
        >
          <Plus size={17} />
          Log a meal
        </button>
      </div>
      <div className="nutrition-top">
        <section className="card calorie-card">
          <SectionTitle title="Your daily fuel" />
          <Ring value={calories} max={target.calories} size={175}>
            <Flame size={24} />
            <strong>{Math.round(calories).toLocaleString()}</strong>
            <small>of {target.calories.toLocaleString()} kcal</small>
          </Ring>
          <p>
            {Math.max(0, target.calories - calories).toLocaleString()} kcal to your estimated target
          </p>
          <input
            type="date"
            aria-label="Nutrition log date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </section>
        <section className="card macro-card">
          <SectionTitle title="Make every meal count" />
          <div className="macro-large">
            {(['protein', 'carbs', 'fat'] as const).map((key, i) => (
              <div key={key}>
                <div className="spread">
                  <strong>{key[0].toUpperCase() + key.slice(1)}</strong>
                  <span>
                    {Math.round(total(key))}
                    <small> / {target[key]} g</small>
                  </span>
                </div>
                <Meter
                  value={total(key)}
                  max={target[key]}
                  color={['var(--purple)', 'var(--orange)', 'var(--green)'][i]}
                />
              </div>
            ))}
          </div>
          <div className="coach-note">
            <Leaf size={19} />
            <p>
              {total('protein') < target.protein
                ? `You’re ${Math.round(target.protein - total('protein'))} g from your estimated protein target. A protein-rich food with your next meal can help.`
                : 'You’ve reached your estimated protein target. Keep meals varied and enjoy the rest of your day.'}
            </p>
          </div>
          <p className="footnote">
            Targets are starting estimates based on your profile, not exact requirements. Review
            trends over time. This calculator is for generally healthy adults.
          </p>
        </section>
      </div>
      <div className="section-title meal-heading">
        <h2>On your plate</h2>
        <button
          className="text-button"
          onClick={() => {
            setMeal({ ...blankMeal(), date });
            setPhotoMode(true);
            setPhoto('');
            setError('');
          }}
        >
          <Camera size={16} />
          Add from photo
        </button>
      </div>
      {!meals.length ? (
        <div className="card">
          <Empty
            title="A fresh page for today"
            description="Log a meal to see your daily nutrition take shape."
            action="Add your first meal"
            onClick={() => {
              setMeal({ ...blankMeal(), date });
              setPhotoMode(false);
            }}
          />
        </div>
      ) : (
        <div className="meal-list">
          {meals.map((m) => (
            <div className="card meal-card" key={m.id}>
              <span className={`meal-icon meal-${m.category.toLowerCase()}`}>
                <Utensils size={23} />
              </span>
              <button
                className="meal-description"
                onClick={() => {
                  setMeal(m);
                  setPhotoMode(false);
                  setError('');
                }}
              >
                <span className="eyebrow">{m.category}</span>
                <h3>{m.name}</h3>
                <p>
                  {m.quantity} × {m.portion}
                </p>
                <span className="meal-macros">
                  P {Math.round(m.protein * m.quantity)} g <span>·</span> C{' '}
                  {Math.round(m.carbs * m.quantity)} g <span>·</span> F{' '}
                  {Math.round(m.fat * m.quantity)} g
                </span>
              </button>
              <div className="meal-calories">
                <strong>{Math.round(m.calories * m.quantity)}</strong>
                <small>kcal</small>
              </div>
              <button
                className="icon-button"
                aria-label={`Delete ${m.name}`}
                onClick={() => setRemove(m.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="card water-card">
        <span className="icon-tile water-icon">
          <Droplets size={24} />
        </span>
        <div>
          <h3>A little hydration check-in</h3>
          <p>
            {glasses} glasses logged today · approximately {glasses * 250} ml
          </p>
        </div>
        <button
          className="outline"
          onClick={() => {
            setState((s) => ({ ...s, water: { date: today(), glasses: glasses + 1 } }));
            notify('One glass added.');
          }}
        >
          <Plus size={17} />
          250 ml
        </button>
        {glasses > 0 && (
          <button
            className="text-button"
            onClick={() =>
              setState((s) => ({
                ...s,
                water: { date: today(), glasses: Math.max(0, glasses - 1) },
              }))
            }
          >
            Undo
          </button>
        )}
      </div>
      <details className="card estimates">
        <summary>How your estimates are calculated</summary>
        <p>
          Mifflin–St Jeor BMR: {target.bmr} kcal. Activity-adjusted maintenance:{' '}
          {target.maintenance} kcal. Goal adjustment: {target.calories - target.maintenance} kcal.
          Protein starts at 1.6 g/kg, with about 28% of calories from fat and the remaining calories
          from carbohydrates.
        </p>
        <p>
          Age, height, weight, activity, and the selected calculation parameter inform this
          estimate. “Prefer not to say” uses the midpoint of the sex coefficients. These estimates
          are unsuitable for pregnancy, breastfeeding, eating disorder treatment, or medical
          nutrition needs; seek individualized guidance.
        </p>
        <a
          href="https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner"
          target="_blank"
          rel="noreferrer"
        >
          Learn about energy estimates from NIDDK ↗
        </a>
      </details>
      {meal && (
        <Modal
          title={photoMode ? 'A picture of your plate' : 'Log a little nourishment'}
          onClose={() => {
            setMeal(null);
            setPhoto('');
            setError('');
          }}
        >
          <form onSubmit={save}>
            {photoMode && (
              <>
                <input
                  ref={fileRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void readPhoto(f);
                  }}
                />
                <button
                  className="photo-upload"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                >
                  {photo ? (
                    <img src={photo} alt="Your food, ready for review" />
                  ) : (
                    <>
                      <Camera size={30} />
                      <strong>Take or choose a photo</strong>
                      <span>JPG, PNG or WebP · up to 5 MB</span>
                    </>
                  )}
                </button>
                <p className="footnote">
                  Photo nutrition is always an estimate. Check the food, portion, and all values
                  before saving. Your photo is sent to the AI provider only when you select
                  Estimate.
                </p>
                <button
                  className="outline full"
                  type="button"
                  disabled={!photo || busy}
                  onClick={() => void estimate()}
                >
                  {busy ? 'Estimating…' : 'Estimate nutrition'}
                </button>
              </>
            )}
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            <label className="field">
              Food or meal name
              <input
                required
                maxLength={100}
                value={meal.name}
                onChange={(e) => setMeal({ ...meal, name: e.target.value })}
                placeholder="e.g. Chicken and rice bowl"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Meal
                <select
                  value={meal.category}
                  onChange={(e) => setMeal({ ...meal, category: e.target.value })}
                >
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks', 'Supplements'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Date
                <input
                  required
                  type="date"
                  max={today()}
                  value={meal.date}
                  onChange={(e) => setMeal({ ...meal, date: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              Portion description
              <input
                required
                value={meal.portion}
                onChange={(e) => setMeal({ ...meal, portion: e.target.value })}
                placeholder="1 bowl or 100 g"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Quantity
                <input
                  required
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={meal.quantity}
                  onChange={(e) => setMeal({ ...meal, quantity: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                Calories per portion
                <input
                  required
                  type="number"
                  min="0"
                  max="10000"
                  value={meal.calories}
                  onChange={(e) => setMeal({ ...meal, calories: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="form-grid three">
              {(['protein', 'carbs', 'fat'] as const).map((k) => (
                <label className="field" key={k}>
                  {k[0].toUpperCase() + k.slice(1)} (g)
                  <input
                    required
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={meal[k]}
                    onChange={(e) => setMeal({ ...meal, [k]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            <p className="footnote">
              Enter nutrition per portion. Your quantity multiplies these values in daily totals.
            </p>
            <button className="primary full" type="submit">
              Save meal
              <Plus size={17} />
            </button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Remove this meal?" onClose={() => setRemove(null)}>
          <p>This entry will be removed from your nutrition log.</p>
          <div className="button-row">
            <button className="outline" onClick={() => setRemove(null)}>
              Keep meal
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== remove) }));
                setRemove(null);
              }}
            >
              Remove meal
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
