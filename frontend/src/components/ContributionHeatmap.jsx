import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function createHeatmap(logs = []) {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(end.getDate() - 364);

  const dayCounts = new Map();
  for (const log of logs) {
    const stamp = startOfDay(new Date(log.completedAt));
    if (stamp < start || stamp > end) continue;
    const key = stamp.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  const allDates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    allDates.push({ date: new Date(cursor), count: dayCounts.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { allDates, total: logs.length };
}

export default function ContributionHeatmap() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/quests/history')
      .then((res) => {
        setLogs(res.data.logs || []);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const { allDates, total } = useMemo(() => createHeatmap(logs), [logs]);

  const monthLabels = MONTH_NAMES.map((m, i) => ({
    month: m,
    index: i,
  }));

  const intensityColor = (value) => {
    if (value === 0) return 'var(--empty-day)';
    if (value <= 1) return 'var(--level-1)';
    if (value <= 2) return 'var(--level-2)';
    if (value <= 4) return 'var(--level-3)';
    return 'var(--level-4)';
  };

  const gridDates = [];
  for (let i = 0; i < 53; i += 1) {
    const week = [];
    for (let d = 0; d < 7; d += 1) {
      const idx = i * 7 + d;
      if (idx < allDates.length) week.push(allDates[idx]);
    }
    gridDates.push(week);
  }

  return (
    <section className="contribution-panel panel">
      <div className="contribution-frame">
        <div className="contribution-head">
          <div className="contribution-title-block">
            <span className="contribution-total">{Math.max(0, total)} contributions in the last year</span>
          </div>
          <div className="contribution-actions">
            <button className="btn btn-chip">Contribution settings ▾</button>
            <button className="btn btn-chip active-year">2026</button>
          </div>
        </div>

        <div className="contribution-month-strip">
          {monthLabels.map((label, idx) => {
            const monthStart = Math.max(0, new Date(2026, idx, 1).getMonth());
            return (
              <span className="month-label" key={label.month}>
                {label.month}
              </span>
            );
          })}
        </div>

        <div className="contribution-body">
          <div className="contribution-days">
            {DAY_NAMES.map((day) => (
              <span className="day-label" key={day}>{day}</span>
            ))}
          </div>
          <div className="contribution-grid">
            {gridDates.map((week, weekIndex) => (
              <div className="contribution-week" key={weekIndex}>
                {week.map((entry, idx) => (
                  <span
                    key={`${entry.date.toISOString()}-${weekIndex}-${idx}`}
                    className="contribution-cell"
                    style={{ background: intensityColor(entry.count) }}
                    title={`${entry.date.toLocaleDateString()} ${entry.count} quests`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="contribution-footer">
          <span className="contribution-learn">Learn how we count contributions</span>
          <div className="contribution-legend">
            <span className="legend-label">Less</span>
            <span className="legend-cell empty" />
            <span className="legend-cell one" />
            <span className="legend-cell two" />
            <span className="legend-cell three" />
            <span className="legend-cell four" />
            <span className="legend-label">More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
