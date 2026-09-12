import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client.js';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [weeklyXp, setWeeklyXp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/quests/history'), api.get('/character/analytics')]).then(([histRes, analyticsRes]) => {
      setLogs(histRes.data.logs);
      setWeeklyXp(
        analyticsRes.data.weeklyXp.map((d) => ({
          day: new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' }),
          xp: d.xp,
        }))
      );
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-screen">Reading the chronicle…</div>;

  return (
    <div className="page">
      <div className="quest-list-head">
        <h2>Chronicle</h2>
      </div>

      <div className="chart-wrap">
        <p className="panel-title">XP EARNED · LAST 7 DAYS</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyXp}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3150" />
            <XAxis dataKey="day" stroke="#8d8fb0" fontSize={12} />
            <YAxis stroke="#8d8fb0" fontSize={12} />
            <Tooltip contentStyle={{ background: '#20223a', border: '1px solid #2e3150', borderRadius: 8 }} />
            <Bar dataKey="xp" fill="#8b7ff0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <p className="panel-title">QUEST LOG</p>
        {logs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No completions yet — go earn some XP.</p>}
        {logs.map((log) => (
          <div className="history-row" key={log._id}>
            <div>
              <div>{log.questTitle}</div>
              <div className="history-date">{new Date(log.completedAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="reward-xp">+{log.xpEarned} XP</span>{' '}
              <span className="reward-gold">+{log.goldEarned} 🪙</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
