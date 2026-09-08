import { useState } from 'react';
import { BookOpen, Search, Dumbbell, ArrowUpRight } from 'lucide-react';
import { exercises, exerciseById } from '../data/exercises';
import { Modal, Empty } from './UI';
export function ExerciseGuide({ id, onClose }: { id: string; onClose: () => void }) {
  const [current, setCurrent] = useState(id);
  const e = exerciseById(current);
  return (
    <Modal title={e.name} onClose={onClose}>
      <div className="guide-tags">
        <span>{e.muscle}</span>
        <span>{e.equipment}</span>
        <span>{e.difficulty}</span>
      </div>
      <p className="muted">Also works: {e.secondary}</p>
      <div className="guide-intro">
        <BookOpen size={24} />
        <p>Move with intention. Use a range that feels controlled and comfortable for your body.</p>
      </div>
      <h3 className="form-section">Set yourself up</h3>
      <p>{e.setup}</p>
      <h3 className="form-section">The movement</h3>
      <ol className="steps">
        {e.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <h3 className="form-section">Coach’s cues</h3>
      <ul className="cue-list">
        {e.cues.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <h3 className="form-section">Common mistakes</h3>
      <p>{e.mistakes}</p>
      <div className="notice">
        Stop if you feel sharp pain, unusual dizziness, chest pain, or loss of control. Seek
        appropriate professional care for concerning symptoms.
      </div>
      {e.mediaUrl && (
        <a className="outline" href={e.mediaUrl} target="_blank" rel="noreferrer">
          View demonstration
          <ArrowUpRight size={16} />
        </a>
      )}
      <h3 className="form-section">Explore alternatives</h3>
      <div className="chips">
        {e.alternatives.map((id) => (
          <button className="chip" key={id} onClick={() => setCurrent(id)}>
            {exerciseById(id).name}
          </button>
        ))}
      </div>
      <p className="footnote">
        Choose a lighter load, assistance, or shorter controlled range to make this easier. Add
        resistance gradually when the current version is consistently comfortable.
      </p>
    </Modal>
  );
}
export default function Library() {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('All muscles');
  const [equipment, setEquipment] = useState('All equipment');
  const [difficulty, setDifficulty] = useState('All levels');
  const [pattern, setPattern] = useState('All patterns');
  const [type, setType] = useState('All types');
  const [guide, setGuide] = useState<string | null>(null);
  const filtered = exercises.filter(
    (e) =>
      `${e.name} ${e.muscle} ${e.secondary}`.toLowerCase().includes(search.toLowerCase()) &&
      (muscle === 'All muscles' || e.muscle === muscle) &&
      (equipment === 'All equipment' || e.equipment === equipment) &&
      (difficulty === 'All levels' || e.difficulty === difficulty) &&
      (pattern === 'All patterns' || e.pattern === pattern) &&
      (type === 'All types' || e.compound === (type === 'Compound')),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KNOW YOUR MOVEMENT</div>
          <h1>
            Exercise library<span className="lime-dot">.</span>
          </h1>
          <p>Better technique. More confidence. Every rep.</p>
        </div>
        <span className="date-chip">{exercises.length} exercise guides</span>
      </div>
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search exercises"
            placeholder="Find an exercise or muscle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Muscle group"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
        >
          {['All muscles', ...new Set(exercises.map((e) => e.muscle))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label="Equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        >
          {['All equipment', ...new Set(exercises.map((e) => e.equipment))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {['All levels', 'Beginner', 'Intermediate', 'Advanced'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label="Movement pattern"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        >
          {['All patterns', ...new Set(exercises.map((e) => e.pattern))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select aria-label="Exercise type" value={type} onChange={(e) => setType(e.target.value)}>
          {['All types', 'Compound', 'Isolation'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="exercise-grid">
        {filtered.map((e) => (
          <button className="card library-card" key={e.id} onClick={() => setGuide(e.id)}>
            <div className={`exercise-symbol muscle-${e.muscle.toLowerCase()}`}>
              <Dumbbell size={30} strokeWidth={1.4} />
              <span>{e.pattern}</span>
            </div>
            <span className="eyebrow">
              {e.muscle} · {e.difficulty}
            </span>
            <h3>{e.name}</h3>
            <div className="library-bottom">
              <span>{e.equipment}</span>
              <ArrowUpRight size={19} />
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="No matching movements"
          description="Try another muscle group or clear your search."
        />
      )}
      {guide && <ExerciseGuide id={guide} onClose={() => setGuide(null)} />}
    </>
  );
}
