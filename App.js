// Brain Train — root component & state machine.
//
// Same shape as FableAble's Root(): one component owns navigation state and
// game state, screens are dumb and receive everything as props/callbacks.
// The one structural difference from FableAble (a single 957-line App.js)
// is that screens live in src/screens/* — Brain Train has enough surface
// area (quiz engine + streaks + Hall of Fame + Mistake Bucket + multiple
// profiles) that a flat file would get hard to navigate fast. Services
// (Gemini, storage) are split out too, same reasoning.

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Share, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';
import { useFonts } from 'expo-font';

import { COLORS } from './src/theme/theme';
import { generateQuizPackage } from './src/services/gemini';
import * as store from './src/services/storage';

import WelcomeScreen from './src/screens/WelcomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import ProfilePickerScreen from './src/screens/ProfilePickerScreen';
import NewProfileScreen from './src/screens/NewProfileScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuizReviewScreen from './src/screens/QuizReviewScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import EngineersLogScreen from './src/screens/EngineersLogScreen';
import RepairYardScreen from './src/screens/RepairYardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  // Display font only — headlines, titles, buttons. Body text (questions,
  // explanations) intentionally stays on the system font: FredokaOne is a
  // single very heavy weight, great for short punchy text, hard to read in
  // longer sentences. See src/theme/theme.js FONT_DISPLAY for where it's
  // applied.
  const [fontsLoaded] = useFonts({
    'FredokaOne-Regular': require('./assets/Fonts/FredokaOne-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: COLORS.bg }]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <Root />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Root() {
  const [screen, setScreen] = useState('boot');
  // profile.studentName doubles as "the active profile's name" — it's the
  // storage namespace key, not just a display string. Renaming a profile
  // isn't supported (it would mean migrating every namespaced key), so
  // Settings shows it read-only; "Switch Profile" / "New Engineer" are the
  // way to change who's playing.
  const [profile, setProfile] = useState({ studentName: '', difficulty: 'Medium' });
  const [profilesList, setProfilesList] = useState([]);
  const [model, setModelState] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const [streak, setStreak] = useState({ count: 0, lastPlayed: null });
  const [hallOfFame, setHallOfFame] = useState([]);       // current profile's own history
  const [allHallOfFame, setAllHallOfFame] = useState([]); // combined, for the Engineer's Log screen
  const [mistakeBucket, setMistakeBucket] = useState([]);
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState(null);
  const [quizError, setQuizError] = useState(null);
  const [loadingStage, setLoadingStage] = useState(null);
  const abortControllerRef = useRef(null);

  // Live quiz state — mirrored to storage.saveInProgress after every change
  // so the app can be killed mid-quiz (Airplane Mode, low battery, a curious
  // sibling) and resume exactly where it left off, no network required.
  const quizRef = useRef(null); // { profileName, pkg, index, answers, score, startedAt, pausedMs }
  // answers is a fixed-length array, one slot per question (not append-only)
  // — this is what makes the set revisitable: a slot can be written,
  // rewritten, or left null (not attempted) in any order, independent of
  // navigation order.
  const [, forceRender] = useState(0);
  const bump = () => forceRender((n) => n + 1);

  useEffect(() => { boot(); }, []);

  async function boot() {
    const [key, m, profiles, inProgress] = await Promise.all([
      store.getApiKey(),
      store.getModel(),
      store.getProfiles(),
      store.loadInProgress(),
    ]);
    setHasKey(!!key);
    setModelState(m);
    setProfilesList(profiles);

    if (inProgress?.pkg && inProgress.profileName) {
      await activateProfile(inProgress.profileName);
      quizRef.current = inProgress;
      setSubject(inProgress.subject);
      setScreen('quiz');
      return;
    }

    if (!key || profiles.length === 0) {
      setScreen('welcome');
      return;
    }

    if (profiles.length === 1) {
      await activateProfile(profiles[0]);
      setScreen('dashboard');
      return;
    }

    // Multiple engineers on this device — Welcome, then the picker.
    setScreen('welcome');
  }

  // Loads one profile's namespaced data into state and remembers it as the
  // last-active profile (purely a convenience for next cold boot).
  async function activateProfile(name) {
    const [difficulty, str, hof, mistakes] = await Promise.all([
      store.getDifficulty(name),
      store.getStreak(name),
      store.getHallOfFame(name),
      store.getMistakeBucket(name),
    ]);
    setProfile({ studentName: name, difficulty });
    setStreak(str);
    setHallOfFame(hof);
    setMistakeBucket(mistakes);
    await store.setActiveProfile(name);
  }

  function handleWelcomeContinue() {
    if (!hasKey || profilesList.length === 0) { setScreen('setup'); return; }
    if (profilesList.length === 1) {
      activateProfile(profilesList[0]).then(() => setScreen('dashboard'));
      return;
    }
    setScreen('profile-picker');
  }

  // ---------------------------------------------------------------------
  // Setup (first-ever run: creates the device's API key/model AND the
  // first profile in one form) / adding another profile / Settings
  // ---------------------------------------------------------------------

  async function saveSetup({ studentName, apiKey, model: newModel, difficulty }) {
    setSaving(true);
    if (apiKey) await store.setApiKey(apiKey);
    await store.setModel(newModel);
    await store.addProfile(studentName);
    await store.setDifficulty(studentName, difficulty);
    const updated = await store.getProfiles();
    setProfilesList(updated);
    await activateProfile(studentName);
    setModelState(newModel);
    setHasKey(true);
    setSaving(false);
    setScreen('dashboard');
  }

  async function createProfile({ studentName, difficulty }) {
    setSaving(true);
    await store.addProfile(studentName);
    await store.setDifficulty(studentName, difficulty);
    const updated = await store.getProfiles();
    setProfilesList(updated);
    await activateProfile(studentName);
    setSaving(false);
    setScreen('dashboard');
  }

  async function selectProfile(name) {
    await activateProfile(name);
    setScreen('dashboard');
  }

  async function deleteProfileByName(name) {
    const updated = await store.deleteProfile(name);
    setProfilesList(updated);
  }

  async function saveSettings({ apiKey, model: newModel, difficulty }) {
    setSaving(true);
    if (apiKey) await store.setApiKey(apiKey);
    await store.setModel(newModel);
    await store.setDifficulty(profile.studentName, difficulty);
    setProfile((p) => ({ ...p, difficulty }));
    setModelState(newModel);
    setHasKey(true);
    setSaving(false);
    setScreen('dashboard');
  }

  async function resetCurrentProgress() {
    await store.resetProfileProgress(profile.studentName);
    setStreak({ count: 0, lastPlayed: null });
    setHallOfFame([]);
    setMistakeBucket([]);
  }

  async function openHallOfFame() {
    const all = await store.getAllHallOfFameEntries();
    setAllHallOfFame(all);
    setScreen('hall-of-fame');
  }

  async function markMistakeLearned(concept) {
    const next = await store.removeMistakeByConcept(profile.studentName, concept);
    setMistakeBucket(next);
  }

  // ---------------------------------------------------------------------
  // Quiz generation (Gemini Call 2 — mandatory, at most once per session
  // unless it fails and the user retries)
  // ---------------------------------------------------------------------

  async function pickSubject(subj) {
    setSubject(subj);
    setQuizError(null);
    setLoadingStage('checking-key');
    setScreen('quiz-loading');
    await runGeneration(subj);
  }

  async function runGeneration(subj) {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      setLoadingStage('checking-key');
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected || net.isInternetReachable === false) {
        setQuizError('NETWORK');
        return;
      }

      const apiKey = await store.getApiKey();
      if (!apiKey) { setQuizError('BAD_KEY'); return; }

      const bestScore = await store.getBestScore(profile.studentName);
      const weakTopics = mistakeBucket.map((m) => m.concept).slice(0, 8);
      const hallOfFameSummary = hallOfFame.length
        ? `${hallOfFame.length} quizzes completed, most recent: ${hallOfFame[0].subject} ${hallOfFame[0].score}/${hallOfFame[0].total}`
        : 'no history yet';
      const mistakeBucketSummary = mistakeBucket.length
        ? `Struggling with: ${mistakeBucket.map((m) => m.concept).join(', ')}`
        : 'no recorded mistakes yet';

      const pkg = await generateQuizPackage({
        apiKey,
        model,
        studentName: profile.studentName,
        subject: subj,
        difficulty: profile.difficulty,
        streak: streak.count,
        bestScore,
        hallOfFameSummary,
        mistakeBucketSummary,
        weakTopics,
        onStage: setLoadingStage,
        signal: controller.signal,
      });

      const state = {
        profileName: profile.studentName,
        subject: subj,
        pkg,
        index: 0,
        answers: new Array(pkg.questions.length).fill(null),
        startedAt: Date.now(),
        pausedMs: 0,
      };
      quizRef.current = state;
      await store.saveInProgress(state);
      setQuizError(null);
      setScreen('quiz');
    } catch (e) {
      if (e.message === 'CANCELLED') return; // cancelGeneration() already navigated away
      setQuizError(e.message || 'UNKNOWN');
    } finally {
      abortControllerRef.current = null;
    }
  }

  function retryQuiz() {
    setQuizError(null);
    setScreen('quiz-loading');
    runGeneration(subject);
  }

  function cancelGeneration() {
    abortControllerRef.current?.abort();
    setQuizError(null);
    setScreen('dashboard');
  }

  // ---------------------------------------------------------------------
  // Gameplay — everything below is 100% offline, per the PRD's Offline
  // Guarantee. No function in this section ever calls fetch/Network.
  // ---------------------------------------------------------------------

  function accumulatePause(deltaMs) {
    const q = quizRef.current;
    if (!q) return;
    q.pausedMs = (q.pausedMs || 0) + deltaMs;
    store.saveInProgress(q);
    // No bump() needed — this doesn't affect what's rendered, only what
    // gets persisted, and QuizScreen already ticks its own display locally.
  }

  // Records (or overwrites) the answer for whichever question is currently
  // on screen — this happens the instant an option is tapped, not on
  // "Next", so an answer sticks even if she jumps away without pressing
  // anything else. selectedIndex is null when the question was skipped.
  function recordAnswer(q, selectedIndex) {
    const question = q.pkg.questions[q.index];
    const skipped = selectedIndex === null;
    const correct = !skipped && selectedIndex === question.correct_index;
    q.answers[q.index] = {
      id: question.id,
      question: question.question,
      selectedIndex,
      selectedText: skipped ? 'Skipped' : question.options[selectedIndex],
      correctText: question.options[question.correct_index],
      correct,
      skipped,
      explanation: question.explanation,
      concept: question.concept,
    };
  }

  function selectOption(selectedIndex) {
    const q = quizRef.current;
    if (!q) return;
    recordAnswer(q, selectedIndex);
    store.saveInProgress(q);
    bump();
  }

  // Jumps to any question by position — used by Next/Previous, the tappable
  // progress dots, and the Review screen's "tap to go back" rows. This is
  // the one navigation primitive the whole revisit flow is built on.
  function jumpToQuestion(i) {
    const q = quizRef.current;
    if (!q) return;
    const total = q.pkg.questions.length;
    if (i < 0 || i >= total) return;
    q.index = i;
    store.saveInProgress(q);
    setScreen('quiz');
    bump();
  }

  function goNext() {
    const q = quizRef.current;
    if (!q) return;
    if (q.index + 1 >= q.pkg.questions.length) { openReview(); return; }
    jumpToQuestion(q.index + 1);
  }

  function goPrev() {
    jumpToQuestion((quizRef.current?.index ?? 1) - 1);
  }

  // Explicit "I don't know this one" — records it as skipped (distinct from
  // just leaving it blank) and moves on. Still fully revisitable from the
  // Review screen or the progress dots up until Submit.
  function skipQuestion() {
    const q = quizRef.current;
    if (!q) return;
    recordAnswer(q, null);
    store.saveInProgress(q);
    if (q.index + 1 >= q.pkg.questions.length) { openReview(); return; }
    jumpToQuestion(q.index + 1);
  }

  function openReview() {
    setScreen('quiz-review');
  }

  // Final commit: anything never visited/answered is normalized to a
  // skipped entry (so scoring and Results always see a dense, one-per-
  // question array), then the quiz is scored and closed out.
  async function submitQuiz() {
    const q = quizRef.current;
    if (!q) return;
    q.pkg.questions.forEach((question, i) => {
      if (!q.answers[i]) {
        q.answers[i] = {
          id: question.id,
          question: question.question,
          selectedIndex: null,
          selectedText: 'Skipped',
          correctText: question.options[question.correct_index],
          correct: false,
          skipped: true,
          explanation: question.explanation,
          concept: question.concept,
        };
      }
    });
    await finalizeQuiz(q);
  }

  async function finalizeQuiz(q) {
    const total = q.pkg.questions.length;
    q.score = q.answers.filter((a) => a.correct).length;
    const wrongOnes = q.answers.filter((a) => !a.correct); // includes skipped
    const rightOnes = q.answers.filter((a) => a.correct);

    const [streakResult, hofResult] = await Promise.all([
      store.recordQuizCompletionForStreak(q.profileName),
      store.addHallOfFameEntry(q.profileName, { subject: q.subject, difficulty: profile.difficulty, score: q.score, total }),
    ]);

    // Mistake Bucket entries are read-modify-write on the same AsyncStorage
    // key — these must run sequentially, not via Promise.all, or concurrent
    // writes can silently clobber each other (lost-update race).
    await store.addMistakes(q.profileName, wrongOnes.map((a) => ({ concept: a.concept, question: a.question, explanation: a.explanation, subject: q.subject })));
    for (const a of rightOnes) {
      await store.removeMistakeByConcept(q.profileName, a.concept);
      await store.markConceptMastered(q.profileName, a.concept, a.question);
    }

    setStreak({ count: streakResult.count, lastPlayed: streakResult.lastPlayed });
    setHallOfFame(hofResult.list);
    setMistakeBucket(await store.getMistakeBucket(q.profileName));

    quizRef.current = {
      ...q,
      _final: { streakInfo: streakResult, isNewHighScore: hofResult.isNewHighScore },
    };
    await store.clearInProgress();
    setScreen('results');
    bump();
  }

  async function shareResults() {
    const q = quizRef.current;
    if (!q) return;
    const total = q.pkg.questions.length;
    try {
      await Share.share({
        message: `🚂 All Aboard! ${profile.studentName} scored ${q.score}/${total} on the ${q.subject} Brain Train Olympiad quiz!`,
      });
    } catch (e) { /* user cancelled or share unavailable — no-op */ }
  }

  function backToDashboard() {
    quizRef.current = null;
    setQuizError(null);
    setScreen('dashboard');
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  if (screen === 'boot') {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (screen === 'welcome') {
    return <WelcomeScreen returning={profilesList.length > 0} onContinue={handleWelcomeContinue} />;
  }

  if (screen === 'setup') {
    return <SetupScreen initial={{ ...profile, model, hasKey }} saving={saving} onSave={saveSetup} />;
  }

  if (screen === 'profile-picker') {
    return (
      <ProfilePickerScreen
        profiles={profilesList}
        onSelect={selectProfile}
        onAddNew={() => setScreen('new-profile')}
        onDelete={deleteProfileByName}
      />
    );
  }

  if (screen === 'new-profile') {
    return (
      <NewProfileScreen
        saving={saving}
        onSave={createProfile}
        onBack={() => setScreen(profilesList.length ? 'profile-picker' : 'welcome')}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        current={{ ...profile, model }}
        saving={saving}
        onSave={saveSettings}
        onBack={() => setScreen('dashboard')}
        onSwitchProfile={() => setScreen('profile-picker')}
        onReset={resetCurrentProgress}
      />
    );
  }

  if (screen === 'dashboard') {
    return (
      <DashboardScreen
        studentName={profile.studentName}
        streak={streak.count}
        bestScore={hallOfFame.reduce((m, e) => Math.max(m, e.score || 0), null)}
        mistakeCount={mistakeBucket.length}
        onPickSubject={pickSubject}
        onOpenHallOfFame={openHallOfFame}
        onOpenRepairYard={() => setScreen('repair-yard')}
        onOpenSettings={() => setScreen('settings')}
      />
    );
  }

  if (screen === 'quiz-loading') {
    return (
      <LoadingScreen
        error={quizError}
        stage={loadingStage}
        onRetry={retryQuiz}
        onOpenSettings={() => setScreen('settings')}
        onCancel={cancelGeneration}
      />
    );
  }

  if (screen === 'quiz') {
    const q = quizRef.current;
    if (!q) { setScreen('dashboard'); return null; }
    return (
      <QuizScreen
        subject={q.subject}
        index={q.index}
        total={q.pkg.questions.length}
        question={q.pkg.questions[q.index]}
        existingAnswer={q.answers[q.index]}
        answers={q.answers}
        isLast={q.index + 1 >= q.pkg.questions.length}
        onSelectOption={selectOption}
        onSkip={skipQuestion}
        onNext={goNext}
        onPrev={goPrev}
        onJumpTo={jumpToQuestion}
        onOpenReview={openReview}
        startedAt={q.startedAt}
        pausedMs={q.pausedMs || 0}
        onAccumulatePause={accumulatePause}
      />
    );
  }

  if (screen === 'quiz-review') {
    const q = quizRef.current;
    if (!q) { setScreen('dashboard'); return null; }
    return (
      <QuizReviewScreen
        subject={q.subject}
        questions={q.pkg.questions}
        answers={q.answers}
        onJumpTo={jumpToQuestion}
        onSubmit={submitQuiz}
        onBack={() => setScreen('quiz')}
      />
    );
  }

  if (screen === 'results') {
    const q = quizRef.current;
    if (!q?._final) { setScreen('dashboard'); return null; }
    return (
      <ResultsScreen
        subject={q.subject}
        score={q.score}
        total={q.pkg.questions.length}
        pkg={q.pkg}
        answers={q.answers}
        streakInfo={q._final.streakInfo}
        isNewHighScore={q._final.isNewHighScore}
        onShare={shareResults}
        onDone={backToDashboard}
      />
    );
  }

  if (screen === 'hall-of-fame') {
    return <EngineersLogScreen entries={allHallOfFame} onBack={() => setScreen('dashboard')} />;
  }

  if (screen === 'repair-yard') {
    return <RepairYardScreen mistakes={mistakeBucket} onBack={() => setScreen('dashboard')} onMarkLearned={markMistakeLearned} />;
  }

  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
