// Gemini service — Brain Train
//
// Ported from FableAble's proven callGemini() pattern (native structured
// output via responseSchema, explicit safety settings, defensive JSON
// parsing as a backstop, and a small error taxonomy the UI can branch on).
//
// [DEVIATION FROM FABLEABLE] FableAble sets thinkingConfig.thinkingBudget = 0
// on every call because it's a creative story where "correctness" doesn't
// exist and the user is waiting live, chapter to chapter. Brain Train's
// Quiz Session Package must be factually correct (Olympiad answer keys,
// explanations) and is generated once up-front behind a loading screen —
// latency matters far less than accuracy here. We do NOT disable thinking
// for the mandatory quiz-generation call. If quiz generation ever feels too
// slow in testing, this is the first knob to revisit.

const QUESTION_COUNT = 20;

// [FIX] Model is configurable, never hardcoded past this default. Verified
// live against https://ai.google.dev/gemini-api/docs/models on 2026-07-18:
// gemini-3.5-flash is GA/stable with no published shutdown date, and is
// Google's current recommendation for agentic + structured-output tasks —
// a good fit for reliable JSON quiz generation. If it ever retires, swap
// the default here and the app keeps working (model is also editable from
// Settings without a code change, per the PRD).
export const DEFAULT_MODEL = 'gemini-3.5-flash';

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

// Native structured output schema — mirrors the PRD's Required JSON Contract
// exactly. This does the heavy lifting FableAble's simple {story_text,
// options} schema didn't need to: it constrains Gemini to always return a
// question count, option count, and field set the app can trust without
// guessing.
const QUESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    id: { type: 'STRING' },
    question: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correct_index: { type: 'INTEGER' },
    explanation: { type: 'STRING' },
    concept: { type: 'STRING' },
  },
  required: ['id', 'question', 'options', 'correct_index', 'explanation', 'concept'],
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    metadata: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING' },
        difficulty: { type: 'STRING' },
        generated_at: { type: 'STRING' },
        version: { type: 'INTEGER' },
      },
      required: ['subject', 'difficulty', 'generated_at', 'version'],
    },
    intro: { type: 'STRING' },
    coach_tip: { type: 'STRING' },
    achievement_messages: {
      type: 'OBJECT',
      properties: {
        new_streak: { type: 'STRING' },
        new_high_score: { type: 'STRING' },
        perfect_score: { type: 'STRING' },
        mastery_completed: { type: 'STRING' },
      },
      required: ['new_streak', 'new_high_score', 'perfect_score', 'mastery_completed'],
    },
    score_feedback: {
      type: 'OBJECT',
      properties: {
        '0-11': { type: 'STRING' },
        '12-15': { type: 'STRING' },
        '16-18': { type: 'STRING' },
        '19': { type: 'STRING' },
        '20': { type: 'STRING' },
      },
      required: ['0-11', '12-15', '16-18', '19', '20'],
    },
    questions: { type: 'ARRAY', items: QUESTION_SCHEMA },
    answer_key: { type: 'ARRAY', items: { type: 'INTEGER' } },
  },
  required: [
    'metadata', 'intro', 'coach_tip', 'achievement_messages',
    'score_feedback', 'questions', 'answer_key',
  ],
};

function buildSystemInstruction({ studentName, subject, difficulty }) {
  return [
    `You are a warm, encouraging Olympiad coach for ${studentName}, an advanced Grade 2 student in India,`,
    `preparing for the ${subject} Olympiad at "${difficulty}" difficulty.`,
    `Generate exactly ${QUESTION_COUNT} multiple-choice questions, all age-appropriate,`,
    `factually correct, and suitable for a curious 7-8 year old — no content that would frighten or discourage a child.`,
    `Every question must have exactly 4 options with exactly one correct answer.`,
    `"correct_index" is zero-based (0-3) and MUST match the same position in the top-level "answer_key" array`,
    `(answer_key[i] must equal questions[i].correct_index for every i, in order).`,
    `Each explanation should teach the underlying concept in 1-2 friendly sentences a child can understand,`,
    `not just restate the correct option.`,
    `The whole experience uses a train-journey theme ("All Aboard!", "Depart Now", "Express Service!") —`,
    `let intro, coach_tip, achievement_messages, and score_feedback reflect that playful, non-corporate voice.`,
    `Never repeat a question concept twice within the same set.`,
    // [PRIVACY] Keep the real student's name out of generic question/word-
    // problem content — this app gets shared as an APK, and question text
    // (unlike the coach's intro) can end up on someone else's screen or in
    // a screen recording. A different random name each time avoids that.
    `IMPORTANT: You may address ${studentName} by name ONLY in "intro", "coach_tip", "achievement_messages",`,
    `and "score_feedback" — never inside "question", "options", or "explanation" text. If a question or`,
    `word problem needs a person's name, invent a different ordinary first name each time (vary them —`,
    `don't reuse one name across the set), and never use "${studentName}" for that purpose.`,
  ].join(' ');
}

