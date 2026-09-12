import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client.js';

export default function AIQuestVerificationFlow({ quest, onClose, onDone }) {
  const [topics, setTopics] = useState('');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState('topics');

  async function startAssessment(e) {
    e.preventDefault();
    if (!topics.trim()) {
      setError('Tell the AI what topics or skills you practiced.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/quests/${quest._id}/ai/verify/start`, { topics });
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setStage('questions');
      setCurrent(0);
      setAnswer('');
    } catch (err) {
      setError(err.response?.data?.message || 'AI verification could not begin.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(e) {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Answer the question before sending it to the examiner.');
      return;
    }

    if (!attemptId) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/quests/${quest._id}/ai/verify/answer`, {
        attemptId,
        questionIndex: current,
        answer,
      });

      const next = current + 1;
      if (next >= questions.length) {
        const finish = await api.post(`/quests/${quest._id}/ai/verify/finish`, { attemptId });
        setResult(finish.data);
        setStage('result');
        if (onDone) onDone(finish.data);
      } else {
        setCurrent(next);
        setAnswer('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'The AI examiner could not evaluate that answer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card ai-flow-modal">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">⚔️ Prove Your Progress</span>
            <h3>AI QUEST VERIFICATION</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {stage === 'topics' && (
          <form className="ai-verification-form" onSubmit={startAssessment}>
            <div className="ai-flow-content">
              <div className="ai-flow-title-row">
                <span className="quest-title-mini">Quest: {quest.title}</span>
              </div>
              <div className="ai-flow-topics">
                <label className="form-label">What topics did you study?</label>
                <textarea className="ai-textarea" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Pandas, preprocessing, regression" />
              </div>
              <div className="ai-flow-guidance">
                <span>AI Examiner is preparing your challenge...</span>
              </div>
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Preparing…' : 'Start Assessment'}</button>
            </div>
          </form>
        )}

        {stage === 'questions' && questions.length > 0 && (
          <form className="ai-verification-form" onSubmit={submitAnswer}>
            <div className="ai-flow-content">
              <div className="ai-question-counter">Question {current + 1} / {questions.length}</div>
              <div className="ai-question-prompt">{questions[current]?.question}</div>
              <textarea className="ai-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Demonstrate your understanding..." />
              {error && <div className="form-error">{error}</div>}
              <div className="ai-eval-strip">
                {loading ? 'AI is evaluating your answer...' : 'Your knowledge will determine your reward.'}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>Exit</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Evaluating…' : 'Submit Answer'}</button>
            </div>
          </form>
        )}

        {stage === 'result' && result && (
          <div className="ai-result-view">
            <div className="ai-flow-content">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="ai-result-card">
                <div className="ai-result-title">QUEST VERIFIED ⚔️</div>
                <div className="ai-result-score">
                  <span>Knowledge Score</span>
                  <strong>{result.score || 0} / 100</strong>
                </div>
                <div className="ai-result-topic-list">
                  {result.topicScores && Object.entries(result.topicScores).map(([topic, value]) => (
                    <div className="topic-score-row" key={topic}>
                      <span>{topic}</span>
                      <div className="topic-bar-wrap">
                        <div className="topic-bar" style={{ width: `${Math.max(8, value)}%` }} />
                      </div>
                      <span className="topic-score-value">{value}%</span>
                    </div>
                  ))}
                </div>
                <div className="ai-result-rewards">
                  <strong>+{result.reward?.xpEarned || 0} XP</strong>
                  <strong>+{result.reward?.goldEarned || 0} GOLD</strong>
                  <strong>+{result.reward?.attributeGained || 0} {result.reward?.attribute || 'intellect'}</strong>
                </div>
                <div className="ai-result-feedback">
                  {result.feedback || 'Assessment complete.'}
                </div>
              </motion.div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose}>Return to Board</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
