import { sessionCoverage } from '../lib/coverage';
export default function SessionCoverage({ ids, focus }: { ids: string[]; focus?: string }) {
  const coverage = sessionCoverage(ids, focus);
  if (!coverage.length) return null;
  return (
    <section className="session-coverage" aria-label="Session coverage">
      <h4>Session coverage</h4>
      <ul>
        {coverage.map((c) => (
          <li key={`${c.muscle}-${c.label}`}>
            <span>{c.label}</span>
            <strong>{c.covered ? 'Included' : 'Not selected'}</strong>
          </li>
        ))}
      </ul>
      {coverage.some((c) => !c.covered) && (
        <p className="notice">
          Some roles are not selected. Review your equipment, exclusions and exercise count, or
          cover them in another session this week.
        </p>
      )}
      <p className="footnote">
        Emphasis overlaps. This is a planning checklist, not proof that every muscle is fully
        trained. Use your weekly plan, available time and recovery to decide what belongs in this
        session.
      </p>
      {coverage.some((c) => c.muscle === 'Chest') && (
        <p className="footnote">
          “Inner chest” is not a separate muscle to isolate. Fly movements bring the arms together
          and work the chest. Flat pressing also trains sternocostal (middle/lower) fibers; a
          separate lower-angle exercise is optional, not a requirement for growth.{' '}
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/"
            target="_blank"
            rel="noreferrer"
          >
            Chest angle research ↗
          </a>
        </p>
      )}
    </section>
  );
}