function buildUserPrompt({
  studentName, subject, difficulty, streak, bestScore,
  hallOfFameSummary, mistakeBucketSummary, weakTopics,
}) {
  return [
    `Student: ${studentName}`,
    `Subject: ${subject}`,
    `Difficulty: ${difficulty}`,
    `Current streak: ${streak ?? 0} day(s)`,
    `Best score so far: ${bestScore != null ? `${bestScore}/${QUESTION_COUNT}` : 'none yet'}`,
    `Hall of Fame summary: ${hallOfFameSummary || 'no history yet'}`,
    `Mistake Bucket summary: ${mistakeBucketSummary || 'no recorded mistakes yet'}`,
    `Weak topics to gently reinforce this session: ${weakTopics && weakTopics.length ? weakTopics.join(', ') : 'none identified yet'}`,
    `Generate this student's personalized Quiz Session Package now.`,
  ].join('\n');
}

// Defensive JSON parse — kept as a backstop even though responseSchema
// should already force clean JSON. Same rationale as FableAble: models
// occasionally wrap output in ``` fences despite responseMimeType.
function safeParseJson(raw) {
  if (!raw) throw new Error('EMPTY');
  let t = raw.trim();
  if (t.startsWith('```')) t = t.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1) t = t.slice(first, last + 1);
  return JSON.parse(t);
}

function validatePackage(pkg) {
  if (!pkg || !Array.isArray(pkg.questions) || !Array.isArray(pkg.answer_key)) {
    throw new Error('VALIDATION_SHAPE');
  }
  if (pkg.questions.length !== QUESTION_COUNT || pkg.answer_key.length !== QUESTION_COUNT) {
    throw new Error('VALIDATION_COUNT');
  }
  for (let i = 0; i < pkg.questions.length; i++) {
    const q = pkg.questions[i];
    if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error('VALIDATION_OPTIONS');
    if (q.correct_index < 0 || q.correct_index > 3) throw new Error('VALIDATION_INDEX');
    if (q.correct_index !== pkg.answer_key[i]) throw new Error('VALIDATION_MISMATCH');
  }
  return true;
}

// onStage(stage) fires at real, event-driven checkpoints — 'sending' right
// before the network call, 'receiving' once a response has arrived,
// 'validating' before the JSON contract check — so LoadingScreen can show
// what's actually happening instead of one silent spinner for 20+ seconds.
// signal is a standard AbortSignal so the user can back out while Gemini is
// still "thinking" (fetch supports this natively).
async function callGeminiRaw({ apiKey, model, systemInstruction, userPrompt, onStage, signal }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.8,
      maxOutputTokens: 8192,
    },
  };

  let res;
  try {
    onStage?.('sending');
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('CANCELLED');
    throw new Error('NETWORK');
  }

  onStage?.('receiving');

  if (res.status === 404) throw new Error('MODEL_404'); // retired/typo'd model id
  if (res.status === 400 || res.status === 403) throw new Error('BAD_KEY');
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('API_' + res.status);

  const data = await res.json();

  if (data?.promptFeedback?.blockReason) throw new Error('BLOCKED');
  const cand = data?.candidates?.[0];
  if (!cand || cand.finishReason === 'SAFETY') throw new Error('BLOCKED');
  if (cand.finishReason === 'MAX_TOKENS') throw new Error('TRUNCATED');

  onStage?.('validating');
  const text = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
  return safeParseJson(text);
}

// Call 2 (Mandatory): Quiz Session Package.
// Retries once on validation failure (regenerates from scratch — simpler
// and more reliable than asking the model to "patch" its own malformed
// JSON). Throws a typed error string on final failure so the UI can show a
// specific, honest message instead of a generic crash screen.
export async function generateQuizPackage(params) {
  const systemInstruction = buildSystemInstruction(params);
  const userPrompt = buildUserPrompt(params);

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const pkg = await callGeminiRaw({
        apiKey: params.apiKey,
        model: params.model || DEFAULT_MODEL,
        systemInstruction,
        userPrompt,
        onStage: params.onStage,
        signal: params.signal,
      });
      validatePackage(pkg);
      return pkg;
    } catch (e) {
      lastErr = e;
      // Cancellation should never retry, and network/auth/blocked errors
      // won't fix themselves on a second try within the same session —
      // only validation failures (a malformed payload) are worth retrying.
      if (e.message === 'CANCELLED') break;
      if (!String(e.message).startsWith('VALIDATION') && e.message !== 'EMPTY') break;
    }
  }
  throw lastErr;
}

export { QUESTION_COUNT };
