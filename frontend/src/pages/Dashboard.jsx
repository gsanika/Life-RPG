import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CharacterPanel from '../components/CharacterPanel.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import QuestCard from '../components/QuestCard.jsx';
import QuestForm from '../components/QuestForm.jsx';
import LevelUpModal from '../components/LevelUpModal.jsx';
import RewardToast from '../components/RewardToast.jsx';
import AIQuestVerificationFlow from '../components/AIQuestVerificationFlow.jsx';

export default function Dashboard() {
  const { setUser } = useAuth();
  const [character, setCharacter] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [reward, setReward] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [verificationQuest, setVerificationQuest] = useState(null);

  const load = useCallback(async () => {
    const [charRes, questRes] = await Promise.all([api.get('/character'), api.get('/quests')]);
    setCharacter(charRes.data.character);
    setQuests(questRes.data.quests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    const { data } = await api.post('/quests', payload);
    setQuests((prev) => [{ ...data.quest, completedToday: false }, ...prev]);
    setShowForm(false);
  }

  async function handleDelete(id) {
    await api.delete(`/quests/${id}`);
    setQuests((prev) => prev.filter((q) => q._id !== id));
  }

  async function handleComplete(id) {
    const quest = quests.find((q) => q._id === id);
    if (!quest) return;

    if (quest.verification && quest.verification !== 'manual') {
      setVerificationQuest(quest);
      return;
    }

    setCompletingId(id);
    try {
      const { data } = await api.post(`/quests/${id}/complete`);

      setQuests((prev) =>
        prev.map((q) => (q._id === id ? { ...q, completedToday: true, completed: true, lastCompletedDate: new Date() } : q))
      );
      setCharacter({ ...data.character, ...data.progress });
      setUser((prevUser) => ({ ...prevUser, ...data.character }));

      setReward(data.reward);
      setTimeout(() => setReward(null), 3200);

      if (data.reward.leveledUp) {
        setTimeout(() => {
          setLevelUp({
            newLevel: data.progress.level,
            goldBonus: data.reward.levelUpGoldBonus,
            levelsGained: data.reward.levelsGained,
          });
        }, 300);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not complete that quest.');
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) return <div className="loading-screen">Loading your quest board…</div>;

  const activeQuests = quests.filter((q) => !(q.recurring ? q.completedToday : q.completed));
  const doneQuests = quests.filter((q) => (q.recurring ? q.completedToday : q.completed));

  return (
    <div className="page">
      <div className="dashboard-grid">
        <CharacterPanel character={character} />

        <div>
          <div className="quest-list-head">
            <h2>Today's Quests</h2>
            <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Close' : '+ New quest'}
            </button>
          </div>

          <AnimatePresence>
            {showForm && <QuestForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />}
          </AnimatePresence>

          {quests.length === 0 && (
            <div className="empty-state">
              <div className="glyph">🗺️</div>
              <p>No quests yet. Turn your first real-life goal into one.</p>
            </div>
          )}

          <AnimatePresence>
            {activeQuests.map((q) => (
              <QuestCard
                key={q._id}
                quest={q}
                onComplete={handleComplete}
                onDelete={handleDelete}
                completing={completingId === q._id}
              />
            ))}
          </AnimatePresence>

          {doneQuests.length > 0 && (
            <>
              <p className="panel-title" style={{ marginTop: 24 }}>
                COMPLETED
              </p>
              <AnimatePresence>
                {doneQuests.map((q) => (
                  <QuestCard key={q._id} quest={q} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>

        <StreakBadge streak={character?.streak} />
      </div>

      <RewardToast reward={reward} />
      <LevelUpModal result={levelUp} onClose={() => setLevelUp(null)} />
      {verificationQuest && (
        <AIQuestVerificationFlow
          quest={verificationQuest}
          onClose={() => setVerificationQuest(null)}
          onDone={(result) => {
            const reward = result?.reward;
            if (!reward) return;
            setReward({
              ...reward,
              score: result.score,
              knowledgeScore: result.score,
            });
            setTimeout(() => setReward(null), 3200);
            if (result.reward.leveledUp) {
              setTimeout(() => {
                setLevelUp({
                  newLevel: result.progress.level,
                  goldBonus: result.reward.levelUpGoldBonus,
                  levelsGained: result.reward.levelsGained,
                });
              }, 300);
            }
            setCharacter({ ...result.character, ...result.progress });
            setUser((prevUser) => ({ ...prevUser, ...result.character }));
            setQuests((prev) =>
              prev.map((q) => (q._id === verificationQuest._id ? { ...q, completedToday: true, completed: true, lastCompletedDate: new Date(), progress: result.score, target: verificationQuest.target } : q))
            );
            setVerificationQuest(null);
          }}
        />
      )}
    </div>
  );
}
