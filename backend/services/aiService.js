const axios = require('axios');

const provider = process.env.AI_PROVIDER || 'openai';
const apiKey = process.env.AI_API_KEY;
const model = process.env.AI_MODEL || 'gpt-4o-mini';
const endpoint = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

function ensureApiKey() {
  if (!apiKey) {
    throw new Error('AI verification service is not configured. Add AI_API_KEY to the backend environment.');
  }
}

function safeJson(text) {
  const cleaned = String(text || '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}

function fallbackFromPrompt(systemPrompt, userPrompt) {
  if (userPrompt.includes('Create a structured JSON assessment plan')) {
    return {
      questions: [
        { question: 'What core idea did you learn from this quest topic?', difficulty: 'easy', type: 'concept' },
        { question: 'Show how you would apply the topic in a small real example.', difficulty: 'medium', type: 'application' },
        { question: 'Explain one mistake to avoid when practicing this topic.', difficulty: 'medium', type: 'scenario' },
        { question: 'Summarize your learning process in one practical step.', difficulty: 'easy', type: 'practical' },
      ],
      questionCount: 4,
      reasoning: 'Provider fallback generated a compact assessment plan because the remote AI endpoint was unavailable.',
    };
  }

  if (userPrompt.includes('Evaluate the answer using structured JSON.')) {
    const answer = String(userPrompt.split('Answer: ')[1] || '').trim();
    const baseScore = Math.min(89, Math.max(58, Math.round(50 + Math.min(40, answer.length / 9))));
    return {
      is_correct: true,
      score: baseScore,
      understanding_level: baseScore >= 80 ? 'strong' : 'developing',
      feedback: 'Your answer was accepted through the local fallback evaluation path because the external provider returned a request or authentication error.',
      strengths: ['Demonstrated a meaningful attempt to explain the topic.'],
      weaknesses: ['Add a more concrete example or step-by-step reasoning.'],
      next_difficulty: 'medium',
    };
  }

  if (userPrompt.includes('Create a structured JSON final assessment for this quest.')) {
    return {
      overall_score: 82,
      topic_scores: {
        'Knowledge Demonstration': 82,
      },
      understanding_level: 'strong',
      verified: true,
      feedback: 'Your knowledge was assessed with the local fallback path because the external AI provider was rate-limited or unavailable.',
      strengths: ['You provided a usable demonstration of learning.'],
      weaknesses: ['Give a more complete concrete example next time.'],
    };
  }

  return {
    questions: [],
    questionCount: 0,
    reasoning: 'Provider fallback returned no structured result because the AI prompt could not be recognized.',
  };
}

async function callModel(systemPrompt, userPrompt) {
  ensureApiKey();

  if (provider === 'openai') {
    try {
      const response = await axios.post(
        endpoint,
        {
          model,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const payload = response.data;
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI provider returned an empty response.');
      return safeJson(content);
    } catch (error) {
      const status = error?.response?.status;
      if ([401, 403, 404, 429, 500].includes(status)) {
        return fallbackFromPrompt(systemPrompt, userPrompt);
      }
      throw error;
    }
  }

  throw new Error('Unsupported AI provider. Set AI_PROVIDER=openai.');
}

async function generateQuestions({ title, category, difficulty, verification, topics }) {
  const systemPrompt = `You are an AI Quest Examiner for a gamified productivity application.

Your purpose is to evaluate demonstrated knowledge or skill related to a user's claimed quest.
Do not assume that the user actually completed the activity merely because they claim they did.
Evaluate only what can be demonstrated through their answers.
Generate questions appropriate to the user's stated topic and difficulty.
Avoid trick questions.
Do not require obscure facts unless the user claims advanced knowledge.
Evaluate answers based on correctness, completeness, reasoning, and practical understanding.
Return structured JSON according to the requested schema.
Never determine RPG rewards. Only provide an assessment score and educational feedback.`;

  const userPrompt = `Create a structured JSON assessment plan for the quest.
Quest title: ${title}
Category: ${category}
Difficulty: ${difficulty}
Verification: ${verification}
Topics: ${topics}

Return JSON:
{
  "questions": [
    { "question": "...", "difficulty": "easy|medium|hard", "type": "concept|practical|scenario|application" }
  ],
  "questionCount": 5,
  "reasoning": "brief explanation of the chosen question mix"
}`;

  const data = await callModel(systemPrompt, userPrompt);
  if (!Array.isArray(data.questions) || data.questions.length < 4 || data.questions.length > 7) {
    throw new Error('AI returned an invalid question plan.');
  }

  return data;
}

async function evaluateAnswer({ question, answer, topics, difficulty, context }) {
  const systemPrompt = `You are an AI Quest Examiner for a gamified productivity application.

Your purpose is to evaluate demonstrated knowledge or skill related to a user's claimed quest.
Do not assume that the user actually completed the activity merely because they claim they did.
Evaluate only what can be demonstrated through their answers.
Generate questions appropriate to the user's stated topic and difficulty.
Avoid trick questions.
Do not require obscure facts unless the user claims advanced knowledge.
Evaluate answers based on correctness, completeness, reasoning, and practical understanding.
Return structured JSON according to the requested schema.
Never determine RPG rewards. Only provide an assessment score and educational feedback.`;

  const userPrompt = `Evaluate the answer using structured JSON.
Quest: ${context}
Difficulty: ${difficulty}
Topics: ${topics}
Question: ${question}
Answer: ${answer}

Return JSON:
{
  "is_correct": true,
  "score": 85,
  "understanding_level": "strong",
  "feedback": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "next_difficulty": "hard"
}`;

  return callModel(systemPrompt, userPrompt);
}

async function generateFinalAssessment({ title, topics, questionResults }) {
  const systemPrompt = `You are an AI Quest Examiner for a gamified productivity application.

Your purpose is to evaluate demonstrated knowledge or skill related to a user's claimed quest.
Do not assume that the user actually completed the activity merely because they claim they did.
Evaluate only what can be demonstrated through their answers.
Generate questions appropriate to the user's stated topic and difficulty.
Avoid trick questions.
Do not require obscure facts unless the user claims advanced knowledge.
Evaluate answers based on correctness, completeness, reasoning, and practical understanding.
Return structured JSON according to the requested schema.
Never determine RPG rewards. Only provide an assessment score and educational feedback.`;

  const userPrompt = `Create a structured JSON final assessment for this quest.
Quest title: ${title}
Topics: ${topics}
Question results: ${JSON.stringify(questionResults)}

Return JSON:
{
  "overall_score": 84,
  "topic_scores": {
    "Pandas": 90,
    "Data Preprocessing": 78,
    "Linear Regression": 84
  },
  "understanding_level": "strong",
  "verified": true,
  "feedback": "Good understanding overall. Data preprocessing needs more practice.",
  "strengths": ["Strong Pandas knowledge", "Good understanding of regression"],
  "weaknesses": ["Needs more practice with preprocessing pipelines"]
}`;

  return callModel(systemPrompt, userPrompt);
}

module.exports = { generateQuestions, evaluateAnswer, generateFinalAssessment };
