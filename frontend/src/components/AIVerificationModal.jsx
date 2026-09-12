import { useState } from 'react';
import api from '../api/client.js';

const QUESTION_LIBRARY = {
  assessment: [
    'What topics did you study?',
    'Explain one concept from the topic in your own words.',
    'How would you demonstrate that you understand the topic in practice?',
  ],
  coding: [
    'What programming concept did you practice?',
    'Describe the problem your code solves.',
    'Which code pattern or test would prove the solution works?',
  ],
  reading: [
    'What source or chapter did you read?',
    'What is the main idea you learned?',
    'How would you explain that idea using your own words?',
  ],
  workout: [
    'What movement or training did you complete?',
    'How did you track intensity or effort?',
    'What did the workout improve in your training plan?',
  ],
  timer: [
    'What did you focus on during the timer session?',
    'What progress did you make during that session?',
    'What is the next useful action after this session?',
  ],
  manual: [
    'What did you complete?',
    'What evidence shows the change?',
    'How did you know it was finished?',
  ],
};

function defaultQuestions(quest) {
  const type = quest?.verification || 'assessment';
  const bank = QUESTION_LIBRARY[type] || QUESTION_LIBRARY.assessment;
  return bank.map((q, index) => ({
    id: `q-${index}-${quest?._id || 'quest'}`,
    prompt: q,
    answer: '',
  }));
}

function evaluateScore(answers, questionCount) {
  const cleanAnswers = answers.filter((answer) => String(answer || '').trim().length >= 12);
  const contentScore = Math.min(80, cleanAnswers.length * 18 + Math.round(questionCount * 5));
  const detailsScore = Math.min(20, cleanAnswers.reduce((sum, answer) => sum + Math.min(8, Math.round(answer.length / 22)), 0));
  return Math.min(100, Math.max(40, Math.round(contentScore + detailsScore)));
}

export default function AIVerificationModal({ quest, onClose, onVerified }) {
  const [topics, setTopics] = useState('');
  const [questions, setQuestions] = useState(defaultQuestions(quest));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateAnswer(index, value) {
    setQuestions((prev) => prev.map((q, qIndex) => (qIndex === index ? { ...q, answer: value } : q)));
  }

  async function submit(e) {
    e.preventDefault();

    if (!topics.trim()) {
      setError('Add the topics or knowledge area you worked on.');
      return;
    }

    const answers = questions.map((q) => q.answer);
    if (answers.some((answer) => !String(answer || '').trim())) {
      setError('Answer every verification question before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/quests/${quest._id}/verify`, {
        topics,
        answers,
        verification: quest.verification,
      });

      if (onVerified) {
        await onVerified({ data, quest, topics, answers });
      }

      onClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card ai-modal">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">🤖 AI Verification</span>
            <h3>{quest.title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close verification">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="ai-form">
          <div className="ai-stage">
            <div className="ai-panel">
              <div className="ai-question-block">
                <label className="form-label">What topics did you study?</label>
                <textarea
                  className="ai-textarea"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Pandas, NumPy, preprocessing"
                />
              </div>

              {questions.map((q, index) => (
                <div className="ai-question-block" key={q.id}>
                  <label className="form-label">Question {index + 1}</label>
                  <div className="question-prompt">{q.prompt}</div>
                  <textarea
                    className="ai-textarea"
                    value={q.answer}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder="Write a short demonstration..."
                  />
                </div>
              ))}

              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="ai-reward-panel">
              <div className="ai-chip">{quest.questType || 'Quest'}</div>
              <div className="ai-chip">{quest.verification || 'manual'}</div>
              <div className="ai-reward-grid">
                <div>
                  <span className="mini-label">Quest</span>
                  <div className="mini-title">{quest.title}</div>
                </div>
                <div>
                  <span className="mini-label">Evidence</span>
                  <div className="mini-title">{quest.target || 'Knowledge Check'}</div>
                </div>
              </div>
              <div className="ai-score-preview">
                <span>AI Score</span>
                <strong>{Math.round(evaluateScore(questions.map((q) => q.answer), questions.length))}%</strong>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying…' : 'Submit evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
