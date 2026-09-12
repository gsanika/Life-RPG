const MILESTONES = [
  { at: 3, label: '3-Day Spark' },
  { at: 7, label: '7-Day Warrior' },
  { at: 14, label: '14-Day Vanguard' },
  { at: 30, label: '30-Day Legend' },
];

export default function StreakBadge({ streak }) {
  const current = streak?.current || 0;

  return (
    <div className="panel">
      <p className="panel-title">CONSISTENCY</p>
      <div className="streak-flame">🔥</div>
      <div className="streak-num">{current}</div>
      <p className="streak-caption">day streak · best {streak?.longest || 0}</p>

      {MILESTONES.map((m) => (
        <div key={m.at} className={`milestone-row${current >= m.at ? ' hit' : ''}`}>
          <span>{m.label}</span>
          <span>{current >= m.at ? '✓' : `${m.at}d`}</span>
        </div>
      ))}
    </div>
  );
}
