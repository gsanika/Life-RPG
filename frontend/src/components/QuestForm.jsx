import { useState } from 'react';
import { motion } from 'framer-motion';

export default function QuestForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('coding');
  const [attribute, setAttribute] = useState('intellect');
  const [difficulty, setDifficulty] = useState('medium');
  const [scale, setScale] = useState('daily');
  const [questType, setQuestType] = useState('learning');
  const [verification, setVerification] = useState('assessment');
  const [isBoss, setIsBoss] = useState(false);
  const [bossName, setBossName] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onCreate({ title, category, attribute, difficulty, scale, questType, verification, recurring, isBoss, bossName });
      setTitle('');
      setScale('daily');
      setQuestType('learning');
      setVerification('assessment');
      setIsBoss(false);
      setBossName('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="new-quest-form"
    >
      <div className="form-grid">
        <div>
          <label>Quest title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solve 2 DSA problems" required />
        </div>
        <div>
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="coding">Coding</option>
            <option value="fitness">Fitness</option>
            <option value="reading">Reading</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="social">Social</option>
            <option value="creative">Creative</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label>Quest type</label>
          <select value={questType} onChange={(e) => setQuestType(e.target.value)}>
            <option value="learning">Learning</option>
            <option value="coding">Coding</option>
            <option value="reading">Reading</option>
            <option value="fitness">Fitness</option>
            <option value="focus">Focus</option>
            <option value="skill">Skill</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label>Verification</label>
          <select value={verification} onChange={(e) => setVerification(e.target.value)}>
            <option value="assessment">Assessment</option>
            <option value="timer">Focus Timer</option>
            <option value="coding">Coding Proof</option>
            <option value="reading">Reading Proof</option>
            <option value="workout">Workout Proof</option>
            <option value="manual">Manual Finish</option>
          </select>
        </div>
        <div>
          <label>Trains attribute</label>
          <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
            <option value="intellect">Intellect</option>
            <option value="strength">Strength</option>
            <option value="wisdom">Wisdom</option>
            <option value="discipline">Discipline</option>
            <option value="charisma">Charisma</option>
            <option value="creativity">Creativity</option>
          </select>
        </div>
        <div>
          <label>Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy · 50 XP</option>
            <option value="medium">Medium · 100 XP</option>
            <option value="hard">Hard · 150 XP</option>
            <option value="epic">Epic · 250 XP</option>
          </select>
        </div>
        <div>
          <label>Quest scale</label>
          <select value={scale} onChange={(e) => setScale(e.target.value)}>
            <option value="daily">Daily Quest</option>
            <option value="weekly">Weekly Quest</option>
            <option value="epic">Epic Quest</option>
          </select>
        </div>
      </div>

      <div className="form-grid form-grid-lower">
        <div className="boss-form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isBoss}
              onChange={(e) => setIsBoss(e.target.checked)}
            />
            Launch boss battle
          </label>
        </div>
        <div>
          {isBoss && (
            <>
              <label>Boss name</label>
              <input value={bossName} onChange={(e) => setBossName(e.target.value)} placeholder="Master Python" />
            </>
          )}
        </div>
      </div>

      <div className="form-actions">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Repeats daily
        </label>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Adding…' : 'Add quest'}
        </button>
      </div>
    </motion.form>
  );
}
